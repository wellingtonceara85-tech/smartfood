# ADR-0008 — Nenhuma Estratégia Offline para Contextos Transacionais Centrais

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 10

## Contexto

Parte do público operacional do SmartFood (ex: Motoboy) pode operar em condição de conectividade instável. Era preciso decidir se a arquitetura assumiria operação offline-first com sincronização e resolução de conflito, ou uma postura mais simples.

## Decisão

Nenhum contexto transacional central (Vendas & Operação, Pagamentos) opera offline. O princípio adotado é: **o servidor é sempre a fonte de verdade final** — nenhuma ação de negócio é aceita como confirmada até validação em tempo real contra o estado atual. Telas específicas podem exibir o último estado conhecido durante uma queda breve de conexão (resiliência de cliente/UX, Missão 0003), mas isso não constitui operação offline de dado.

## Alternativas consideradas

- **Arquitetura offline-first com sincronização posterior e resolução de conflito:** rejeitado por ora — o custo de implementar reconciliação de conflito distribuído (decidir "qual versão vale" quando duas ações offline conflitam) é alto, e nenhuma dor real do produto hoje (Missões 0001-0003) justifica esse investimento. Pagamento, em particular, nunca pode ser confirmado offline por risco de fraude/duplicidade.
- **Offline só para o app do Motoboy, com fila de ação local:** considerado como cenário futuro plausível, não descartado — mas não adotado agora porque não há dor documentada que o justifique; registrado como extensão futura possível, seguindo sempre o mesmo princípio (ação offline é proposta, não confirmação, até validada pelo servidor).

## Consequências

- **Facilita:** o modelo de dados e a arquitetura de eventos (ADR-0006) não precisam lidar com conflito de escrita concorrente entre cliente offline e servidor — reduz complexidade real de forma significativa.
- **Custa:** em área de sinal fraco, um Motoboy pode ter que aguardar reconexão para confirmar uma ação — aceito como limitação conhecida, não como lacuna não percebida.
- **Impede:** o produto prometer "funciona sem internet" em qualquer papel operacional hoje — se essa demanda aparecer com força real de mercado, é decisão de reabrir esta ADR, não de improvisar solução parcial.
