# Missão 0012 — Pedidos

**Status:** ✅ CONGELADA — versão oficial
**Data:** 2026-07-12
**Tipo:** Execução (quarto Bounded Context de negócio — o de maior acoplamento do domínio, Missão 0004 Seção 8/EPIC-002)

Draft enxuto, mesmo formato das Missões 0009/0010/0011. Nenhuma decisão arquitetural nova — recorta, dentro do que já está congelado (Missão 0004 Seções 2/6/7/11, ADR-0003, Missão 0006 Seção 9), o primeiro incremento executável de Pedido. Como Pedido é explicitamente o agregado mais acoplado do sistema (EPIC-002), esta missão é deliberadamente mais estreita que as anteriores — cria a fundação, não o fluxo completo.

## 1. Objetivo

Implementar o Bounded Context **Pedidos**: um Usuário interno autenticado registra um Pedido (itens do Catálogo, snapshot completo — ADR-0003), o Pedido nasce e pode ser cancelado. Sem Pagamento, sem Cozinha, sem Entrega — cada um é sua própria missão futura (0013 Cozinha, 0014 Pagamentos), e o Pedido já nasce pronto para elas se conectarem depois, sem migração estrutural.

## 2. Respondendo às decisões sensíveis (pedidas explicitamente antes do Draft)

**Quem pode criar um Pedido?** Só **Usuário interno autenticado** nesta missão (ex.: atendente lançando pedido de Balcão/Mesa). O fluxo de **Cliente autenticado via Vitrine** (checkout self-service) é o outro fluxo do ADR-0024, mas depende de Cliente (Bounded Context próprio, ainda não construído) e de Vitrine (explicitamente fora de escopo desde a Missão 0011) — **não dá para construir agora sem inventar coisa nova**. Fica adiado para quando esses dois pré-requisitos existirem.

**Estados do Pedido:** já congelados na Missão 0004, Seção 7 — não é decisão desta missão, só implementação:

```
Criado (checkout confirmado) → Aguardando Pagamento
  → Pagamento Recusado → (tenta de novo ou abandona — nunca chega a Recebido)
  → Pagamento Confirmado → Recebido → Em Preparo → Pronto/Saiu para Entrega → Concluído
  (a partir de qualquer estado antes de Concluído) → Cancelado
```

Terminal: **Concluído** ou **Cancelado**, nunca retrocede (Regra de Negócio Global 1). Nesta missão, **só duas transições têm Caso de Uso real**: `Criado → Aguardando Pagamento` (automática, dentro do próprio `CriarPedido`) e `(qualquer estado pré-Concluído) → Cancelado`. As demais (`Recebido`, `Em Preparo`, `Pronto/Saiu para Entrega`, `Concluído`) são disparadas por Pagamento (0014) e Cozinha/Entrega (0013+) — o campo `status` já modela todo o enum, mas só essas duas transições têm código nesta missão.

**Invariante explícita de estado terminal** _(adicionada na revisão)_: `Concluído` e `Cancelado` são ambos imutáveis — nenhum dos dois transita para nenhum outro estado, nem entre si. `CancelarPedido` rejeita explicitamente um Pedido já `Concluído` ou já `Cancelado`, não só implicitamente via "estado pré-Concluído".

**Correção a um dos itens pedidos na revisão:** `PEDIDO_CONFIRMADO` não é um Evento de Domínio definido na Missão 0004 — o que existe é `PAGAMENTO_CONFIRMADO` (evento do agregado **Pagamento**, outra missão) fazendo o Pedido avançar de status. Não vou inventar um `PEDIDO_CONFIRMADO` que não está congelado; a lista real de eventos desta missão é `PEDIDO_CRIADO` e `PEDIDO_CANCELADO` (ambos já na Missão 0004, Seção 6).

**Imutabilidade:** itens, preços e endereço de entrega nunca mudam após a criação (ADR-0003) — não existe endpoint de edição, só de transição de status. `status` muda exclusivamente via Caso de Uso dedicado (nunca um `PATCH` genérico).

