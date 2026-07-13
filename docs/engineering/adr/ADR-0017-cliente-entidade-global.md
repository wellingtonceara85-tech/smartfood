# ADR-0017 — Cliente é Entidade Global, Não Escopada por Empresa

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0006 — Modelagem do Banco de Dados](../../product/missao-0006-modelagem-banco-dados.md), Seção 2 (Rodada 2 — corrige inconsistência da Rodada 1 com a Missão 0004)

## Contexto

A Rodada 1 da Missão 0006 aplicou a regra geral de multi-tenant ("toda tabela de negócio tem `empresa_id`") também a `clientes`, `enderecos_salvos` e `metodos_pagamento_salvos`. Isso contradiz diretamente a Missão 0004 (Seção 11, Invariante 4): "Um Cliente pode comprar em várias Lojas (inclusive de Empresas diferentes) — a identidade do Cliente não é presa a uma única Empresa, diferente da identidade do Usuário." A revisão da Rodada 2 identificou essa inconsistência antes do congelamento.

## Decisão

`clientes`, `enderecos_salvos` e `metodos_pagamento_salvos` representam a **identidade** do Cliente e são **globais** — sem `empresa_id`. O que é escopado por Empresa é a **relação de negócio** entre um Cliente e uma Empresa específica: `pedidos` (já carrega `cliente_id` + `empresa_id`), `contas_fidelidade` (Missão 0004, Invariante 8: par Cliente+Empresa) e `favoritos` (favoritar é sempre relativo a um produto de uma Empresa específica).

## Alternativas consideradas

- **Manter Cliente escopado por Empresa, aceitando duplicação de cadastro entre Empresas:** rejeitado — viola diretamente o Invariante 4 da Missão 0004, que foi escrito precisamente para impedir essa duplicação; um mesmo comprador teria identidade fragmentada entre lojas SmartFood diferentes, quebrando a possibilidade futura de histórico/perfil unificado do cliente através do ecossistema.
- **Criar uma tabela `clientes` por Empresa e sincronizar identidade entre elas por evento:** rejeitado — reintroduz complexidade de sincronização e risco de divergência (mesmo padrão de erro que a fusão de Vendas & Operação, ADR-0005, evitou para Pedido) para resolver um problema que uma identidade global resolve de forma mais simples.

## Consequências

- **Facilita:** um Cliente que compra em duas Empresas SmartFood diferentes mantém uma única identidade — login único possível no futuro, histórico de contato consistente, sem duplicação de cadastro; caminho aberto para eventual recurso de conta unificada no ecossistema Smart.
- **Custa:** consultas do painel de gestão de uma Empresa sobre "seus" clientes precisam necessariamente passar pela tabela de relação (`pedidos`, `contas_fidelidade`, `favoritos`), nunca diretamente pela tabela de identidade — um passo a mais de modelagem que a Rodada 1 não previa.
- **Impede:** qualquer implementação que exponha a tabela `clientes` inteira (todos os clientes de todas as Empresas) para o painel de uma Empresa — o filtro de "quem é cliente desta Empresa" é sempre via join lógico com uma tabela de relação, nunca uma coluna direta em `clientes`.
