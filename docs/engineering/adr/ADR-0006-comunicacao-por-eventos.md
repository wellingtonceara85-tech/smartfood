# ADR-0006 — Comunicação Assíncrona por Evento de Domínio como Padrão

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seções 4, 5 e 6

## Contexto

Com múltiplos Bounded Contexts definidos (ADR-0004), era preciso decidir o padrão default de comunicação entre eles — e como distinguir semanticamente "algo que já aconteceu" de "uma ordem para que algo aconteça".

## Decisão

A comunicação entre Bounded Contexts é, por padrão, **assíncrona via Evento de Domínio**. Chamada síncrona é a exceção, usada apenas quando o consumidor precisa da resposta imediata para completar sua própria operação (Missão 0005, Seção 4). Além disso, **todo Evento representa um fato já ocorrido — passado, irrevogável — nunca um comando ou solicitação de ação futura.** Nomenclatura obrigatória em particípio passado (`_CRIADO`, `_CONFIRMADO`, `_CANCELADO`); nunca imperativo (`CRIAR_X`).

## Alternativas consideradas

- **Chamada síncrona como padrão, evento como exceção:** rejeitado — acoplaria a disponibilidade de um contexto à disponibilidade de todos os que reagem a ele, indo contra o princípio de resiliência (Bulkhead/Graceful Degradation, Missão 0005 Seção 15) e contra a decomposição por Bounded Context (ADR-0004), que só entrega valor real se os contextos puderem falhar de forma independente.
- **Permitir "comando" como mecanismo de comunicação entre contextos** (um contexto instrui outro a executar uma ação): rejeitado — quebraria o princípio de Ownership (Missão 0005, Seção 2: cada decisão de negócio pertence a exatamente um contexto) — se um contexto pudesse comandar outro, a fronteira de decisão deixaria de ser clara.

## Consequências

- **Facilita:** qualquer contexto pode reagir (ou não) a um evento sem que o publisher precise saber ou se importar — acoplamento mínimo entre contextos, evolução independente.
- **Custa:** consistência entre contextos é sempre eventual, nunca imediata — nenhuma tela pode assumir que uma reação em outro contexto já aconteceu no instante seguinte à publicação do evento.
- **Impede:** um contexto "pedir" a outro para fazer algo de forma síncrona e bloqueante — se essa necessidade aparecer, é sinal de que a fronteira de Ownership foi mal desenhada, não motivo para introduzir um mecanismo de comando.
