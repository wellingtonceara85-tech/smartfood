import crypto from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadsDir } from '../uploads';

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extensao}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Apenas arquivos de imagem são permitidos'));
      return;
    }
    callback(null, true);
  },
});

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

uploadRouter.post('/', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

uploadRouter.use(
  (
    error: Error,
    _req: import('express').Request,
    res: import('express').Response,
    _next: import('express').NextFunction,
  ) => {
    res.status(400).json({ erro: error.message });
  },
);
