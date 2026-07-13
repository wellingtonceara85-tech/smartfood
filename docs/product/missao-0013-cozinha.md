# Missão 0013 — Cozinha

**Status:** ✅ CONGELADA — versão oficial
**Data:** 2026-07-13
**Tipo:** Execução (primeira missão que consome, sem criar Agregado próprio)

Draft enxuto, mesmo formato das Missões 0009-0012. Diferente das anteriores, esta missão **não cria nenhum Agregado novo** — opera sobre o Agregado Pedido (Missão 0012) através dos Use Cases que ele exporta (ADR-0022). Sem tabela `cozinha`, sem schema Prisma novo.

## 1. Objetivo

Permitir que a equipe operacional (papel Operador — Missão 0002, Seção 14: Cozinha é especialização de Operador, não papel novo) avance um Pedido por `Recebido → Em Preparo → Pronto`. Sem barramento assíncrono, sem Entrega, sem retomar Pagamento.

## 2. Duas correções antes do restante das decisões (precisam da sua confirmação)

**Correção 1 — `PRONTO` e `SAIU_PARA_ENTREGA` são dois estados, não um (aprovada).** A Missão 0004 escreveu o ciclo do Pedido como "...→ Pronto/Saiu para Entrega → Concluído", com uma barra que a Missão 0012 interpretou como um único valor de enum (`PRONTO_SAIU_PARA_ENTREGA`). A Missão 0002, Seção 7 (fluxo operacional), desfaz a ambiguidade: _"Item é marcado como pronto → Se for entrega, pedido segue para etapa de despacho; se for retirada/mesa, aguarda o cliente/garçom"_ — ou seja, `Pronto` é um momento distinto de `Saiu para Entrega`, que só se aplica a canais de entrega, e pertence a um Bounded Context diferente (Cozinha vs. Entrega). Desmembramento aplicado no enum `StatusPedido` (Prisma, Missão 0012) — migration pequena, sem dado real em produção para migrar. Esta missão só implementa a chegada em `PRONTO`; `SAIU_PARA_ENTREGA` fica para a missão de Entrega. **Registrado como [ADR-0025](../engineering/adr/ADR-0025-pronto-saiu-para-entrega-estados-distintos.md)** — correção de modelagem por ambiguidade de notação entre duas missões já congeladas, explicitamente não uma mudança de regra de negócio.

**Correção 2 — a fila da Cozinha fica vazia até a Missão 0014 existir, e isso é a regra correta, não um bug (aprovada).** Um Pedido só chega a `Recebido` depois de `Pagamento Confirmado` (Missão 0004, Seção 7) — e a Missão 0002, Seção 16, Regra de Negócio Global 3 é explícita: _"o Motor de Pedidos só assume um pedido como recebido de fato após confirmação do domínio Pagamentos — evita que a cozinha comece a preparar algo que não foi pago"_. Como Pagamento (Missão 0014) ainda não existe, **nenhum Pedido real chega a `Recebido` nesta missão** — a fila da Cozinha existirá e funcionará corretamente, só ficará vazia em uso real até a Missão 0014 landar. Não vou criar nenhum atalho tipo "marcar como pago" para preencher a fila artificialmente — isso violaria a Regra Global 3 diretamente. Nos testes, o estado `Recebido` é simulado por fixture direta no banco (mesmo recurso já usado nos testes de outras missões), não por um Caso de Uso de negócio.

## 3. Decisões já propostas (confirmadas, sem alteração)

- **Sem edição de Pedido, só transições.** Cozinha nunca importa `PedidoRepository` — consome exclusivamente os Use Cases que `PedidosModule` passa a exportar: `AvancarPedidoParaEmPreparoUseCase`, `AvancarPedidoParaProntoUseCase`, e uma consulta por status (reaproveitando/estendendo `ListarPedidosUseCase`). Máquina de estados continua centralizada no Agregado Pedido — Cozinha não tem lógica de transição própria.
- **Estados desta missão:** `Recebido → Em Preparo → Pronto`. `Saiu para Entrega`/`Concluído` ficam para a missão de Entrega; `Cancelado` continua sendo responsabilidade exclusiva do BC Pedidos (o endpoint de cancelar já existe lá, Cozinha não ganha um próprio).
- **Sem barramento assíncrono.** Só HTTP síncrono: `GET /cozinha/pedidos`, `POST /cozinha/pedidos/:id/iniciar`, `POST /cozinha/pedidos/:id/finalizar`. O relay/dispatcher do Outbox (ADR-0023) continua sem assinante — fica para uma missão de plataforma futura.
- **RBAC:** Administrador, Gerente, Supervisor e Operador podem listar/iniciar/finalizar — é a primeira permissão de escrita do Operador no sistema, coerente com a Missão 0002 (Cozinha é especialização de Operador).
- **Eventos `PEDIDO_EM_PREPARO` e `PEDIDO_PRONTO`** publicados no Outbox a cada transição — mesmo padrão desde a Missão 0009. _(Nota: não estão nomeados individualmente na tabela de eventos da Missão 0004, que lista eventos de significância cross-BC; são extensão natural do mesmo padrão — particípio passado, ADR-0006 — não invenção de regra de negócio nova.)_
- **Invariante da fila** _(adicionada na revisão)_: um Pedido em `Pronto` nunca retorna para a fila da Cozinha — `ListarPedidosPorStatusUseCase`/a consulta da fila filtra exclusivamente `Recebido`/`Em Preparo`, nunca `Pronto`. Óbvio pela definição da fila, mas registrado explicitamente como regra de domínio e coberto por teste de regressão dedicado (Seção 8), para a consulta nunca passar a incluir `Pronto` por acidente.

