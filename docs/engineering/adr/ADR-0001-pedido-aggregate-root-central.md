# ADR-0001 — Pedido como Aggregate Root Central do Domínio

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0004 — Modelagem do Domínio](../../product/missao-0004-modelagem-dominio.md), Seções 4 e 8

## Contexto

O Pedido é o evento central de todo o SmartFood — praticamente todo domínio existe para produzir, processar, cobrar ou aprender com um Pedido (Missão 0002, Seção 1). Era preciso decidir se Pedido seria um agregado "grande" contendo Pagamento, Entrega e Avaliação diretamente, ou um agregado enxuto que se relaciona com esses conceitos por referência.

## Decisão

Pedido é o Aggregate Root do domínio Comercial, contendo apenas Itens do Pedido, Endereço de Entrega (Value Object), Canal de Venda (Value Object) e o histórico de status. Pagamento, Entrega e Avaliação são **agregados próprios e separados**, conectados a Pedido por referência (ID) e por Evento de Domínio — nunca contidos dentro dele.

## Alternativas consideradas

- **Pedido como agregado único contendo Pagamento e Entrega:** rejeitado — o ciclo de vida do Pagamento (aprovação assíncrona por gateway externo, múltiplas tentativas) roda em ritmo diferente do Pedido, e um agregado único criaria contenção entre partes do sistema tentando alterar o mesmo agregado ao mesmo tempo (ex: cozinha atualizando status vs. gateway confirmando pagamento).
- **Pedido sem histórico de status embutido, delegado a uma entidade separada:** rejeitado por ora — o histórico de status é pequeno, muda com o próprio Pedido, e não tem ciclo de vida independente que justifique um agregado à parte.

## Consequências

- **Facilita:** evolução independente de Pagamentos e Operacional sem lock cruzado; leitura operacional do dia a dia (Painel de Pedidos, Fila da Cozinha) não depende de dado de fora do próprio Pedido.
- **Custa:** Pedido é, ainda assim, o ponto de maior acoplamento do domínio — referenciado por Pagamento, Entrega, Avaliação e Conta de Fidelidade, além de referenciar Cliente, Cupom e Comanda. Esse acoplamento é aceito conscientemente por ser o Core Domain central (Missão 0004, Seção 1), mas exige atenção na Missão 0005 para não virar múltiplas buscas cruzadas obrigatórias em toda leitura operacional.
- **Impede:** transação atômica única cobrindo Pedido + Pagamento no mesmo commit — qualquer consistência entre os dois passa a ser eventual, coordenada por Evento de Domínio, não por transação compartilhada.
