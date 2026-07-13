# ADR-0014 — Isolamento Multi-tenant por Coluna Discriminadora, Não Schema-por-Tenant

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0006 — Modelagem do Banco de Dados](../../product/missao-0006-modelagem-banco-dados.md), Seção 5

## Contexto

Com Empresa como Tenant (ADR-0002), era preciso decidir o mecanismo físico de isolamento entre Empresas no banco de dados: uma coluna discriminadora em tabelas compartilhadas, ou uma estrutura de banco fisicamente separada por Empresa (schema-per-tenant).

## Decisão

Isolamento por **coluna discriminadora** (`empresa_id` para a maioria das tabelas; `loja_id` para conceitos operacionais — ver ADR-0018; nenhuma para a identidade global de Cliente — ver ADR-0017), presente desde a primeira definição de cada tabela. A escolha de discriminador é revisitável **por Bounded Context individualmente** no futuro, não como decisão de tudo-ou-nada.

## Alternativas consideradas

- **Schema-per-tenant (uma estrutura de banco isolada por Empresa):** rejeitado para o MVP — o SmartFood é um SaaS de auto-cadastro com expectativa de crescimento rápido no número de Empresas; schema-per-tenant multiplica custo operacional (migração, backup, monitoramento) por Empresa, o que se torna insustentável em escala, mesmo trazendo isolamento mais forte.
- **Banco de dados físico separado por Empresa:** rejeitado pelo mesmo motivo, ainda mais amplificado — inviável operacionalmente para centenas ou milhares de Empresas pequenas.

## Consequências

- **Facilita:** um único ambiente de banco atende todas as Empresas, com custo operacional que não cresce linearmente por tenant; simples de operar, migrar e monitorar no estágio atual do produto.
- **Custa:** a responsabilidade de isolamento passa a ser inteiramente da camada de aplicação (filtro obrigatório em toda consulta) — o banco, por si só, não impede vazamento entre tenants.
- **Impede:** isolamento físico automático — se uma exigência regulatória futura exigir separação física forte para um Bounded Context específico (ex: Financeiro), essa é uma decisão a ser tomada isoladamente para aquele contexto, não uma mudança geral de estratégia.
