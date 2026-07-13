# ADR-0020 — Framework de Backend: NestJS

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seção 2

## Contexto

A Smart Platform Architecture declara Node.js com "Express ou NestJS, decidido por porte de projeto". O SmartFood tem 10 Bounded Contexts, 11 Agregados, Invariantes que não podem ser violados, e um mandato explícito de Clean Architecture/SOLID (Missão 0005, Princípio 7 — inversão de dependência) e de checagem de permissão antes de qualquer lógica de domínio (Missão 0005, Seção 12).

## Decisão

**NestJS** como framework de backend do SmartFood.

## Alternativas consideradas

- **Express:** rejeitado especificamente para o SmartFood (permanece válido para outros produtos Smart menores) — exigiria construir manualmente, do zero, injeção de dependência, fronteira de módulo e checagem de permissão pré-rota, sem nenhuma estrutura impedindo que um desenvolvedor acesse indevidamente o repositório de outro Bounded Context.
- **Fastify puro:** mesmo problema de Express, com o agravante de ecossistema de padrões estruturais ainda menor.

## Consequências

- **Facilita:** Módulos NestJS mapeiam 1:1 a Bounded Context; Injeção de Dependência aplica SOLID/DIP sem exigir disciplina manual; Guards aplicam Papel×Permissão×Recurso antes da lógica de domínio nativamente; Interceptors propagam Correlation ID de ponta a ponta sem código repetido.
- **Custa:** curva de aprendizado maior que Express para quem nunca usou o framework; overhead de decorators/reflection em runtime, irrelevante na escala atual do produto.
- **Impede:** nada de negócio — é uma decisão de ferramenta que se alinha à estrutura já decidida, não uma restrição nova ao domínio.