**Snapshot do Produto:** cada Item do Pedido copia nome, descrição, código interno/SKU da Variação e preço do Produto/Variação no momento da criação (ADR-0003) — resolvido via um Use Case novo e específico exportado pelo Catálogo, `BuscarProdutoParaPedidoUseCase` (ver Seção 7), em vez de reaproveitar `BuscarProdutoPorIdUseCase` — evita que Pedidos dependa da representação interna completa de Produto, só do DTO estritamente necessário para montar o snapshot (nome, descrição, SKU, preço, disponibilidade). Depois de copiado, o Item do Pedido nunca mais consulta o Catálogo. O campo `codigoInterno` (SKU) é uma pequena adição aditiva à Variação do Catálogo (Missão 0011) — mesmo padrão de "placeholder de baixo custo" já usado para `imagemUrl`/`controlaEstoque` naquela missão, nulo até existir um fluxo real de cadastro de SKU.

**Validação de disponibilidade na criação** _(adicionada na revisão)_: além de existir e pertencer à Empresa do chamador, `CriarPedido` também rejeita (400) qualquer item cujo Produto ou Variação estejam `disponivel: false` no Catálogo no momento da criação — não faz sentido vender algo desligado, e a Missão 0011 já expõe exatamente esse dado.

**Preço:** persistido como snapshot no Item do Pedido (nunca recalculado a partir do Catálogo atual) — decisão já tomada no ADR-0003, esta missão só aplica.

**Eventos:** `PEDIDO_CRIADO` e `PEDIDO_CANCELADO`, publicados no Outbox já existente (mesmo padrão desde a Missão 0009) — sem assinante ainda.

**Escopo:** 1 Loja por Empresa (MVP atual) — Pedido é escopado por **Empresa**, não por Loja (Missão 0006, Seção 5: `pedidos (empresa_id, status)`, diferente de Produto que é por Loja — ADR-0018). Multiloja fica para quando a segunda Loja existir de verdade.

## 3. Pedido sem Cliente — característica do domínio, não limitação temporária (aprovado na revisão)

A Missão 0004 modela Pedido como referenciando um Cliente, mas isso nunca foi dito como _obrigatório_ — e a realidade de qualquer PDV confirma isso: Balcão, Mesa, consumo interno, pedido por telefone — todos existem rotineiramente sem cliente cadastrado. Por isso `clienteId` **nasce opcional por design, não porque o Bounded Context Clientes ainda não existe** — mesmo depois de Clientes ser construído, um Pedido continuará podendo existir sem vínculo. Quando Clientes nascer, ele só passa a **preencher** esse relacionamento quando fizer sentido (ex.: Cliente se identifica no balcão) — nunca vai exigi-lo retroativamente nem invalidar Pedidos antigos sem Cliente.

## 4. Escopo

### Dentro desta missão

- Agregado **Pedido**: itens (snapshot), canal de venda, endereço de entrega (opcional, VO), status, timeline de status (`historico_status_pedido`, Missão 0006).
- Caso de uso **CriarPedido**: recebe lista de `{produtoId, variacaoId, quantidade}`, resolve cada um via `BuscarProdutoParaPedidoUseCase` (Catálogo, Seção 7), valida disponibilidade, monta snapshot, calcula `valorTotal` (soma simples — sem cupom/desconto, isso é Marketing, não construído), grava com status `Aguardando Pagamento` e já cria a primeira linha do histórico de status (`Aguardando Pagamento`) na mesma transação — nenhum Pedido existe sem histórico.
- Caso de uso **CancelarPedido**: transita para `Cancelado` a partir de qualquer estado pré-`Concluído`; rejeita explicitamente `Concluído`/`Cancelado` (Seção 2, invariante de estado terminal).
- Casos de uso **BuscarPedidoPorId**, **ListarPedidos** (por Empresa).
- RBAC reaproveitando `platform/auth/` — mesma matriz da Missão 0011 (Administrador/Gerente escrevem; qualquer Usuário autenticado da Empresa lê).
- Eventos `PEDIDO_CRIADO` / `PEDIDO_CANCELADO` no Outbox.
- Schema Prisma `vendas_operacao` (Missão 0006, Seção 9): `pedidos` (`empresa_id`), `itens_pedido`, `historico_status_pedido`.

