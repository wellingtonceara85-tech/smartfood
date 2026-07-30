import fs from 'node:fs';
import path from 'node:path';

export const uploadsDir = path.join(process.cwd(), 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });
