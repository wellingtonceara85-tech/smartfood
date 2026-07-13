# ADR-0009 — Publicação de Evento Sempre Posterior à Confirmação da Transação Principal

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 6

## Contexto

Com Eventos de Domínio como mecanismo padrão de comunicação (ADR-0006), era preciso decidir a relação de ordem entre "a mudança de estado do agregado é confirmada" e "o evento correspondente é publicado" — e o que acontece com a operação principal se a publicação falhar.

## Decisão

A publicação do evento é sempre **posterior** à confirmação da transação principal do agregado. O sucesso de uma operação de negócio **nunca depende** de o evento ter sido processado por nenhum subscriber. Complementar: ver ADR-0013 para a garantia de que o _compromisso_ de publicar não se perde mesmo que a entrega efetiva aconteça depois.

## Alternativas consideradas

- **Publicar o evento como parte da mesma transação síncrona que confirma o estado, aguardando confirmação de todos os subscribers:** rejeitado — isso reintroduziria exatamente o acoplamento de disponibilidade que a comunicação por evento (ADR-0006) existe para eliminar; um subscriber lento ou indisponível travaria a operação principal do Bounded Context publisher.
- **Publicar o evento antes de confirmar a transação principal (otimista):** rejeitado — criaria o risco de um subscriber reagir a um fato que, no fim, não se confirmou (ex: notificar o cliente de um pedido criado que falhou ao ser persistido).

## Consequências

- **Facilita:** o Bounded Context publisher nunca fica refém da saúde de outro contexto para completar sua própria operação — reforça diretamente a Resiliência (Missão 0005, Seção 15).
- **Custa:** existe, por design, uma pequena janela de tempo entre "o fato aconteceu" e "o resto do sistema sabe disso" — aceitável para o domínio do SmartFood (nenhum caso de uso hoje exige reação instantânea síncrona entre contextos).
- **Impede:** qualquer subscriber assumir que reage ao evento no mesmo instante da mudança de estado — todo consumidor de evento precisa ser desenhado para consistência eventual, nunca forte.
