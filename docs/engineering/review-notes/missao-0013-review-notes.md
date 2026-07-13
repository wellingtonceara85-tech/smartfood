# Review Notes — Missão 0013 (Cozinha)

**Rodada:** 1 (única — aprovado integralmente, com um refinamento)
**Data:** 2026-07-13
**Revisor:** Wellington (CTO/PO), dentro da conversa

## Veredito

Aprovado integralmente. As duas correções levantadas no Draft (desmembrar `PRONTO`/`SAIU_PARA_ENTREGA`, fila vazia até Pagamento existir) foram confirmadas explicitamente como corretas, com justificativa de domínio, não só técnica. Um refinamento adicional (invariante da fila).

## O que mudou e por quê

1. **Correção 1 (desmembrar o enum) aprovada e registrada como [ADR-0025](../adr/ADR-0025-pronto-saiu-para-entrega-estados-distintos.md).** Motivo explícito do revisor: `Pronto` e `Saiu para Entrega` representam responsabilidades de Bounded Contexts diferentes (Cozinha vs. Entrega) — misturá-los faria a Cozinha "consumir" parte do domínio de Entrega, contra a separação de fronteiras já praticada desde a Missão 0009. Feito agora deliberadamente, antes de existir dado real em produção (custo mínimo hoje, ordens de magnitude maior depois). Wellington pediu explicitamente que ficasse registrado que isso é correção de modelagem, não mudança de regra de negócio — daí o ADR, não só uma nota na review notes.
2. **Correção 2 (fila vazia até Pagamento) aprovada sem ressalvas.** Elogiada explicitamente como a decisão certa — a alternativa rejeitada (`POST /pedidos/:id/marcar-como-pago` só para "alimentar a cozinha") foi citada nominalmente pelo revisor como o tipo de atalho que normalmente vira dívida técnica permanente.
3. **Nomes dos eventos (`PEDIDO_EM_PREPARO`, `PEDIDO_PRONTO`) confirmados sem alteração** — consistentes com o padrão já estabelecido (`EMPRESA_CRIADA`, `PEDIDO_CRIADO`, `PEDIDO_CANCELADO`).
4. **Estrutura façade do módulo Cozinha (sem Agregado, sem repositório, sem infraestrutura própria) confirmada e elogiada** — reduz risco de duplicação de regra entre Cozinha e Pedidos.
5. **Nova invariante adicionada**: um Pedido em `Pronto` nunca retorna para a fila da Cozinha — parece óbvio, mas registrado explicitamente como regra de domínio, com teste de regressão dedicado exigido na DoD, para a consulta da fila nunca passar a incluir `Pronto` por acidente.

## O que NÃO mudou (confirmado como já correto no Draft)

- RBAC (Administrador/Gerente/Supervisor/Operador para as três rotas) — coerente com a Missão 0002, Seção 14 (Cozinha já era especialização de Operador).
- Sem tabela `cozinha`, sem schema Prisma novo além do desmembro do enum.
- Sem barramento assíncrono nesta missão — relay/dispatcher do Outbox fica para missão de plataforma futura.
- Cancelamento continua exclusivo do BC Pedidos — Cozinha não ganha rota própria de cancelar.
- Todas as exclusões de escopo (Entrega, Pagamento, tempo de preparo, Fila Zero, Caixa/Motoboy).

## Próximo passo

Documento consolidado e marcado como **CONGELADA — versão oficial**. [ADR-0025](../adr/ADR-0025-pronto-saiu-para-entrega-estados-distintos.md) criado e indexado. Implementação segue direto em incrementos pequenos e validados, mesmo modelo das Missões 0009-0012.
