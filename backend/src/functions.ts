import { onRequest } from 'firebase-functions/v2/https';
import { app } from './app';

export const api = onRequest(
  {
    region: 'southamerica-east1',
    secrets: ['DATABASE_URL', 'JWT_SECRET'],
  },
  app,
);
