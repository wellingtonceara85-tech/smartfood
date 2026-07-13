# ADR-0013 — Garantia de Publicação de Evento Atômica à Mudança de Estado

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 6 (Rodada 2 de revisão) — complementa ADR-0009

## Contexto

O ADR-0009 estabelece que a publicação do evento é sempre posterior à confirmação da transação principal. Isso resolve a questão de _ordem_, mas não a de _garantia_: o que acontece se o sistema falhar exatamente entre "o estado mudou" e "o evento foi publicado"? Sem uma resposta explícita, esse é o tipo de falha que não gera erro visível — só um sistema gradualmente inconsistente, o pior cenário de se depurar.

## Decisão

O fato de que um evento **precisa** ser publicado é registrado como parte da **mesma operação atômica** que a mudança de estado do agregado que o originou — princípio arquitetural equivalente ao Outbox Pattern, sem prescrever mecanismo de implementação. Se a mudança de estado é confirmada, o compromisso de publicar o evento correspondente também está garantido, mesmo que a entrega efetiva ao Event Bus (ADR-0006) aconteça um instante depois.

## Alternativas consideradas

- **Publicar o evento diretamente ao Event Bus como parte do mesmo processo que confirma o estado, sem registro intermediário:** rejeitado — se o processo falhar depois de confirmar o estado mas antes de conseguir publicar (ex: queda de processo, falha de rede para o Event Bus), o evento se perde silenciosamente e nenhuma parte do sistema é avisada disso.
- **Aceitar perda ocasional de evento como risco tolerável, compensado por reconciliação periódica manual:** rejeitado — o custo de detectar e corrigir manualmente um evento perdido (ex: Fidelidade nunca creditou pontos de um pedido concluído, e ninguém percebeu) é maior do que o custo de garantir a publicação corretamente desde o início.

## Consequências

- **Facilita:** confiança de que "se a operação de negócio teve sucesso, o resto do sistema eventualmente saberá disso" — elimina uma classe inteira de bug silencioso de inconsistência.
- **Custa:** exige que a implementação (Missão 0006/0007) trate a publicação de evento como parte do desenho de persistência do agregado, não como uma chamada de rede solta depois da lógica de negócio — decisão de design que precisa ser levada para a modelagem física.
- **Impede:** qualquer implementação futura de "só chamar o Event Bus depois de tudo pronto, sem registro do compromisso" — essa abordagem, mais simples de implementar, é explicitamente rejeitada por esta ADR.
