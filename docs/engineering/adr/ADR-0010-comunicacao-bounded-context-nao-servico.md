# ADR-0010 — "Comunicação" é Bounded Context com Lógica Própria, Não Serviço Compartilhado

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seções 2 e 7

## Contexto

Notificação de cliente/equipe é, à primeira vista, parecida com outros serviços de infraestrutura (Logs, Arquivos, Cache) — algo que "todo contexto usa". Era preciso decidir se Comunicação seria modelada como Serviço Compartilhado genérico ou como Bounded Context de negócio com modelo e regra próprios.

## Decisão

**Comunicação é um Bounded Context**, não um Serviço Compartilhado. A orquestração de _o quê_ é comunicado, _quando_ e _para quem_ é lógica de negócio própria (ex: regra de quando notificar sobre atraso, qual canal usar por tipo de evento). O que seria genérico — o mecanismo bruto de despacho de mensagem por um canal — é detalhe de implementação, não decisão desta missão.

## Alternativas consideradas

- **Modelar Comunicação como Serviço Compartilhado, ao lado de Logs/Auditoria/Arquivos:** rejeitado — esses serviços não têm regra de negócio (Logs não decide "quando" logar algo com base em regra de domínio; Comunicação decide "quando notificar" com base em regra de domínio real, ex: `PEDIDO_CRIADO` gera notificação, mas um evento interno não gera). Tratar como serviço genérico esconderia essa lógica de negócio real em algum lugar sem dono claro.
- **Deixar cada Bounded Context implementar sua própria lógica de notificação:** rejeitado — reintroduziria exatamente a duplicação que a criação do Bounded Context Comunicação (herdado da Missão 0002) já eliminou uma vez.

## Consequências

- **Facilita:** um único lugar concentra toda decisão de "o que vira mensagem para alguém" — mudança de política de notificação (ex: adicionar um novo canal, mudar regra de quando notificar) acontece em um só Bounded Context.
- **Custa:** todo contexto que precisa notificar alguém depende de Comunicação como Tier 3 (Missão 0005, Seção 3) — não pode implementar seu próprio atalho de envio "só dessa vez".
- **Impede:** a futura camada de Agentes de IA (Smart AI Guide) de criar seu próprio canal de saída — ela deve, por design, também passar por Comunicação, preservando o ponto único de decisão sobre comunicação com o usuário.
