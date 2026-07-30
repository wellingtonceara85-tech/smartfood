import { app } from './app';
import { env } from './env';

app.listen(env.port, () => {
  console.log(`SmartFood backend rodando na porta ${env.port}`);
});