### Fora desta missão (explicitamente adiado)

- Checkout self-service por **Cliente** (depende de Cliente + Vitrine, nenhum dos dois existe).
- **Pagamento** — sem gateway, sem confirmação real; o Pedido fica em `Aguardando Pagamento` e não avança sozinho.
- **Cozinha/Painel operacional** (Em Preparo, fila) — Missão 0013.
- **Entrega** (Motoboy, rastreamento) — missão futura própria.
- **Cupom/desconto** — depende de Marketing, não construído.
- **Comanda** (agrupar Pedidos por Mesa) — v2.0 (EPIC-002).
- Edição de Pedido já criado — proibido por design (ADR-0003), não é "fora de escopo temporário", é regra permanente.

## 5. Modelagem (herdada, não decidida aqui)

| Campo (Pedido)       | Tipo             | Observação                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | UUID             | PK                                                                                                                                                                                                                                                                                                                                                  |
| `empresaId`          | String           | sem FK física (Missão 0006, Seção 5 — Pedido é por Empresa, não por Loja)                                                                                                                                                                                                                                                                           |
| `clienteId`          | String, opcional | sem FK física — ver Seção 3                                                                                                                                                                                                                                                                                                                         |
| `criadoPorUsuarioId` | String           | sem FK física (cruza para `identidade_empresa`/`usuarios`)                                                                                                                                                                                                                                                                                          |
| `canalVenda`         | enum             | `SITE\|QR_CODE\|MESA\|BALCAO\|AUTOATENDIMENTO\|MARKETPLACE\|API` (Missão 0006) — todo o enum é aceito desde já (é só validação de valor, sem custo); na prática só `MESA`/`BALCAO`/`AUTOATENDIMENTO` fazem sentido vindo de um Usuário interno nesta missão, mas nenhuma migration futura será necessária quando Totem/QR Code existirem de verdade |
| `enderecoEntrega`    | VO, opcional     | rua/número/bairro/cidade/CEP/complemento (Missão 0006) — nulo para canais sem entrega                                                                                                                                                                                                                                                               |
| `status`             | enum             | todo o ciclo da Missão 0004, Seção 7 (Seção 2 acima)                                                                                                                                                                                                                                                                                                |
| `valorTotal`         | decimal          | soma dos itens no momento da criação                                                                                                                                                                                                                                                                                                                |
| `criadoEm`           | datetime         | `now()`                                                                                                                                                                                                                                                                                                                                             |

| Campo (Item do Pedido)                            | Tipo             | Observação                                                                           |
| ------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `id`                                              | UUID             | PK                                                                                   |
| `pedidoId`                                        | UUID             | FK física (mesmo Agregado)                                                           |
| `produtoId` / `variacaoId`                        | String           | referência histórica, sem FK (ADR-0003 — Item não depende do Catálogo para exibição) |
| `nomeProduto`, `nomeVariacao`, `descricaoProduto` | string           | snapshot                                                                             |
| `codigoInternoVariacao` (SKU)                     | string, opcional | snapshot — adicionada na revisão, facilita auditoria futura                          |
| `precoValor`, `precoMoeda`                        | decimal/string   | snapshot (Dinheiro)                                                                  |
| `quantidade`                                      | int              |                                                                                      |

| Campo (Histórico de Status) | Tipo     | Observação |
| --------------------------- | -------- | ---------- |
| `id`                        | UUID     | PK         |
| `pedidoId`                  | UUID     | FK física  |
| `status`                    | enum     |            |
| `ocorridoEm`                | datetime |            |

## 6. Contrato de API (proposto)

