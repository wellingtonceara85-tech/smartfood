# SmartFood

Cardápio digital público por loja (MVP), inspirado no whatsmenu.com.br: o cliente abre o link da loja (`/:slug`), monta o pedido e finaliza direto no WhatsApp do estabelecimento — sem checkout online, sem pagamento integrado. O dono da loja tem um painel simples pra cadastrar produtos e controlar disponibilidade em tempo real.

Escopo, modelo de dados, telas e critérios de aceite completos em [PROMPT_CLAUDE_CODE_SMARTFOOD_MVP.md](PROMPT_CLAUDE_CODE_SMARTFOOD_MVP.md) — esse arquivo é a fonte da verdade do MVP atual. Features adicionadas depois têm prompt próprio: [PROMPT_CLAUDE_CODE_SMARTFOOD_TAXA_ENTREGA.md](PROMPT_CLAUDE_CODE_SMARTFOOD_TAXA_ENTREGA.md), [PROMPT_CLAUDE_CODE_SMARTFOOD_ONBOARDING_CARDAPIO_ASSISTIDO.md](PROMPT_CLAUDE_CODE_SMARTFOOD_ONBOARDING_CARDAPIO_ASSISTIDO.md). Infra de deploy: [PROMPT_CLAUDE_CODE_SMARTFOOD_DEPLOY_FIREBASE_NEON.md](PROMPT_CLAUDE_CODE_SMARTFOOD_DEPLOY_FIREBASE_NEON.md).

## Histórico

O projeto começou como um SaaS multiempresa com arquitetura DDD/multi-tenant/event-driven, seguindo o processo de "missões" da Smart Platform (`C:\Users\AGIL\Documents\Smart Platform\INDEX.md`). Depois de 7 missões de arquitetura e zero telas usáveis, o escopo foi resetado para este MVP enxuto. `docs/` e `backlog/` ficam como histórico dessa fase anterior — não gerar novos documentos desse tipo (missões, ADRs, EPICs) a partir de agora.

## Fora de escopo agora

Não reintroduzir, sem pedido explícito do usuário: arquitetura DDD/camadas separadas por módulo, ADRs ou processo formal de design antes de codar, multi-tenant com schema separado por empresa, event sourcing/outbox/filas, pagamento online, app mobile nativo, multi-idioma. Ver a seção "Fora de escopo" do prompt do MVP para a lista completa.

## Stack

- Frontend: React (Vite) + TypeScript + Tailwind — pasta `frontend/`
- Backend: Node.js + Express (não NestJS) + TypeScript — pasta `backend/`
- Banco: PostgreSQL, schema único, tabelas simples (`loja_id` como FK, sem multi-schema)
- ORM: Prisma
- Auth: JWT + refresh token, RBAC simples (`dono_loja`, `admin_master`)
- Deploy (fase de demonstração, custo esperado US$ 0): Firebase Hosting (frontend) + Cloud Functions (backend, `backend/src/functions.ts` envolve o Express existente) + Neon (Postgres); local via `docker-compose up` (Postgres + backend + frontend em containers, sem Firebase/Neon)

`frontend/` e `backend/` são dois projetos simples, sem monorepo com workspace manager obrigatório.

## Convenções

- Commits pequenos e objetivos — decisão de implementação não precisa de ADR
- Sem pasta de backlog formal nem numeração de "missões" para este MVP — usar issues simples se precisar rastrear algo
- Total do pedido é sempre revalidado no backend contra o preço cadastrado antes de gravar — nunca confiar no total vindo do frontend
- Disponibilidade de produto reflete em tempo real na página pública, sem cache que atrase isso
