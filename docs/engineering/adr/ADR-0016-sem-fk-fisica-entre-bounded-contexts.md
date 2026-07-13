# ADR-0016 — Nenhuma Foreign Key Física nem JOIN de Banco Cruza Fronteira de Bounded Context

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0006 — Modelagem do Banco de Dados](../../product/missao-0006-modelagem-banco-dados.md), Seções 3 e 9 (substitui formulação ambígua da Rodada 1)

## Contexto

A Missão 0005 estabeleceu que nenhum Bounded Context acessa o agregado interno de outro (Seção 1) e que cada contexto deve poder migrar para armazenamento próprio sem redesenho do modelo. A primeira rodada desta missão traduziu essa regra de forma inconsistente: em algumas relações usou "chave estrangeira lógica", em outra usou "nunca com `CASCADE`" — deixando ambíguo se uma constraint física sem cascade seria aceitável entre contextos.

## Decisão

Entre Bounded Contexts, **nunca existe Foreign Key física**, em nenhuma variação (com ou sem cascade). Existe apenas: (1) o ID armazenado como coluna comum, sem constraint de integridade referencial no banco; (2) validação pela camada de aplicação quando necessário; (3) consistência mantida por Evento de Domínio. Nenhuma consulta de negócio faz `JOIN` direto de banco cruzando schema de contextos diferentes — composição de dado de mais de um contexto acontece na camada de aplicação. Vale mesmo quando os schemas estão fisicamente no mesmo banco.

## Alternativas consideradas

- **FK física sem `CASCADE` entre contextos** (a formulação ambígua da Rodada 1): rejeitada — mesmo sem cascade, uma constraint de integridade referencial acopla fisicamente os dois schemas ao mesmo motor de banco; qualquer decisão futura de migrar um Bounded Context para armazenamento próprio (promessa explícita da Missão 0005) exigiria primeiro remover essa constraint, um passo de migração evitável se a regra for correta desde o início.
- **Permitir `JOIN` entre schemas só para consultas de leitura/relatório, mantendo a regra só para escrita:** rejeitado — abriria uma exceção explorável sob pressão de prazo ("é só uma consulta de relatório"), e a Missão 0005 já havia sinalizado esse risco específico (proliferação de acoplamento por conveniência).

## Consequências

- **Facilita:** qualquer Bounded Context pode, em teoria, migrar para um banco fisicamente separado sem exigir nenhuma mudança de schema nos contextos que o referenciam — a independência arquitetural da Missão 0005 é real, não apenas documental.
- **Custa:** nenhuma garantia de integridade referencial entre contextos vem "de graça" do banco — a aplicação precisa lidar explicitamente com a possibilidade de uma referência apontar para um registro que não existe mais (raro, mas possível sob falha), tratando isso como parte normal da consistência eventual (Missão 0005, ADR-0006).
- **Impede:** qualquer otimização de performance futura que dependa de `JOIN` cruzando contexto — se isso parecer necessário, é sinal de fronteira de Bounded Context mal desenhada (ADR-0004/0005), não motivo para abrir exceção nesta regra.
