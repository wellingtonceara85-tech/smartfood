# ADR-0018 — Produto Escopado por Loja, Não Diretamente por Empresa

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0006 — Modelagem do Banco de Dados](../../product/missao-0006-modelagem-banco-dados.md), Seção 2 (Rodada 2 — corrige inconsistência da Rodada 1 com a Missão 0004)

## Contexto

A Rodada 1 desta missão modelou `produtos` com `empresa_id` como discriminador de escopo, seguindo a regra geral de multi-tenant. A Missão 0004 (Seção 11, Invariante 3), porém, é explícita: "Um Produto pertence a uma única Loja — catálogo não é compartilhado entre Lojas, mesmo dentro da mesma Empresa (Multiloja replica/varia produtos, não os compartilha por referência única)." Multiloja é Fase 3 já roadmapada desde a Missão 0002 — não uma hipótese distante.

## Decisão

`produtos` e `variacoes_produto` carregam `loja_id`, não `empresa_id` diretamente. Introduz-se a tabela `lojas` (Missão 0004, Entidade "Loja" — ponto de venda operacional de uma Empresa), com `lojas.empresa_id` estabelecendo a cadeia Produto → Loja → Empresa. No MVP, cada Empresa tem exatamente uma Loja (criada automaticamente no Onboarding); o modelo já nasce correto para Multiloja sem migração estrutural quando a segunda Loja de uma Empresa for criada.

`Categoria` permanece escopada por `empresa_id`, não `loja_id` — decisão consciente e conservadora, baseada na descrição de Multiloja como "catálogo mestre com variação por unidade" (Missão 0002): a taxonomia tende a ser compartilhada entre Lojas da mesma Empresa, enquanto Produtos específicos variam por Loja. Revisitável isoladamente se a implementação real de Multiloja mostrar o contrário.

## Alternativas consideradas

- **Manter `produtos.empresa_id`, corrigindo só quando Multiloja for implementada:** rejeitado — a correção exigiria migração estrutural com dado real em produção (adicionar `loja_id`, popular retroativamente, mudar toda consulta que hoje filtra por `empresa_id`), exatamente o tipo de retrabalho caro que esta missão existe para evitar quando a informação para acertar já está disponível agora (Invariante já escrito na Missão 0004).
- **Escopar `produtos` por `loja_id` E manter `empresa_id` redundante na mesma tabela:** rejeitado — duplicar o discriminador cria duas fontes de verdade para a mesma pergunta ("esse produto é de qual tenant?") e risco de as duas divergirem; a cadeia `produtos.loja_id → lojas.empresa_id` já responde à pergunta de Empresa sem duplicação.

## Consequências

- **Facilita:** quando Multiloja for implementada, adicionar uma segunda Loja a uma Empresa não exige nenhuma mudança de schema em `produtos` — só uma nova linha em `lojas` e produtos associados a ela.
- **Custa:** qualquer consulta que hoje "só" precisaria filtrar por `empresa_id` em `produtos` precisa, na prática, filtrar por `loja_id` (ou fazer o caminho até `empresa_id` via `lojas`) — um nível a mais de indireção desde o MVP, mesmo com uma única Loja por Empresa.
- **Impede:** a tentação futura de "resolver rápido" a chegada de Multiloja com uma correção pontual e apressada em produção — a decisão já está tomada e documentada antes de existir pressão de prazo real.
