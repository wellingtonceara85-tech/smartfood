# ADR-0003 — Pedido como Snapshot Completo e Imutável da Venda

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0004 — Modelagem do Domínio](../../product/missao-0004-modelagem-dominio.md), Seções 2, 3, 6 e 11 (Invariante 5)

## Contexto

Um Pedido referencia Produtos do Catálogo, mas o Catálogo muda ao longo do tempo (preço, nome, descrição, imagem, categoria). Era preciso decidir se o Item do Pedido guardaria uma **referência viva** ao Produto (refletindo mudanças futuras) ou uma **cópia imutável** do estado do Produto no momento da compra.

## Decisão

O Pedido inteiro — itens, preços, nomes, descrições, imagens, categorias e endereço de entrega — é um **snapshot completo e imutável**, congelado no momento da confirmação da compra. Nenhuma alteração posterior no Catálogo, no cadastro do Cliente ou em qualquer outra entidade referenciada se propaga a um Pedido já criado.

## Alternativas consideradas

- **Item do Pedido como referência viva ao Produto:** rejeitado — geraria o bug clássico de "pedido histórico mudando sozinho" (ex: comerciante altera preço do produto, e o valor de um pedido de três meses atrás muda junto nos relatórios). Inaceitável para qualquer sistema com obrigação de auditoria e histórico financeiro confiável.
- **Snapshot só do preço, mantendo referência viva para os demais campos (nome, imagem):** rejeitado — resolve só parte do problema; um produto renomeado ou com foto trocada ainda distorceria o histórico de forma sutil e mais difícil de detectar que uma mudança de preço.

## Consequências

- **Facilita:** histórico de venda confiável e imutável por definição — relatórios, auditoria e disputa com cliente sempre refletem exatamente o que foi vendido, não o estado atual do catálogo.
- **Custa:** dado duplicado por design (mesmo nome/preço/imagem armazenado em cada Item do Pedido que referenciou aquele produto) — decisão consciente de espaço de armazenamento em favor de integridade histórica; não é normalização de banco no sentido tradicional.
- **Impede:** "corrigir" retroativamente um pedido antigo alterando o produto no catálogo — qualquer correção de um pedido já criado precisa ser uma operação explícita sobre o próprio Pedido, nunca um efeito colateral de editar o Catálogo.
