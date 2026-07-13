# ADR-0012 — Anti-Corruption Layer Obrigatória em Toda Fronteira Externa

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 2 (Rodada 2 de revisão)

## Contexto

O SmartFood integra com sistemas fora do seu controle (gateway de pagamento, futura sincronização com marketplace de pedido, parceiros do Ecossistema). Cada um desses sistemas tem seu próprio modelo, nomenclatura e formato. Era preciso decidir como o domínio interno se protege de absorver essas particularidades externas.

## Decisão

Toda fronteira com sistema externo passa por uma **Anti-Corruption Layer (ACL)**, dentro do contexto responsável pela integração (tipicamente Ecossistema, ou Pagamentos no caso do gateway). Regra direcional e não-negociável: **o parceiro externo é adaptado ao modelo de domínio do SmartFood — nunca o contrário.** A tradução acontece uma única vez, na borda; o que passa para dentro de qualquer Bounded Context já fala a Linguagem Ubíqua do SmartFood (Missão 0004).

## Alternativas consideradas

- **Deixar o modelo de dado do parceiro externo se propagar diretamente para dentro do domínio** (ex: usar o formato de status do gateway de pagamento como o próprio status do Pagamento interno): rejeitado — acopla o modelo de domínio interno diretamente à API de um fornecedor externo; qualquer mudança de contrato do parceiro se propagaria para dentro do domínio, e a Linguagem Ubíqua deixaria de ser única (o time passaria a pensar em dois vocabulários simultâneos).
- **Aplicar tradução caso a caso, sem camada formal:** rejeitado — sem um ponto único e disciplinado de tradução, a tendência natural é vazamento gradual de conceito externo para dentro do domínio, especialmente sob pressão de prazo.

## Consequências

- **Facilita:** mudança na API de um parceiro externo nunca força mudança no modelo de domínio — só na camada de tradução; múltiplos parceiros com formatos diferentes (ex: dois gateways de pagamento distintos no futuro) podem coexistir sem que o domínio interno saiba da diferença.
- **Custa:** exige escrever e manter uma camada de tradução explícita para cada integração — trabalho que uma integração "direta e rápida" não teria.
- **Impede:** modelo pobre ou inconsistente de um parceiro externo de "contaminar" a qualidade do modelo de domínio interno — o padrão de qualidade do domínio do SmartFood nunca é refém do padrão de qualidade de terceiros.
