import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './env';
import { adminRouter } from './routes/admin';
import { adminMasterRouter } from './routes/adminMaster';
import { authRouter } from './routes/auth';
import { cardapioAssistidoRouter } from './routes/cardapioAssistido';
import { onboardingRouter } from './routes/onboarding';
import { publicRouter } from './routes/public';
import { rascunhoCardapioRouter } from './routes/rascunhoCardapio';
import { sugestoesRouter } from './routes/sugestoes';
import { uploadRouter } from './routes/upload';
import { uploadsDir } from './uploads';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/upload', uploadRouter);
app.use('/api/admin/onboarding', onboardingRouter);
app.use('/api/admin/rascunho-cardapio', rascunhoCardapioRouter);
app.use('/api/admin/cardapio-assistido', cardapioAssistidoRouter);
app.use('/api/admin/sugestoes', sugestoesRouter);
app.use('/api/admin-master', adminMasterRouter);

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});
