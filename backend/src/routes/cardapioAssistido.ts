import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Request, Response, Router } from 'express';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import {
  criarMulterLocal,
  receberArquivoDeRawBody,
  rodandoNoCloudFunctions,
} from '../multipartUpload';
import { privateUploadsDir } from '../privateUploads';
import { prisma } from '../prisma';

export const cardapioAssistidoRouter = Router();
cardapioAssistidoRouter.use(requireAuth);

const LIMITE_ARQUIVO_BYTES = 10 * 1024 * 1024;
const MIMETYPES_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

function lojaIdOuErro(req: Request, res: Response): string | null {
  const lojaId = lojaIdDoUsuario(req);
  if (!lojaId) {
    res.status(403).json({ erro: 'Usuário não está vinculado a nenhuma loja' });
    return null;
  }
  return lojaId;
}

function origemPorMimetype(mimetype: string): 'pdf' | 'imagem' {
  return mimetype === 'application/pdf' ? 'pdf' : 'imagem';
}

/**
 * Salva o arquivo em storage PRIVADO — nunca público, diferente do upload de
 * fotos de produto/logo (routes/upload.ts). Retorna a chave interna usada
 * depois só pelo endpoint autenticado do Admin Master pra reler o arquivo.
 */
async function salvarArquivoPrivado(buffer: Buffer, nomeOriginal: string): Promise<string> {
  const extensao = path.extname(nomeOriginal).toLowerCase();
  const chave = `${crypto.randomUUID()}${extensao}`;

  if (rodandoNoCloudFunctions) {
    const { garantirFirebaseApp } = await import('../firebaseAdmin');
    const { getStorage } = await import('firebase-admin/storage');
    garantirFirebaseApp();
    const bucket = getStorage().bucket();
    // Sem makePublic() de propósito — este arquivo nunca deve ser acessível por URL direta.
    await bucket.file(`cardapio-assistido/${chave}`).save(buffer);
    return `cardapio-assistido/${chave}`;
  }

  await fs.writeFile(path.join(privateUploadsDir, chave), buffer);
  return chave;
}

async function processarUpload(
  lojaId: string,
  buffer: Buffer,
  nomeOriginal: string,
  mimetype: string,
  res: Response,
) {
  const arquivoStorageKey = await salvarArquivoPrivado(buffer, nomeOriginal);
  const solicitacao = await prisma.solicitacaoCardapioAssistido.create({
    data: {
      lojaId,
      origem: origemPorMimetype(mimetype),
      arquivoStorageKey,
      nomeArquivoOriginal: nomeOriginal,
      mimetype,
    },
  });
  res.status(201).json(solicitacao);
}

if (rodandoNoCloudFunctions) {
  cardapioAssistidoRouter.post('/solicitacoes', async (req, res) => {
    const lojaId = lojaIdOuErro(req, res);
    if (!lojaId) return;
    try {
      const arquivo = await receberArquivoDeRawBody(req, 'arquivo', {
        maxBytes: LIMITE_ARQUIVO_BYTES,
        mimetypesPermitidos: MIMETYPES_PERMITIDOS,
      });
      if (!arquivo) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      await processarUpload(lojaId, arquivo.buffer, arquivo.nomeOriginal, arquivo.mimetype, res);
    } catch (error) {
      res
        .status(400)
        .json({ erro: error instanceof Error ? error.message : 'Erro ao enviar arquivo' });
    }
  });
} else {
  const upload = criarMulterLocal({
    maxBytes: LIMITE_ARQUIVO_BYTES,
    mimetypesPermitidos: MIMETYPES_PERMITIDOS,
  });

  cardapioAssistidoRouter.post('/solicitacoes', upload.single('arquivo'), async (req, res) => {
    const lojaId = lojaIdOuErro(req, res);
    if (!lojaId) return;
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    try {
      await processarUpload(lojaId, req.file.buffer, req.file.originalname, req.file.mimetype, res);
    } catch (error) {
      res
        .status(400)
        .json({ erro: error instanceof Error ? error.message : 'Erro ao enviar arquivo' });
    }
  });

  cardapioAssistidoRouter.use(
    (error: Error, _req: Request, res: Response, _next: import('express').NextFunction) => {
      res.status(400).json({ erro: error.message });
    },
  );
}

cardapioAssistidoRouter.get('/solicitacoes', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const solicitacoes = await prisma.solicitacaoCardapioAssistido.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      origem: true,
      nomeArquivoOriginal: true,
      status: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
  res.json(solicitacoes);
});
