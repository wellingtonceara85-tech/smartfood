# ADR-0019 — Arquitetura de Implantação: Monólito Modular

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seção 1

## Contexto

A Missão 0005 definiu 10 Bounded Contexts + 2 Capabilities e exigiu que o sistema nascesse "como unidade coesa, capaz de evoluir para contextos independentemente implantáveis sem redesenho do modelo de domínio." Era preciso decidir a topologia física de deploy: um serviço por Bounded Context desde o início, um monólito sem modularidade interna, ou algo intermediário.

## Decisão

**Monólito Modular** — um único artefato deployável (imagem Docker), organizado internamente em módulos que espelham exatamente os Bounded Contexts da Missão 0005. Hospedado em Railway (backend/banco) + Vercel (frontend Next.js), confirmando o par já declarado pela Smart Platform Architecture.

## Alternativas consideradas

- **Microsserviço por Bounded Context desde o início:** rejeitado — exige maturidade operacional (observabilidade distribuída, orquestração, deploy independente coordenado) desproporcional a um produto sem usuário real em produção ainda; risco de sobre-engenharia explicitamente sinalizado na proposta de escopo aprovada desta missão.
- **Monólito sem modularidade interna:** rejeitado — contradiria todo o investimento das Missões 0004/0005/0006 em fronteiras de Bounded Context; dividir depois seria redesenho, não mudança de infraestrutura.

## Consequências

- **Facilita:** custo operacional mínimo adequado ao estágio atual; fronteiras de Bounded Context já corretas no código tornam a divisão futura uma mudança de infraestrutura de implantação, não de modelo de domínio.
- **Custa:** nenhuma escala independente por contexto ainda; falha grave de processo tem, em tese, raio de impacto maior que num sistema já distribuído (mitigado por resiliência lógica dentro do processo — Missão 0005, Seção 15).
- **Impede:** nada de forma permanente — a arquitetura de módulos (ver ADR-0020, ADR-0022) já é desenhada para tornar a divisão futura em serviços uma extração, não uma reescrita.
