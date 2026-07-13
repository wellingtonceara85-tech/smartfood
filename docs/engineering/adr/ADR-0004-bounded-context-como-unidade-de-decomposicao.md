# ADR-0004 — Bounded Context como Unidade de Decomposição

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 2

## Contexto

A Missão 0004 (DDD) classificou 13 Domínios funcionais (Core/Supporting/Generic), herdados diretamente da Missão 0002. Era preciso decidir se a Arquitetura da Solução usaria esses Domínios diretamente como módulos técnicos (1:1), ou se introduziria uma unidade de decomposição própria, potencialmente diferente.

## Decisão

A unidade de decomposição técnica é o **Bounded Context** — a fronteira de modelo e linguagem, não a fronteira de "área do produto". A tradução de Domínio (Missão 0004) para Bounded Context (Missão 0005) **não é obrigatoriamente 1:1**: dois Domínios que compartilham o mesmo agregado central e mudam sempre juntos podem virar um único Bounded Context (ver ADR-0005); um Domínio Generic pode não precisar de Bounded Context próprio, virando Serviço Compartilhado ou Capability em vez disso (ver ADR-0011).

## Alternativas consideradas

- **Mapear os 13 Domínios da Missão 0002/0004 diretamente como 13 módulos técnicos:** rejeitado — um Domínio de produto responde a uma pergunta de negócio, mas não necessariamente corresponde a uma fronteira de modelo saudável do ponto de vista de acoplamento técnico (o caso de Comercial+Operação, ADR-0005, prova isso diretamente).
- **Não ter nenhuma unidade de decomposição formal, deixando a estrutura emergir durante a implementação:** rejeitado — viola o princípio arquitetural de decisão consciente antes de código (mindset desta fase do projeto) e criaria retrabalho estrutural quando o acoplamento real se manifestasse tarde demais.

## Consequências

- **Facilita:** a decomposição reflete realidade técnica de acoplamento e linguagem, não só organização de produto — reduz risco de descobrir um contexto mal desenhado só depois de implementado.
- **Custa:** exige uma tradução explícita (Missão 0005, Seção 2) entre a linguagem de produto (Missão 0002/0004) e a linguagem técnica — um passo a mais de raciocínio que times menos maduros costumam pular.
- **Impede:** qualquer decisão futura de "criar um módulo novo" sem antes verificar se ele de fato tem linguagem e modelo próprios — evita módulo criado por conveniência organizacional.
