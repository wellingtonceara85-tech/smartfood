import busboy from 'busboy';
import { Request } from 'express';
import multer from 'multer';

// Mesma constatação de routes/upload.ts: no Cloud Functions (Gen 2), o
// Functions Framework já consome o stream da requisição pra montar
// `req.rawBody` antes do Express ver o multipart, então o multer nunca
// recebe dados lá — precisa parsear manualmente com busboy a partir de
// `req.rawBody`. Fora disso (docker-compose/tsx local), multer funciona normal.
export const rodandoNoCloudFunctions = Boolean(process.env.K_SERVICE);

export interface ArquivoRecebido {
  buffer: Buffer;
  nomeOriginal: string;
  mimetype: string;
}

export interface OpcoesUpload {
  maxBytes: number;
  mimetypesPermitidos: string[];
}

/** Só usado no branch Cloud Functions — parseia manualmente `req.rawBody`. */
export function receberArquivoDeRawBody(
  req: Request,
  campo: string,
  opcoes: OpcoesUpload,
): Promise<ArquivoRecebido | null> {
  return new Promise((resolve, reject) => {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      resolve(null);
      return;
    }

    const bb = busboy({ headers: req.headers, limits: { fileSize: opcoes.maxBytes } });
    let arquivo: ArquivoRecebido | null = null;
    let campoNaoBate = false;

    bb.on('file', (nomeCampo, stream, info) => {
      if (nomeCampo !== campo) {
        campoNaoBate = true;
        stream.resume();
        return;
      }
      if (
        opcoes.mimetypesPermitidos.length > 0 &&
        !opcoes.mimetypesPermitidos.includes(info.mimeType)
      ) {
        stream.resume();
        reject(new Error('Tipo de arquivo não permitido'));
        return;
      }
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
    bb.on('finish', () => resolve(campoNaoBate ? null : arquivo));

    bb.end(rawBody);
  });
}

/** Usado no branch local (docker-compose/tsx) como middleware do Express — mantém em memória, quem chama decide onde persistir. */
export function criarMulterLocal(opcoes: OpcoesUpload) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: opcoes.maxBytes },
    fileFilter: (_req, file, callback) => {
      if (
        opcoes.mimetypesPermitidos.length > 0 &&
        !opcoes.mimetypesPermitidos.includes(file.mimetype)
      ) {
        callback(new Error('Tipo de arquivo não permitido'));
        return;
      }
      callback(null, true);
    },
  });
}
