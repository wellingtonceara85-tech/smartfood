# SmartFood

SaaS multiempresa (multi-tenant) de gestão comercial para restaurantes, lanchonetes, pizzarias, marmitarias, mercados de bairro e afins. Modelo de negócio: assinatura mensal, sem comissão sobre vendas. Ver [docs/product/missao-0001-visao-estrategica.md](docs/product/missao-0001-visao-estrategica.md) para a estratégia de produto completa (visão, personas, MVP, roadmap).

## Documentação

```
docs/
├── product/      → missões de produto (visão, arquitetura funcional, UX/jornadas, ...)
├── platform/      → aponta para a Smart Platform, compartilhada entre todos os produtos (não duplicada aqui)
├── business/       → modelo de negócio, precificação, GTM, onboarding de clientes, KPIs (a preencher conforme essas missões acontecerem)
└── engineering/     → ADRs, changelog, release notes, e review-notes/ (histórico de decisão por missão)
```

Índice completo, com status de cada missão (Draft/Congelada), em [docs/README.md](docs/README.md) — segue o [Smart Mission Workflow](../Smart%20Platform/SMART_MISSION_WORKFLOW_v1.0.md).

## Backlog

`backlog/` — EPIC-001 a EPIC-013, um por domínio de produto, paralelo às missões de arquitetura. Ver [backlog/README.md](backlog/README.md). Nível atual: módulos e fase mapeados, sem user stories ainda (refinamento a partir da Missão 0007).

## Arquitetura

Este projeto segue a **Smart Platform** — o conjunto de documentos que define arquitetura, design system, guia de desenvolvimento, segurança e IA para todos os produtos da empresa (SmartOS, SmartNCM, SmartFood, futuros):

`C:\Users\AGIL\Documents\Smart Platform\INDEX.md`

Documentos principais: [Architecture](../Smart%20Platform/SMART_PLATFORM_ARCHITECTURE_v1.0.md) · [Design System](../Smart%20Platform/SMART_DESIGN_SYSTEM_v1.0.md) · [Development Guide](../Smart%20Platform/SMART_DEVELOPMENT_GUIDE_v1.0.md) · [Security Guide](../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md) · [AI Guide](../Smart%20Platform/SMART_AI_GUIDE_v1.0.md)

Não duplicar regras aqui — qualquer decisão de arquitetura, UI, hook/serviço compartilhado, permissão ou uso de IA no SmartFood deve ser consistente com esses documentos. Mudanças no padrão entram por nova versão deles, não por regra isolada criada dentro deste projeto.

Resumo rápido (ver os documentos para detalhes): React + TypeScript + Tailwind no frontend; Node.js no backend com Express ou NestJS conforme porte do projeto (SmartFood, por ser SaaS relativamente enxuto no MVP, tende a Express — decisão a confirmar quando o backend for iniciado); PostgreSQL + Prisma; JWT + Refresh Token; Docker; deploy Vercel (frontend) + Railway/Coolify (backend); três ambientes (dev/staging/production); RBAC com papéis base (Administrador/Gerente/Supervisor/Operador/Financeiro/Cliente/Visitante); IA acessada via serviço `AI` compartilhado, nunca integrada direto por produto.
