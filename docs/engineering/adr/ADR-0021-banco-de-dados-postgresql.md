# ADR-0021 — Banco de Dados: PostgreSQL

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seção 4

## Contexto

A Missão 0006 modelou o SmartFood inteiramente em vocabulário relacional (tabela, schema, chave, integridade referencial dentro de agregado), sem nomear um produto específico. A Smart Platform Architecture já declara PostgreSQL como default. Era preciso confirmar essa escolha contra o modelo de dado real e extenso já produzido, não apenas herdá-la por hábito.

## Decisão

**PostgreSQL** confirmado como SGBD do SmartFood.

## Alternativas consideradas

- **MySQL:** rejeitado — suporte mais fraco a `SCHEMA` nativo (necessário para o design de schema-por-Bounded-Context da Missão 0006, Seção 9) e a tipo composto/JSON nativo (necessário para Value Objects embutidos, Missão 0006, Seção 4), sem nenhuma vantagem concreta sobre PostgreSQL para este caso.
- **MongoDB/NoSQL:** rejeitado com convicção — o domínio (Missão 0004) depende de Invariantes garantidos por integridade transacional forte dentro de um Agregado; forçar isso em um modelo de documento contrariaria o domínio já modelado, em vez de servi-lo.

## Consequências

- **Facilita:** `SCHEMA` nativo mapeia diretamente a fronteira de Bounded Context; Row-Level Security disponível como defesa adicional para o isolamento multi-tenant (Missão 0006, Seção 5); décadas de maturidade e comunidade.
- **Custa:** escalabilidade horizontal de escrita é mais trabalhosa que em alguns bancos distribuídos nativos — aceitável, pois a estratégia de escala principal do SmartFood é a decomposição futura em serviços (ADR-0019), não sharding de banco.
- **Impede:** nenhuma decisão de domínio nova — é a confirmação de um default já declarado, agora testado contra um modelo de dado real.