## 4. Escopo

### Dentro desta missão

- `PedidosModule` ganha `AvancarPedidoParaEmPreparoUseCase` (`Recebido → Em Preparo`) e `AvancarPedidoParaProntoUseCase` (`Em Preparo → Pronto`) — cada um só aceita a transição a partir do estado anterior exato, rejeita qualquer outro com 400.
- `PedidosModule` ganha `ListarPedidosPorStatusUseCase` (ou parâmetro opcional em `ListarPedidosUseCase`) para a fila da Cozinha.
- Novo módulo **façade** `modules/cozinha/` — só `api/` (Controller + DTOs), sem `domain/`, sem `infrastructure/`, sem Agregado. Importa `PedidosModule` (ADR-0022).
- Migration do desmembro `PRONTO`/`SAIU_PARA_ENTREGA` no enum `StatusPedido`.
- Nova linha em `historico_status_pedido` a cada transição (mesmo padrão da Missão 0012).

### Fora desta missão (explicitamente adiado)

- `Saiu para Entrega`, `Concluído` — missão de Entrega, futura.
- Pagamento real / confirmação automática de `Recebido` — Missão 0014.
- Barramento assíncrono / relay do Outbox — missão de plataforma futura.
- Tempo estimado de preparo, Fila Zero, alertas de canibalização de horário — Pontos de Inovação (Missão 0002), não MVP.
- Qualquer tela/rota própria para Caixa/Motoboy — só Cozinha nesta missão.

## 5. Contrato de API (proposto)

| Método | Rota                             | Caso de uso                             | Auth                                         |
| ------ | -------------------------------- | --------------------------------------- | -------------------------------------------- |
| `GET`  | `/cozinha/pedidos`               | Listar fila (`Recebido` + `Em Preparo`) | Administrador, Gerente, Supervisor, Operador |
| `POST` | `/cozinha/pedidos/:id/iniciar`   | `Recebido → Em Preparo`                 | Administrador, Gerente, Supervisor, Operador |
| `POST` | `/cozinha/pedidos/:id/finalizar` | `Em Preparo → Pronto`                   | Administrador, Gerente, Supervisor, Operador |

Todas as rotas escopadas pela Empresa do token (mesmo padrão `verificarMesmaEmpresa`/comparação direta de `empresaId` já usado em Pedidos).

## 6. Estrutura de módulo

```
backend/src/modules/pedidos/application/use-cases/
├── avancar-pedido-para-em-preparo.use-case.ts   (novo)
├── avancar-pedido-para-pronto.use-case.ts        (novo)
└── listar-pedidos-por-status.use-case.ts         (novo)

backend/src/modules/cozinha/
├── api/
│   ├── cozinha.controller.ts
│   └── dtos/
├── test/
│   └── contract/   (garante: cozinha não importa domain/infrastructure de Pedidos)
└── cozinha.module.ts   (importa PedidosModule, não declara domain/infrastructure)
```

`cozinha.module.ts` não tem `providers` de repositório nem Agregado — só o Controller, injetando os três Use Cases exportados por `PedidosModule`.

## 7. Critérios de simplicidade

Esta missão valida: extensão da máquina de estados do Pedido (duas novas transições, cada uma com sua própria guarda), módulo façade sem Agregado próprio, RBAC estendendo Operador para escrita pela primeira vez. Qualquer regra adicional — tempo de preparo, priorização de fila, notificação em tempo real, Caixa/Motoboy — é adiada, sem exceção.

## 8. Definition of Done

- [ ] `POST /cozinha/pedidos/:id/iniciar` só aceita Pedido em `Recebido`; qualquer outro estado retorna 400.
- [ ] `POST /cozinha/pedidos/:id/finalizar` só aceita Pedido em `Em Preparo`; qualquer outro estado retorna 400.
- [ ] `GET /cozinha/pedidos` lista só Pedidos em `Recebido` ou `Em Preparo`, escopados pela Empresa do token.
- [ ] Teste de regressão dedicado: um Pedido em `Pronto` nunca aparece na fila da Cozinha (invariante, Seção 3).
- [ ] Usuário de outra Empresa recebe 403 em qualquer uma das três rotas.
- [ ] Operador (não só Administrador/Gerente) consegue listar/iniciar/finalizar.
- [ ] Eventos `PEDIDO_EM_PREPARO`/`PEDIDO_PRONTO` publicados no Outbox a cada transição.
- [ ] Nova linha em `historico_status_pedido` a cada transição (mesmo padrão da Missão 0012).
- [ ] Migration Prisma para o desmembro `PRONTO`/`SAIU_PARA_ENTREGA`.
- [ ] Teste de contrato: `cozinha` não importa `domain`/`infrastructure` de `pedidos`, só `application/use-cases`.
- [ ] Teste de integração das duas transições (caminho feliz + rejeição de transição inválida) com repositório real, usando fixture direta para simular `Recebido`.
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `docker compose up` verdes.
- [ ] Nenhuma linha de Pagamento, Entrega, Cupom, Comanda ou Cliente-como-Bounded-Context neste incremento.

## 9. Próximo passo

Aprovado integralmente. Implementação segue em incrementos pequenos e validados, mesmo modelo das Missões 0009-0012.
