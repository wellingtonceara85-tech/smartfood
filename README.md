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

## Deploy (Railway)

1. Login em [railway.app](https://railway.app) com a conta GitHub.
2. **New Project → Deploy from GitHub repo** → selecionar `smartfood` (branch `main`).
3. O Railway detecta `railway.json` na raiz (builder Dockerfile, aponta para `backend/Dockerfile`).
4. **New → Database → PostgreSQL** no mesmo projeto Railway.
5. No serviço do backend, aba **Variables**: `DATABASE_URL` (referenciar `${{Postgres.DATABASE_URL}}`), `JWT_SECRET` (gerar valor forte, ex. `openssl rand -base64 48`), `CORS_ORIGIN` (URL do frontend), `NODE_ENV=production`.
6. Deploy. O `CMD` da imagem já roda `prisma migrate deploy` antes de subir a API.
7. Validar: `https://<url-gerada>.up.railway.app/health` (200).
8. Repetir o processo pro frontend apontando para `frontend/Dockerfile`, com `VITE_API_URL` apontando para a URL do backend do passo 6.

## Branches

- `main` — sempre deployável, dispara CI
- `develop` — integração entre features
- `feature/*` — uma por incremento
