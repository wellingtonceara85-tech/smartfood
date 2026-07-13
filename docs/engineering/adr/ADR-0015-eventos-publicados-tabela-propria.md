# ADR-0015 — Registro de Evento Publicado como Tabela Própria, Distinta de Auditoria

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0006 — Modelagem do Banco de Dados](../../product/missao-0006-modelagem-banco-dados.md), Seção 7

## Contexto

A Missão 0005 (ADR-0013) estabeleceu que a publicação de um Evento de Domínio precisa de garantia atômica com a mudança de estado que o originou. Fisicamente, isso exige uma estrutura de dado que registre o compromisso de publicação. Havia a tentação de reaproveitar o Registro de Auditoria (Missão 0004) para esse fim, já que ambos são "logs" de algo que aconteceu.

## Decisão

`eventos_publicados` é uma tabela própria, **distinta e independente** de `registros_auditoria`, com campo `empresa_id` obrigatório desde a primeira definição.

## Alternativas consideradas

- **Reaproveitar `registros_auditoria` para também registrar eventos de domínio:** rejeitado — os dois têm propósito e ciclo de vida diferentes (Missão 0005, Seção 5: Evento de Domínio é sobre mudança de estado com possível reação de outro contexto, incluindo eventos sem ator humano; Auditoria é sobre responsabilização de ação humana). Misturar as duas tabelas forçaria uma política de retenção comum para propósitos que legitimamente têm prazos diferentes, e tornaria consultas de cada finalidade mais lentas e confusas.
- **Não persistir evento publicado, confiando inteiramente no mecanismo de mensageria escolhido na Missão 0007 para garantir entrega:** rejeitado — sem registro no banco na mesma transação da mudança de estado, a Garantia de Publicação (ADR-0013) não é fisicamente sustentável; a persistência é o que torna a garantia real, não apenas declarada.

## Consequências

- **Facilita:** reprocessamento seletivo, troubleshooting e auditoria de integração ficam desacoplados da auditoria de responsabilização humana; cada um evolui e retém dado no seu próprio ritmo.
- **Custa:** mais uma tabela para manter, com crescimento potencialmente alto em volume (mitigado por política de retenção, Missão 0006 Seção 7/12).
- **Impede:** qualquer necessidade futura de "separar auditoria de eventos" como retrabalho — já nascem separados.
