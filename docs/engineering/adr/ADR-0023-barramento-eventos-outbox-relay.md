# ADR-0023 — Barramento de Eventos: Outbox + Relay In-Process

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seção 6 — implementa fisicamente ADR-0013 (Missão 0005) e a tabela `eventos_publicados` (Missão 0006, Seção 7)

## Contexto

O Barramento de Eventos conceitual (Missão 0005, Seção 6) e a Garantia de Publicação atômica (ADR-0013) exigem que o compromisso de publicar um evento nasça na mesma transação da mudança de estado que o originou. A Missão 0006 já modelou a tabela `eventos_publicados` como o registro físico desse compromisso. Faltava decidir o mecanismo real que lê essa tabela e entrega o evento aos interessados.

## Decisão

**Padrão Outbox com relay in-process**: a mudança de estado do Agregado e a inserção do registro em `eventos_publicados` acontecem na mesma transação de banco. Um processo de relay, rodando dentro da própria aplicação (Monólito Modular, ADR-0019), consulta periodicamente eventos com status pendente e invoca diretamente os handlers dos módulos assinantes (chamada de função in-process, seguindo o contrato do ADR-0022) — sem broker de mensageria externo nesta fase.

## Alternativas consideradas

- **Broker gerenciado na nuvem desde o início:** rejeitado por ora — resolve um problema (entrega entre processos/serviços) que o SmartFood ainda não tem, dado que o Monólito Modular roda em um único processo. Adotá-lo agora pagaria custo e complexidade operacional por um requisito inexistente.
- **Broker auto-hospedado (ex: fila em container próprio):** rejeitado pelo mesmo motivo, com Operabilidade ainda pior — equipe pequena operando infraestrutura de mensageria sem necessidade real.
- **Evento em memória, sem persistência (event emitter simples):** rejeitado — viola diretamente a Garantia de Publicação do ADR-0013; um evento em memória se perde se o processo cair entre a mudança de estado e o despacho.

## Consequências

- **Facilita:** idempotência via ID único de evento; retry via nova tentativa de leitura da tabela; dead letter via a coluna de status já definida na Missão 0006; ordenação por Agregado via ordenação da consulta; correlação via a coluna já definida — todos os requisitos conceituais da Missão 0005 atendidos sem infraestrutura extra.
- **Custa:** o mecanismo de despacho (relay in-process) não sobrevive, como está, a uma futura divisão do monólito em serviços — precisará trocar para publicação em um broker real quando isso acontecer. Registrado como Dívida Tecnológica Deliberada na Missão 0007 (Seção 17).
- **Impede:** entrega de evento entre processos diferentes hoje — irrelevante enquanto a topologia for monólito modular (ADR-0019); a tabela outbox e o contrato de evento (schema, versionamento) permanecem estáveis através da futura migração de mecanismo de despacho.
