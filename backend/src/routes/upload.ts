import crypto from 'node:crypto';
import path from 'node:path';
import busboy from 'busboy';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadsDir } from '../uploads';

// No Cloud Functions (Gen 2), K_SERVICE é injetado automaticamente pelo runtime.
// Localmente (docker-compose / tsx dev) essa variável não existe, então o upload
// continua indo pro disco local sem precisar de nenhuma configuração extra.
const rodandoNoCloudFunctions = Boolean(process.env.K_SERVICE);

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

async function enviarParaFirebaseStorage(
  buffer: Buffer,
  nomeOriginal: string,
  mimetype: string,
): Promise<string> {
  const { garantirFirebaseApp } = await import('../firebaseAdmin');
  const { getStorage } = await import('firebase-admin/storage');
  garantirFirebaseApp();

  const extensao = path.extname(nomeOriginal).toLowerCase();
  const nomeArquivo = `uploads/${crypto.randomUUID()}${extensao}`;
  const bucket = getStorage().bucket();
  const arquivo = bucket.file(nomeArquivo);

  await arquivo.save(buffer, { metadata: { contentType: mimetype } });
  await arquivo.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;
}

interface ArquivoRecebido {
  buffer: Buffer;
  nomeOriginal: string;
  mimetype: string;
}

// O Functions Framework já consome o stream da requisição pra montar `req.rawBody`
// antes de chamar o app Express, então o multer (que também lê o stream) nunca vê
// dados. Por isso, em Cloud Functions, o multipart é parseado manualmente a partir
// de `req.rawBody` com busboy — fora daqui, o multer funciona normalmente.
function parseMultipartDeRawBody(req: Request): Promise<ArquivoRecebido | null> {
  return new Promise((resolve, reject) => {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      resolve(null);
      return;
    }

    const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
    let arquivo: ArquivoRecebido | null = null;

    bb.on('file', (_nome, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        arquivo = {
          buffer: Buffer.concat(chunks),
          nomeOriginal: info.filename,
          mimetype: info.mimeType,
        };
      });
    });
    bb.on('error', reject);
    bb.on('finish', () => resolve(arquivo));

    bb.end(rawBody);
  });
}

if (rodandoNoCloudFunctions) {
  uploadRouter.post('/', async (req, res) => {
    try {
      const arquivo = await parseMultipartDeRawBody(req);
      if (!arquivo) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      }
      if (!arquivo.mimetype.startsWith('image/')) {
        return res.status(400).json({ erro: 'Apenas arquivos de imagem são permitidos' });
      }

      const url = await enviarParaFirebaseStorage(
        arquivo.buffer,
        arquivo.nomeOriginal,
        arquivo.mimetype,
      );
      res.status(201).json({ url });
    } catch (error) {
      res
        .status(400)
        .json({ erro: error instanceof Error ? error.message : 'Erro ao enviar imagem' });
    }
  });
} else {
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (_req, file, callback) => {
        const extensao = path.extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extensao}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        callback(new Error('Apenas arquivos de imagem são permitidos'));
        return;
      }
      callback(null, true);
    },
  });

  uploadRouter.post('/', upload.single('foto'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });

  uploadRouter.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ erro: error.message });
  });
}
