# ADR-0011 — Inteligência Artificial e Relatórios & Analytics como Capabilities, Não Bounded Contexts

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 2 (Rodada 2 de revisão)

## Contexto

A revisão da Missão 0005 levantou a questão explicitamente: Inteligência Artificial e Relatórios & Analytics deveriam ser Bounded Contexts, como os demais 10, ou algo diferente? Nenhum dos dois possui agregado de negócio próprio, nenhum escreve em outro contexto, e nenhum desenvolveu uma linguagem ubíqua distinta até o momento — são consumidores de evento/consulta que reprocessam dado de outros contextos.

## Decisão

Inteligência Artificial e Relatórios & Analytics são tratados como **Capabilities da Plataforma** (Inteligência Artificial, consumida via o serviço compartilhado "Acesso a IA", alinhado ao Smart AI Guide) e **Plataforma de Leitura / Read Platform** (Relatórios & Analytics), respectivamente — não Bounded Contexts. Posição no mapa de dependência (Tier 4) permanece a mesma; muda apenas o rótulo e a implicação de que nenhum dos dois é dono de decisão de negócio (Ownership, Missão 0005 Seção 2).

## Alternativas consideradas

- **Modelar como Bounded Context desde já, antecipando maturidade futura:** rejeitado por ora — modelar fronteira de linguagem para um domínio que ainda não desenvolveu linguagem própria é especulativo; contraria o princípio de não investir modelagem de domínio em algo sem necessidade real comprovada (mesmo princípio já aplicado a "Entidades Futuras" na Missão 0004).
- **Tratar como Serviço Compartilhado genérico:** rejeitado — nem Recomendação de IA nem Análise de Relatório são tão genéricos quanto Logs ou Cache; ambos consomem e reprocessam dado específico do domínio SmartFood, mais próximos de "capacidade de plataforma orientada a dado" do que de infraestrutura pura.

## Consequências

- **Facilita:** evita fronteira de contexto artificial e prematura — o esforço de modelagem de domínio fica reservado para quando realmente existir modelo a proteger.
- **Custa:** hoje, qualquer regra de negócio real que a IA ou os Relatórios desenvolverem fica "solta" dentro da Capability, sem a disciplina de fronteira que um Bounded Context formal impõe — risco aceito conscientemente, monitorado pelo gatilho de reclassificação abaixo.
- **Impede:** nada de forma permanente — esta é uma decisão explicitamente revisável.

## Gatilho de reclassificação

Se Inteligência Artificial ou Relatórios & Analytics desenvolverem uma linguagem própria e passarem a concentrar regra de negócio específica que hoje não existe (ex: um "Modelo de Recomendação" versionado com política de negócio própria que a IA passa a _decidir_, não só sugerir; ou um "Score de Comparação Anônima" que vira produto com regra própria protegida), cada um vira candidato real a Bounded Context — consistente com a trajetória Generic → Supporting → potencialmente Core da IA já definida na Missão 0004.

_Nota: esta é uma decisão de arquitetura para o estágio atual do produto, não uma verdade absoluta — equipes experientes em DDD modelam Analytics/IA como Bounded Context quando eles já desenvolveram linguagem própria, exatamente o critério do gatilho acima._
