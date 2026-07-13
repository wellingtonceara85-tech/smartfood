# SmartFood

SaaS multiempresa (multi-tenant) de gestão comercial para restaurantes, lanchonetes, pizzarias, marmitarias, mercados de bairro e afins. Modelo de negócio: assinatura mensal, sem comissão sobre vendas. **Software proprietário** — ver [LICENSE](LICENSE).

Visão de produto completa em [docs/product/missao-0001-visao-estrategica.md](docs/product/missao-0001-visao-estrategica.md).

## Stack

- **Backend**: NestJS (Node 20 + TypeScript), Monólito Modular por Bounded Context (ADR-0019)
- **Banco**: PostgreSQL 16 + Prisma (multiSchema, um schema por Bounded Context)
- **Frontend**: Next.js + Tailwind
- **Auth**: JWT (Access + Refresh Token), RBAC (ADR-0024)
- **Infra local**: Docker Compose (Postgres + backend + frontend)
- **Testes**: Vitest (unitários + integração contra Postgres real)

Arquitetura, design system e guias de desenvolvimento/segurança/IA são definidos na **Smart Platform**, compartilhada entre todos os produtos da empresa — não duplicados aqui. Ver `CLAUDE.md` para os caminhos locais.

## Estrutura do repositório

```
backend/    → API NestJS (módulos por Bounded Context em src/modules/)
frontend/   → Next.js
docs/       → missões de produto, ADRs, review notes (docs/README.md é o índice)
backlog/    → EPICs de produto, paralelo às missões de arquitetura
```

Cada módulo de backend segue a mesma anatomia (Missão 0007.5): `domain/` → `application/` → `infrastructure/` → `api/` → `test/`. Comunicação entre módulos só via Use Case exportado (ADR-0022), nunca acesso direto a repositório/domínio de outro módulo — garantido por teste de contrato em cada módulo.

## Rodando localmente

Pré-requisitos: Node 20, pnpm 9, Docker.

```bash
cp .env.example .env        # ajustar JWT_SECRET antes de qualquer ambiente real
docker compose up --build
```

Isso sobe Postgres, roda as migrations + seed automaticamente, e sobe backend (`:3001`) e frontend (`:3000`).

- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- Health check: http://localhost:3001/health

### Sem Docker (desenvolvimento do backend)

```bash
pnpm install
pnpm --filter ./backend prisma:generate
pnpm --filter ./backend prisma:migrate
node backend/prisma/seed.js
pnpm --filter ./backend dev
```

### Scripts

| Comando      | O que faz                                                                              |
| ------------ | -------------------------------------------------------------------------------------- |
| `pnpm dev`   | backend + frontend em watch mode                                                       |
| `pnpm lint`  | lint de backend e frontend                                                             |
| `pnpm test`  | suíte de testes do backend (Vitest — precisa de Postgres acessível via `DATABASE_URL`) |
| `pnpm build` | build de produção de backend e frontend                                                |

## Status do produto

Missões 0001–0007.5 (arquitetura/documentação) e 0008–0013 (software executável: Starter Kit, Identidade & Empresa, Usuários/Auth, Catálogo, Pedidos, Cozinha) estão **Congeladas**. Índice completo e status atualizado em [docs/README.md](docs/README.md).

## CI

Todo push/PR para `main` e `develop` roda lint, testes (contra Postgres real) e build via GitHub Actions (`.github/workflows/ci.yml`).

## Deploy — Homologação (Railway)

Ambiente de homologação, não produção. Passo a passo (dashboard do Railway, precisa ser feito manualmente por quem tem acesso à conta):

1. Login em [railway.app](https://railway.app) com a conta GitHub.
2. **New Project → Deploy from GitHub repo** → selecionar `smartfood` (branch `main`).
3. O Railway detecta `railway.json` na raiz (builder Dockerfile, aponta para `backend/Dockerfile`, contexto na raiz do repo — igual ao `docker-compose.yml` local).
4. **New → Database → PostgreSQL** no mesmo projeto Railway.
5. No serviço do backend, aba **Variables**, configurar:
   - `DATABASE_URL` → referenciar a variável do plugin Postgres (`${{Postgres.DATABASE_URL}}`)
   - `JWT_SECRET` → gerar um valor forte e único (nunca reaproveitar o de dev/local — ex.: `openssl rand -base64 48`)
   - `NODE_ENV` → `production`
   - `LOG_LEVEL` → `info` (opcional; logs saem em JSON estruturado em produção via Pino)
   - `PORT` → o Railway injeta automaticamente; não precisa configurar
6. Deploy. O `CMD` da imagem já roda `prisma migrate deploy` + seed dos Papéis internos antes de subir a API — nenhum passo manual de migration é necessário.
7. Validar: `https://<url-gerada>.up.railway.app/health` (200) e `/docs` (Swagger).
8. (Opcional, quando o frontend também for hospedado) repetir o processo apontando para `frontend/Dockerfile`, com `NEXT_PUBLIC_API_URL` apontando para a URL do backend gerada no passo 6.

Não há domínio próprio configurado ainda — a URL gerada automaticamente pelo Railway (`*.up.railway.app`) é suficiente para homologação. Produção (domínio próprio, observabilidade, backups) fica para depois das Missões 0014 (Pagamentos) e 0015 (Entrega).

## Branches

- `main` — sempre deployável, dispara CI
- `develop` — integração entre features
- `feature/*` — uma por missão/incremento
