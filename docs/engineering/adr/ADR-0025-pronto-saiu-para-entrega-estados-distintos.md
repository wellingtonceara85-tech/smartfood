# ADR-0025 — `Pronto` e `Saiu para Entrega` são Estados Distintos do Pedido

**Status:** Aceito
**Data:** 2026-07-13
**Missão relacionada:** [Missão 0013 — Cozinha](../../product/missao-0013-cozinha.md), Seção 2 (Correção 1) — resolve ambiguidade entre a [Missão 0004](../../product/missao-0004-modelagem-dominio.md), Seção 7, e a [Missão 0002](../../product/missao-0002-arquitetura-funcional.md), Seção 7

## Contexto

A Missão 0004 descreveu o ciclo de vida do Pedido com a notação `... → Pronto/Saiu para Entrega → Concluído` — a barra é ambígua: pode significar um único estado com dois nomes, ou dois estados sequenciais abreviados na notação. A Missão 0012 (implementação do Agregado Pedido) resolveu essa ambiguidade escolhendo um único valor de enum, `PRONTO_SAIU_PARA_ENTREGA`, sem uma segunda missão de arquitetura para confirmar a leitura.

Ao especificar a Missão 0013 (Cozinha), a releitura da Missão 0002, Seção 7 (fluxo operacional), mostrou que a ambiguidade já tinha resposta: _"Item é marcado como pronto → Se for entrega, pedido segue para etapa de despacho; se for retirada/mesa, aguarda o cliente/garçom."_ Isso descreve dois momentos operacionais distintos — o preparo terminar (`Pronto`) não é o mesmo evento que o pedido entrar na etapa logística (`Saiu para Entrega`), e o segundo só se aplica a canais de entrega.

## Decisão

O enum `StatusPedido` (Missão 0012, `backend/prisma/schema.prisma`) é corrigido: `PRONTO_SAIU_PARA_ENTREGA` é substituído por dois valores separados, `PRONTO` e `SAIU_PARA_ENTREGA`, sequenciais no ciclo de vida do Pedido. `Pronto` pertence ao domínio da Cozinha (Missão 0013); `Saiu para Entrega` pertence ao domínio da Entrega (missão futura, não numerada ainda).

**Isto é correção de modelagem, não mudança de regra de negócio.** Nenhuma regra congelada nas Missões 0002/0004 muda — a ambiguidade sempre existiu na notação, só não tinha sido percebida antes de duas missões de execução (0012 e 0013) precisarem, na prática, decidir onde a responsabilidade da Cozinha termina e a da Entrega começa.

## Alternativas consideradas

- **Manter `PRONTO_SAIU_PARA_ENTREGA` como um único estado, com um campo adicional indicando o canal:** rejeitado — misturaria, no mesmo valor de status, dois momentos que pertencem a Bounded Contexts diferentes (Cozinha vs. Entrega), forçando a Cozinha a "saber" sobre o domínio de Entrega para decidir se aquele status já terminou seu papel ali ou não.
- **Adiar a correção para quando a missão de Entrega existir:** rejeitado — não há dado real em produção ainda (só dado de teste manual/automatizado); corrigir agora custa uma migration pequena, sem risco. Adiar significa corrigir depois com dado real de Pedido em produção, custo ordens de magnitude maior.

## Consequências

- **Facilita:** a Missão 0013 (Cozinha) e a futura missão de Entrega passam a ter fronteira de responsabilidade clara no próprio enum — Cozinha nunca precisa saber sobre `Saiu para Entrega`, Entrega nunca precisa reimplementar a lógica de `Pronto`.
- **Custa:** uma migration no schema `vendas_operacao` (`backend/prisma/schema.prisma`) alterando o enum `StatusPedido` — sem dado real para migrar no momento desta decisão.
- **Impede:** qualquer leitura futura de que isso foi uma "mudança de requisito" — está registrado aqui explicitamente como correção de ambiguidade de notação entre duas missões já congeladas, não uma nova decisão de produto.
