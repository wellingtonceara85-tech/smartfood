# ADR-0005 — Fusão de Comercial e Operacional em "Vendas & Operação"

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 2

## Contexto

A Missão 0004 classificou Comercial e Operacional como dois Domínios Core **separados**, correto do ponto de vista de negócio (perguntas diferentes: "o que vendo" vs. "como esse pedido é executado"). Ambos, porém, compartilham o mesmo agregado raiz — Pedido — e mudam junto, minuto a minuto, na mesma transação de negócio. A Arquitetura da Solução precisava decidir se essa distinção de produto se traduziria em dois Bounded Contexts técnicos separados.

## Decisão

Comercial e Operacional formam um único Bounded Context — **Vendas & Operação** — possuindo os agregados Pedido, Comanda e Assinatura de Produto. Internamente, o contexto tem sub-módulos que dividem responsabilidade (Checkout/Catálogo de Venda vs. Painel Operacional/Fila), mas nunca cruzam a fronteira de Bounded Context entre si.

## Alternativas consideradas

- **Dois Bounded Contexts separados, com Pedido pertencendo a um e o outro consumindo por evento/consulta:** rejeitado — o ciclo de vida do Pedido muda de status a cada segundo em produção real (recebido → em preparo → pronto → concluído); manter dois contextos sincronizados exigiria ou transação distribuída a cada mudança de status (violaria o princípio de consistência forte só dentro do agregado) ou uma cópia/projeção do Pedido no lado Operacional, reintroduzindo a duplicação e o atraso que o Motor de Pedidos unificado (Missão 0002) foi desenhado para eliminar.
- **Um só Bounded Context para todo o domínio Comercial amplo (incluindo Catálogo):** rejeitado — Catálogo tem ciclo de vida e taxa de mudança completamente diferentes do Pedido (produto muda por decisão do comerciante, pedido muda pela operação do dia a dia) e não compartilha agregado — mantido como Bounded Context próprio.

## Consequências

- **Facilita:** toda mudança de status do Pedido acontece dentro de uma única fronteira transacional, sem coordenação distribuída; a leitura operacional do dia a dia (Painel de Pedidos, Fila da Cozinha) não depende de sincronização entre contextos.
- **Custa:** Vendas & Operação se torna o Bounded Context de maior responsabilidade e maior acoplamento de todo o sistema (ver Riscos, Missão 0005 Seção 17) — decisão aceita conscientemente, não um efeito colateral não percebido.
- **Impede:** escalar ou implantar separadamente a parte "criação de pedido" (Comercial) da parte "execução de pedido" (Operacional) no futuro sem reabrir esta decisão — se um dia isso for necessário, será uma mudança arquitetural relevante, não um ajuste incremental.