| Método | Rota                    | Caso de uso               | Auth                         |
| ------ | ----------------------- | ------------------------- | ---------------------------- |
| `POST` | `/pedidos`              | Criar Pedido              | Administrador ou Gerente     |
| `GET`  | `/pedidos/:id`          | Buscar Pedido por Id      | Qualquer Usuário autenticado |
| `GET`  | `/pedidos`              | Listar Pedidos da Empresa | Qualquer Usuário autenticado |
| `POST` | `/pedidos/:id/cancelar` | Cancelar Pedido           | Administrador ou Gerente     |

## 7. Estrutura de módulo

`modules/pedidos/` seguindo a mesma anatomia dos módulos anteriores. Importa `CatalogoModule` (ADR-0022) do mesmo jeito que `catalogo` importa `IdentidadeEmpresaModule` — mesmo padrão de contrato de teste "permite `application/use-cases` de outro módulo, bloqueia o resto".

**Novo Use Case exportado pelo Catálogo** _(adicionado na revisão)_: em vez de Pedidos consumir `BuscarProdutoPorIdUseCase` (que devolve a representação interna completa de Produto), o Catálogo passa a exportar também `BuscarProdutoParaPedidoUseCase`, devolvendo só um DTO estreito — nome, descrição, SKU da Variação, preço, disponibilidade do Produto e da Variação. Isso evita que Pedidos fique acoplado a como Produto é modelado internamente; se o Catálogo mudar sua representação interna no futuro, só esse DTO precisa continuar estável.

## 8. Critérios de simplicidade

Esta missão valida: Agregado Pedido com snapshot completo (ADR-0003), máquina de estados que nunca retrocede, consumo do Catálogo via Use Case exportado, Outbox para os dois eventos que realmente existem. Qualquer regra adicional — pagamento real, cozinha, entrega, cupom, comanda, edição — é adiada, sem exceção, mesmo que pareça pequena durante a implementação.

## 9. Definition of Done

- [ ] `POST /pedidos` cria Pedido + Itens (snapshot) em transação única, calcula `valorTotal`, status inicial `Aguardando Pagamento`, cria a primeira linha do histórico junto, retorna 201.
- [ ] `POST /pedidos` rejeita item com `produtoId`/`variacaoId` inexistente ou de outra Empresa.
- [ ] `POST /pedidos` rejeita Produto ou Variação indisponível no Catálogo (400) — recomendação obrigatória da revisão.
- [ ] `POST /pedidos/:id/cancelar` transita para `Cancelado` a partir de qualquer estado pré-`Concluído`; rejeita explicitamente se já `Concluído` ou já `Cancelado`.
- [ ] `GET /pedidos/:id` retorna 200 com Itens, 404 se não existir, 403 se de outra Empresa.
- [ ] `GET /pedidos` lista só os Pedidos da Empresa do chamador.
- [ ] Evento `PEDIDO_CRIADO` publicado no Outbox na criação; `PEDIDO_CANCELADO` no cancelamento.
- [ ] Migration Prisma para `vendas_operacao.pedidos`, `itens_pedido`, `historico_status_pedido`, e para o novo campo `codigoInterno` em `catalogo.variacoes_produto`.
- [ ] Teste unitário de domínio (invariante: Pedido nunca retrocede de status; `Concluído`/`Cancelado` são terminais e imutáveis).
- [ ] Teste de integração dos Casos de Uso principais (Criar Pedido com snapshot correto, Cancelar Pedido) com repositório real.
- [ ] Teste de contrato: módulo `pedidos` só consome `catalogo`/`identidade-empresa` via Use Case exportado.
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `docker compose up` verdes.
- [ ] `POST /pedidos` responde em menos de 500ms local (mesmo critério informal das missões anteriores).
- [ ] Nenhuma linha de Pagamento, Cozinha, Entrega, Cupom, Comanda ou Cliente-como-Bounded-Context neste incremento.

## 10. Próximo passo

Aprovado com os refinamentos acima — implementação segue em incrementos pequenos e validados, mesmo modelo das Missões 0009/0010/0011.
