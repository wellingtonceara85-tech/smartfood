# SmartFood — Review Notes — Missão 0006 (Modelagem do Banco de Dados)

## Rodada 1 (Draft)

**Data:** 2026-07-11
**Resultado:** Documento entregue com 14 seções — mapeamento Agregado→Tabela, relacionamentos/chaves, Value Objects embutidos, multi-tenant, índices conceituais, esquema de eventos publicados, esquema de auditoria, fronteiras de schema por Bounded Context, evolução de schema, classificação persistido/cache/temporário, riscos, lista de 3 ADRs e ponte para a Missão 0007.

## Rodada 2 (CTO Review — auto-revisão crítica solicitada explicitamente)

**Data:** 2026-07-11
**Revisor:** Usuário, pedindo revisão explícita no papel de CTO/Software Architect Sênior
**Veredito:** 🟡 Aprovada com ressalvas — estrutura geral mantida, 4 ajustes obrigatórios + 3 recomendados antes do congelamento.

**4 ajustes obrigatórios incorporados, com o porquê:**

1. **Cliente passa a ser entidade global, não escopada por Empresa.**
   Por quê: a Rodada 1 aplicou a regra geral de multi-tenant (`empresa_id` em toda tabela) também a `clientes`/`enderecos_salvos`/`metodos_pagamento_salvos`, violando diretamente a Missão 0004 (Invariante 4: "Um Cliente pode comprar em várias Lojas... a identidade do Cliente não é presa a uma única Empresa"). Corrigido: identidade global; a relação de negócio (`pedidos`, `contas_fidelidade`, `favoritos`) é que é escopada por Empresa. Formalizado em [ADR-0017](../adr/ADR-0017-cliente-entidade-global.md).

2. **Regra única para referência entre Bounded Contexts.**
   Por quê: a Rodada 1 usava três formulações diferentes para a mesma ideia ("chave estrangeira lógica", "referência", "nunca com CASCADE") — a última deixava ambíguo se uma FK física sem cascade seria aceitável. Unificado: nunca existe FK física entre contextos, em nenhuma variação — só ID armazenado + validação de aplicação + consistência por evento, mesmo com os schemas no mesmo banco. Formalizado em [ADR-0016](../adr/ADR-0016-sem-fk-fisica-entre-bounded-contexts.md).

3. **Produto escopado por Loja, não por Empresa.**
   Por quê: a Missão 0004 (Invariante 3) diz explicitamente "Um Produto pertence a uma única Loja", mas a Rodada 1 modelou `produtos` só com `empresa_id`. Isso funcionaria hoje (1 Loja por Empresa no MVP) mas geraria migração estrutural cara quando Multiloja (Missão 0002, Fase 3, já roadmapada) fosse implementada. Corrigido: `produtos`/`variacoes_produto` carregam `loja_id`; introduzida a tabela `lojas` (antes ausente do documento); `categorias` permanece por `empresa_id` (decisão conservadora, justificada pela leitura de "catálogo mestre" da Missão 0002). Formalizado em [ADR-0018](../adr/ADR-0018-produto-escopado-por-loja.md).

4. **`eventos_publicados` ganha `empresa_id` obrigatório.**
   Por quê: a tabela conceitual da Rodada 1 não listava identificador de Empresa entre os campos, forçando qualquer filtro/troubleshooting/isolamento multi-tenant durante reprocessamento a depender de abrir o `payload` — inconsistente com a regra que vale para todo o resto do sistema. Corrigido: `empresa_id` como campo de primeira classe.

**3 ajustes recomendados incorporados:**

5. **Chaves naturais vs. artificiais declarado explicitamente** — toda tabela usa PK artificial (surrogate); CNPJ/CPF/e-mail/telefone são sempre `UNIQUE`, nunca PK.
6. **`historico_status_pedido` documentado como materialização de Value Object**, não Entidade/agregado independente.
7. **Diretriz de retenção registrada** (não definitiva): Auditoria tende a retenção longa, Eventos Publicados tende a retenção operacional/curta — política exata fica para a Missão 0007.

**Status ao final da Rodada 2:** ✅ CONGELADA — versão oficial. 5 ADRs (0014-0018) escritos por completo em `docs/engineering/adr/`.

---

## Como usar este documento

Ver [missao-0002-review-notes.md](missao-0002-review-notes.md) para o modelo completo de registro (decisão + porquê + trade-off).
