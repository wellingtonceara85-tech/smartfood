# SmartFood — backend (NestJS, Monólito Modular — ADR-0019)
# Multi-stage build: instala deps + gera Prisma Client + compila, depois usa `pnpm deploy`
# para produzir um node_modules autocontido (sem symlinks relativos ao workspace) para produção.

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile=false --filter @smartfood/backend...

FROM deps AS build
COPY backend ./backend
WORKDIR /app/backend
RUN pnpm prisma:generate
RUN pnpm build

FROM build AS deploy
WORKDIR /app
RUN pnpm --filter @smartfood/backend deploy /app/deployed-backend
WORKDIR /app/deployed-backend
RUN npx prisma generate

FROM node:20-slim AS runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy /app/deployed-backend/dist ./dist
COPY --from=deploy /app/deployed-backend/node_modules ./node_modules
COPY --from=deploy /app/deployed-backend/prisma ./prisma
COPY --from=deploy /app/deployed-backend/package.json ./package.json

EXPOSE 3001
# migrate deploy + seed (idempotente, upsert) rodam a cada start — necessário em plataformas
# como Railway, que não têm o hook de `command:` que o docker-compose local usa para isso.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
