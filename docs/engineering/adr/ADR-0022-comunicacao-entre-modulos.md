# ADR-0022 — Comunicação entre Módulos (Implementação Física)

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seções 2 e 5 — implementa fisicamente o ADR-0016 (Missão 0006) e o Princípio "nenhum contexto acessa o agregado interno de outro" (Missão 0005)

## Contexto

O Monólito Modular (ADR-0019) coloca todos os Bounded Contexts no mesmo processo. Sem uma regra explícita de implementação, nada impediria um módulo NestJS de importar e chamar diretamente o repositório/acesso a dado de outro módulo — violando, na prática, tudo que o ADR-0016 (nunca FK física entre contextos) e a Missão 0005 já estabeleceram conceitualmente.

## Decisão

Dentro do monólito modular, um módulo NestJS **só pode ser consumido por outro através de um provider explicitamente exportado** (uma Application Service Interface, no vocabulário da Missão 0005) — nunca importando ou instanciando diretamente o repositório, entidade de banco ou Prisma Client interno de outro módulo. A chamada síncrona entre módulos é uma chamada de função in-process através desse contrato, não uma requisição HTTP interna. Convenção de uso do Prisma (ver Seção 5 da Missão 0007): `@relation` (chave estrangeira física) só é declarada dentro do schema lógico de um mesmo Bounded Context; referência a outro contexto é sempre campo escalar simples, nunca `@relation`.

## Alternativas consideradas

- **Deixar a fronteira de módulo como convenção de time, sem imposição estrutural:** rejeitado — a experiência já registrada na Missão 0006 (Rodada 2 encontrou 4 violações reais de regra já escrita) mostra que regra sem imposição estrutural falha sob pressão de prazo.
- **Comunicação entre módulos via HTTP interno (cada módulo expõe uma API mesmo dentro do mesmo processo):** rejeitado — adiciona custo de serialização/rede desnecessário dentro de um único processo, sem ganho real de desacoplamento sobre um contrato de função bem definido.

## Consequências

- **Facilita:** a fronteira de Bounded Context é imposta pela própria estrutura de módulos do NestJS (encapsulamento de provider), não só por documentação; extração futura de um módulo para um serviço próprio (quando o monólito for dividido) só exige trocar a implementação do contrato de chamada de função para chamada de rede — a interface não muda.
- **Custa:** exige disciplina de definir e manter contratos explícitos entre módulos, em vez de acesso direto "mais rápido de escrever".
- **Impede:** qualquer atalho de "só um import rápido para resolver isso hoje" entre módulos de contextos diferentes — deve ser tratado como erro de arquitetura em revisão de código, não como estilo.
