import fs from 'node:fs';
import path from 'node:path';

// Diretório separado de `uploads.ts` (que é servido publicamente em `/uploads`
// via express.static) — nada aqui pode ficar acessível por URL pública. Só
// usado pelo cardápio assistido (PDF/imagem enviado pelo lojista pra revisão
// humana), nunca pelas fotos de produto/logo (essas continuam públicas de
// propósito, sem mudança).
export const privateUploadsDir = path.join(process.cwd(), 'private-uploads');

fs.mkdirSync(privateUploadsDir, { recursive: true });
