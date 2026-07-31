# SmartFood

Cardápio digital público por loja (MVP), inspirado no whatsmenu.com.br: o cliente abre o link da loja (`/:slug`), monta o pedido e finaliza direto no WhatsApp do estabelecimento — sem checkout online, sem pagamento integrado. O dono da loja tem um painel simples pra cadastrar produtos e controlar disponibilidade em tempo real. **Software proprietário** — ver [LICENSE](LICENSE).

Escopo completo em [PROMPT_CLAUDE_CODE_SMARTFOOD_MVP.md](PROMPT_CLAUDE_CODE_SMARTFOOD_MVP.md).

## Stack

- **Backend**: Node.js + Express + TypeScript, tabelas simples (`loja_id` como FK)
- **Banco**: PostgreSQL + Prisma, schema único
- **Frontend**: React (Vite) + TypeScript + Tailwind
- **Auth**: JWT (Access + Refresh Token), RBAC simples (`dono_loja`, `admin_master`)
- **Infra local**: Docker Compose (Postgres + backend + frontend)

## Estrutura do repositório

```
backend/    → API Express (src/routes, src/prisma, prisma/schema.prisma)
frontend/   → React (Vite) — página pública /:slug e painel do lojista em /painel
docs/       → histórico da fase anterior de arquitetura (não gerar documentos novos aqui)
backlog/    → histórico da fase anterior de arquitetura
```

## Rodando localmente

Pré-requisitos: Node 20, Docker.

```bash
cp .env.example .env        # ajustar JWT_SECRET antes de qualquer ambiente real
docker compose up --build
```

Isso sobe Postgres, roda as migrations automaticamente, e sobe backend (`:3001`) e frontend (`:3000`).

- API: http://localhost:3001
- Health check: http://localhost:3001/health
- Frontend: http://localhost:3000

### Sem Docker

```bash
# backend
cp backend/.env.example backend/.env
cd backend && npm install && npm run prisma:migrate && npm run prisma:seed && npm run dev

# frontend (outro terminal)
cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run dev
```

O seed cria a loja `lanchonete-teste` (`/lanchonete-teste`) e o usuário `dono@lanchonete-teste.com` / senha `123456` para testar o painel em `/login`.

## CI

Todo push/PR para `main` e `develop` roda build de backend e frontend contra um Postgres real via GitHub Actions (`.github/workflows/ci.yml`).

## Deploy (Firebase + Neon — fase de demonstração)

Escopo completo em [PROMPT_CLAUDE_CODE_SMARTFOOD_DEPLOY_FIREBASE_NEON.md](PROMPT_CLAUDE_CODE_SMARTFOOD_DEPLOY_FIREBASE_NEON.md). Custo esperado no volume atual: **US$ 0**. Ao fechar a primeira venda, migrar para um provedor always-on é só trocar variáveis de ambiente — nenhum código de produto muda.

- **Banco**: Neon (Postgres serverless, free tier) — projeto `smartfood`, região `sa-east-1`. `DATABASE_URL` usa a connection string **com pooler** (`-pooler` no host).
- **Backend**: Express existente rodando dentro de uma Cloud Function (`backend/src/functions.ts`, `onRequest`), deploy via `firebase deploy --only functions`. Fonte configurada em `firebase.json` (`functions.source: "backend"`).
- **Upload de fotos**: dual-mode automático — disco local em dev/Docker, Firebase Storage quando roda em Cloud Functions (detecta `process.env.K_SERVICE`). Sem toggle manual.
- **Frontend**: build estático do Vite (`frontend/dist`) no Firebase Hosting, `VITE_API_URL` apontando para a URL da function.
- **Projeto Firebase**: `smartfood-3ab25` (plano Blaze).

URLs atuais:

- Frontend: https://smartfood-3ab25.web.app
- API: https://southamerica-east1-smartfood-3ab25.cloudfunctions.net/api

### Redeploy manual

```bash
# backend
firebase deploy --only functions

# frontend
cd frontend && VITE_API_URL="https://southamerica-east1-smartfood-3ab25.cloudfunctions.net/api" npx vite build
cd .. && firebase deploy --only hosting
```

Secrets da function (`DATABASE_URL`, `JWT_SECRET`) já configurados via `firebase functions:secrets:set` — não versionados, vivem só no Secret Manager. Variáveis não-sensíveis (`CORS_ORIGIN`) ficam em `backend/.env.smartfood-3ab25` (versionado, sem segredo).

### Deploy automático (GitHub Actions) — pendente 1 passo manual

O workflow `.github/workflows/deploy.yml` já dispara em todo push pra `main`, mas precisa do secret `FIREBASE_SERVICE_ACCOUNT_SMARTFOOD` no GitHub (JSON de uma service account com permissão de deploy). Faltou configurar isso porque exige criar a service account com os papéis certos, algo que não dá pra fazer com segurança sem CLI do gcloud disponível. Passo a passo:

```bash
firebase init hosting:github
```

Rodar interativamente na raiz do repo — ele cria a service account, concede os papéis certos e já configura o secret no GitHub automaticamente (repo já autenticado via `gh`). Selecionar o projeto `smartfood-3ab25` e o repo `wellingtonceara85-tech/smartfood`.

## Branches

- `main` — sempre deployável, dispara CI
- `develop` — integração entre features
- `feature/*` — uma por incremento
