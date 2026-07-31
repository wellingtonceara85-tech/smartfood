import 'dotenv/config';

// Não lança erro em falta de variável no carregamento do módulo: no Cloud Functions v2,
// secrets só são injetados no processo em tempo de requisição, não durante a fase de
// descoberta do `firebase deploy` (que já importa este módulo). Lido via getter para
// pegar o valor mais recente de process.env no momento do uso, não no import.
function lido(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  get databaseUrl() {
    return lido('DATABASE_URL');
  },
  get jwtSecret() {
    return lido('JWT_SECRET');
  },
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  get corsOrigin() {
    return lido('CORS_ORIGIN', '*')
      .split(',')
      .map((origem) => origem.trim());
  },
  get frontendUrl() {
    return lido('FRONTEND_URL', 'http://localhost:3000');
  },
};
