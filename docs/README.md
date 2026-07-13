# SmartFood — Índice de Documentação

Segue o [Smart Mission Workflow](../../Smart%20Platform/SMART_MISSION_WORKFLOW_v1.0.md): toda missão passa por Draft → Review CTO/PO → Review Notes → Consolidação → Congelada → **Indexada aqui**.

## Missões de Produto (`product/`)

| Missão                                                                                                  | Documento                                                                                                                                     | Status                                                                  |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0001 — Visão do Produto                                                                                 | [missao-0001-visao-estrategica.md](product/missao-0001-visao-estrategica.md)                                                                  | ✅ Congelada                                                            |
| 0002 — Arquitetura Funcional                                                                            | [missao-0002-arquitetura-funcional.md](product/missao-0002-arquitetura-funcional.md)                                                          | ✅ Congelada                                                            |
| 0003 — UX e Jornadas                                                                                    | [missao-0003-ux-jornadas.md](product/missao-0003-ux-jornadas.md)                                                                              | ✅ Congelada                                                            |
| 0004 — Modelagem do Domínio                                                                             | [missao-0004-modelagem-dominio.md](product/missao-0004-modelagem-dominio.md)                                                                  | ✅ Congelada                                                            |
| 0005 — Arquitetura da Solução (Solution Architecture)                                                   | [missao-0005-arquitetura-solucao.md](product/missao-0005-arquitetura-solucao.md)                                                              | ✅ Congelada                                                            |
| 0006 — Modelagem do Banco de Dados                                                                      | [missao-0006-modelagem-banco-dados.md](product/missao-0006-modelagem-banco-dados.md)                                                          | ✅ Congelada                                                            |
| 0007 — Arquitetura Técnica e Stack Tecnológica                                                          | [missao-0007-arquitetura-tecnica.md](product/missao-0007-arquitetura-tecnica.md) (escopo: [proposta](product/missao-0007-proposta-escopo.md)) | ✅ Congelada                                                            |
| 0007.5 — Blueprint Técnico (Arquitetura Executável)                                                     | [missao-0007-5-blueprint-tecnico.md](product/missao-0007-5-blueprint-tecnico.md)                                                              | ✅ Congelada — **última missão de arquitetura/documentação estrutural** |
| 0008 — Smart Starter Kit (monorepo, NestJS + Next.js + Prisma/Postgres + Docker Compose, `GET /health`) | —                                                                                                                                             | ✅ Congelada                                                            |
| 0009 — Identidade & Empresa                                                                             | [missao-0009-identidade-empresa.md](product/missao-0009-identidade-empresa.md)                                                                | ✅ Congelada                                                            |
| 0010 — Usuários e Autenticação                                                                          | [missao-0010-usuarios-autenticacao.md](product/missao-0010-usuarios-autenticacao.md)                                                          | ✅ Congelada                                                            |
| 0011 — Catálogo                                                                                         | [missao-0011-catalogo.md](product/missao-0011-catalogo.md)                                                                                    | ✅ Congelada                                                            |
| 0012 — Pedidos                                                                                          | [missao-0012-pedidos.md](product/missao-0012-pedidos.md)                                                                                      | ✅ Congelada                                                            |
| 0013 — Cozinha                                                                                          | [missao-0013-cozinha.md](product/missao-0013-cozinha.md)                                                                                      | ✅ Congelada                                                            |
| 0014 — Pagamentos                                                                                       | —                                                                                                                                             | Planejada                                                               |
| 0015+ — demais Bounded Contexts, incrementalmente                                                       | —                                                                                                                                             | Planejada                                                               |

**Mudança de fase em 2026-07-12:** a Missão 0007.5 encerra a fase de arquitetura/documentação estrutural do SmartFood. A partir da Missão 0008, toda missão nova entrega **software executável** (com teste, documentação mínima e aderência ao Blueprint), não mais documento arquitetural — Claude passa a atuar como Tech Lead, não mais Arquiteto de Software. Nenhuma decisão já congelada (Missões 0001-0007, ADRs 0001-0024) é reaberta nessa fase; dúvida de implementação se resolve nos documentos existentes, nunca por preferência.

**Roadmap oficializado em 2026-07-11:** a Missão 0005 passa a ser **Arquitetura da Solução** — Bounded Contexts, módulos, comunicação entre módulos, eventos, filas, APIs, integrações, cache, serviços, workers, storage, autenticação, autorização, observabilidade e demais componentes arquiteturais, **sem** banco de dados nem tecnologias específicas. A Modelagem do Banco de Dados passa a ser a Missão 0006, construída sobre essa arquitetura. A missão "Arquitetura Técnica" que existia como item separado no roadmap anterior foi absorvida pela Missão 0005 — não é mais uma etapa própria.

## ADRs — Architecture Decision Records (`engineering/adr/`)

Prática adotada em 2026-07-11, em paralelo às missões: toda decisão estrutural relevante (que sobrevive a mais de uma missão e não é óbvia de re-derivar) vira um ADR. Ver [engineering/adr/README.md](engineering/adr/README.md).

## Backlog de Produto (`../backlog/`)

Paralelo às missões — ver [../backlog/README.md](../backlog/README.md).

## Review Notes (`engineering/review-notes/`)

- [missao-0002-review-notes.md](engineering/review-notes/missao-0002-review-notes.md)
- [missao-0003-review-notes.md](engineering/review-notes/missao-0003-review-notes.md)
- [missao-0004-review-notes.md](engineering/review-notes/missao-0004-review-notes.md)
- [missao-0005-review-notes.md](engineering/review-notes/missao-0005-review-notes.md)
- [missao-0006-review-notes.md](engineering/review-notes/missao-0006-review-notes.md)
- [missao-0007-review-notes.md](engineering/review-notes/missao-0007-review-notes.md)
- [missao-0007-5-review-notes.md](engineering/review-notes/missao-0007-5-review-notes.md)
- [missao-0009-review-notes.md](engineering/review-notes/missao-0009-review-notes.md)
- [missao-0010-review-notes.md](engineering/review-notes/missao-0010-review-notes.md)
- [missao-0011-review-notes.md](engineering/review-notes/missao-0011-review-notes.md)
- [missao-0012-review-notes.md](engineering/review-notes/missao-0012-review-notes.md)
- [missao-0013-review-notes.md](engineering/review-notes/missao-0013-review-notes.md)

## Outras pastas

- [`platform/`](platform/README.md) — aponta para a Smart Platform (compartilhada, não duplicada)
- [`business/`](business/README.md) — modelo de negócio, precificação, GTM (a preencher)
- [`engineering/`](engineering/README.md) — review notes, ADRs, changelog, release notes
