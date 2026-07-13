# Missão 0011 — Catálogo

**Status:** ✅ CONGELADA — versão oficial
**Data:** 2026-07-12
**Tipo:** Execução (terceiro Bounded Context de negócio)

Draft enxuto, mesmo formato das Missões 0009/0010. Nenhuma decisão arquitetural nova — recorta, dentro do que já está congelado, o primeiro incremento executável do Catálogo. Estrutura de módulo vem da [Missão 0007.5 — Blueprint Técnico](missao-0007-5-blueprint-tecnico.md); modelagem vem da [Missão 0004](missao-0004-modelagem-dominio.md) e da [Missão 0006](missao-0006-modelagem-banco-dados.md); autenticação/RBAC reaproveita o mecanismo da Missão 0010 (`platform/auth/`), sem nada novo.

## 1. Objetivo

Implementar o Bounded Context **Catálogo**: o lojista (Usuário autenticado) cadastra Categorias e Produtos (com pelo menos uma Variação, que carrega o preço) dentro da sua Loja, e consegue listar/consultar o que cadastrou. Sem vitrine pública, sem Pedido — isso é Missão 0012+.

## 2. Escopo

### Dentro desta missão

- Agregado **Categoria** — escopada por **Empresa** (`empresaId`, [ADR-0018](../engineering/adr/ADR-0018-produto-escopado-por-loja.md): taxonomia compartilhada entre Lojas da mesma Empresa).
- Agregado **Produto** — escopado por **Loja** (`lojaId`, não `empresaId` — ADR-0018), contém uma ou mais **Variações** (nome, preço, disponibilidade). Referencia uma Categoria (mesmo Bounded Context, FK física permitida).
- **Invariante 1:** todo Produto nasce com pelo menos uma Variação — sem isso não há preço, e Produto sem preço não pode existir (mesmo padrão estrutural de Empresa sempre nascer com uma Loja, Missão 0009). O comando de `CriarProduto` inclui a primeira Variação — não existe "criar Produto vazio e adicionar Variação depois" nesta missão.
- **Invariante 2** _(adicionada na revisão)_: um Produto não pode estar `disponivel = true` se todas as suas Variações estiverem `disponivel = false`. Reforçada em dois pontos: (a) ao alternar a disponibilidade de uma Variação, se isso zerar as Variações disponíveis do Produto, o Produto é automaticamente marcado indisponível junto; (b) ao tentar ligar manualmente a disponibilidade do Produto, rejeita se nenhuma Variação estiver disponível. A via inversa (ligar uma Variação) **não** reativa o Produto automaticamente — evita ambiguidade entre "foi desligado manualmente" e "foi desligado pela regra".
- Casos de uso: **CriarCategoria**, **ListarCategorias**, **CriarProduto** (com suas Variações), **BuscarProdutoPorId**, **ListarProdutos** (por Loja), **AlternarDisponibilidadeProduto**, **AlternarDisponibilidadeVariacao**.
- Autenticação + RBAC reaproveitando `platform/auth/` (Missão 0010) — Administrador e Gerente podem criar/alterar; qualquer Usuário autenticado da Empresa pode listar/consultar. Matriz pensada para expansão futura sem quebra: hoje Supervisor/Operador/Financeiro só leem (mesma regra que "qualquer Usuário autenticado"); quando Estoque/Pedidos existirem, é natural o Supervisor ganhar permissão de escrita aqui sem exigir mudança estrutural — não implementado agora, só a matriz já nasce compatível com essa evolução.
- Evento de domínio **PRODUTO_ATUALIZADO** publicado no Outbox (Missão 0004, Seção 6) na criação e na troca de disponibilidade — sem assinante ainda (mesmo padrão de `EMPRESA_CRIADA`, Missão 0009).
- Schema Prisma `catalogo` (Missão 0006, Seção 9): `produtos` (`loja_id`), `variacoes_produto`, `categorias` (`empresa_id`) — sem FK física para `identidade_empresa` (cruza Bounded Context, ADR-0016/0022).

### Fora desta missão (explicitamente adiado)

- **Vitrine pública / Cardápio** (busca, filtro, destaque de promoção) — EPIC-001 lista junto de Catálogo, mas só faz sentido com Pedido/Checkout por perto; decisão de quando entra fica para depois desta missão, não decidida aqui.
- **Edição completa** de Produto/Variação/Categoria (nome, preço, descrição) e **exclusão** (Lixeira) — esta missão só cria, lista e alterna disponibilidade.
- **Upload de imagem de Produto** — depende de Gerenciamento de Arquivos, não construído ainda. Nesta missão só existe a coluna `imagemUrl` (nullable, sem mecanismo de upload) — para não exigir migration quando o upload real chegar.
- **Combo**, **Receita/Ficha Técnica**, **Precificação Assistida** — Fase 2/3 (Missão 0002).
- **Controle de Estoque** (baixa automática) — Produto sem estoque não pode ser vendido é regra futura; nesta missão existe só a coluna `controlaEstoque` (Boolean, default `false`), sem nenhuma movimentação — evita migration quando a Missão de Estoque chegar, mas não implementa nada de estoque agora.
- **Multiloja** (segunda Loja por Empresa) — modelo já nasce pronto (Produto por `lojaId`, ADR-0018), mas nada aqui cria ou gerencia uma segunda Loja.

## 3. Critérios de simplicidade

Esta missão valida: Agregado Produto com Variações (e as duas invariantes — nascer com preço, nunca ficar disponível sem nenhuma Variação disponível), Agregado Categoria, persistência Prisma em schema próprio sem FK cruzando Bounded Context, reaproveitamento do Guard/RBAC já construído (não recriar autenticação). Qualquer regra adicional — edição, exclusão, imagem, combo, estoque, vitrine — é adiada, sem exceção, mesmo que pareça pequena durante a implementação.

## 4. Modelagem (herdada, não decidida aqui)

| Campo (Categoria) | Tipo     | Observação                            |
| ----------------- | -------- | ------------------------------------- |
| `id`              | UUID     | PK                                    |
| `empresaId`       | String   | sem FK física (cruza Bounded Context) |
| `nome`            | string   | obrigatório                           |
| `ordem`           | int      | posição de exibição, default 0        |
| `criadaEm`        | datetime | `now()`                               |

| Campo (Produto)   | Tipo             | Observação                                                                                |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `id`              | UUID             | PK                                                                                        |
| `lojaId`          | String           | sem FK física (cruza Bounded Context) — não `empresaId` (ADR-0018)                        |
| `categoriaId`     | UUID             | FK física (mesmo Bounded Context)                                                         |
| `nome`            | string           | obrigatório                                                                               |
| `descricao`       | string, opcional |                                                                                           |
| `imagemUrl`       | string, opcional | nullable — sem upload nesta missão (Seção 2)                                              |
| `controlaEstoque` | boolean          | default `false` — sem movimentação nesta missão (Seção 2)                                 |
| `disponivel`      | boolean          | default `true`; não pode ser `true` se nenhuma Variação estiver disponível (Invariante 2) |
| `criadoEm`        | datetime         | `now()`                                                                                   |

| Campo (Variação) | Tipo    | Observação                                   |
| ---------------- | ------- | -------------------------------------------- |
| `id`             | UUID    | PK                                           |
| `produtoId`      | UUID    | FK física (mesmo Agregado)                   |
| `nome`           | string  | ex.: "Único", "Grande", "Com bacon"          |
| `precoValor`     | decimal | Value Object Dinheiro (Missão 0006, Seção 6) |
| `precoMoeda`     | string  | default `"BRL"`                              |
| `disponivel`     | boolean | default `true`                               |

## 5. Contrato de API (proposto)

| Método  | Rota                                                  | Caso de uso                                                       | Auth                         |
| ------- | ----------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `POST`  | `/categorias`                                         | Criar Categoria                                                   | Administrador ou Gerente     |
| `GET`   | `/categorias`                                         | Listar Categorias da Empresa                                      | Qualquer Usuário autenticado |
| `POST`  | `/produtos`                                           | Criar Produto (+ Variações)                                       | Administrador ou Gerente     |
| `GET`   | `/produtos/:id`                                       | Buscar Produto por Id                                             | Qualquer Usuário autenticado |
| `GET`   | `/produtos`                                           | Listar Produtos da Loja                                           | Qualquer Usuário autenticado |
| `PATCH` | `/produtos/:id/disponibilidade`                       | Alternar disponibilidade do Produto                               | Administrador ou Gerente     |
| `PATCH` | `/produtos/:id/variacoes/:variacaoId/disponibilidade` | Alternar disponibilidade de uma Variação (cascateia Invariante 2) | Administrador ou Gerente     |

Todas as rotas passam por `verificarMesmaEmpresa` (Missão 0010) — nunca expõem Categoria/Produto de outra Empresa.

## 6. Estrutura de módulo

`modules/catalogo/` seguindo a mesma anatomia de `identidade-empresa/` e `usuarios/` (domain/application/infrastructure/api/test). Dois Agregados (Categoria, Produto) no mesmo módulo — justificado por pertencerem ao mesmo Bounded Context e schema físico (Missão 0006, Seção 9), como Empresa/Loja na Missão 0009.

## 7. Definition of Done

- [ ] `POST /categorias` cria Categoria, retorna 201.
- [ ] `GET /categorias` lista só as Categorias da Empresa do chamador.
- [ ] `POST /produtos` cria Produto + Variações em transação única, retorna 201; rejeita Produto sem nenhuma Variação.
- [ ] `GET /produtos/:id` retorna 200 com Variações incluídas, 404 se não existir, 403 se de outra Empresa.
- [ ] `GET /produtos` lista só os Produtos da Loja informada.
- [ ] `PATCH /produtos/:id/disponibilidade` alterna o campo, retorna 200; rejeita ligar se nenhuma Variação estiver disponível (Invariante 2).
- [ ] `PATCH /produtos/:id/variacoes/:variacaoId/disponibilidade` alterna a Variação; se zerar as Variações disponíveis, o Produto é marcado indisponível junto (Invariante 2).
- [ ] Todas as rotas de escrita exigem Administrador ou Gerente (`PapelPermissaoGuard`); leitura exige só autenticação.
- [ ] Evento `PRODUTO_ATUALIZADO` publicado no Outbox na criação e na troca de disponibilidade.
- [ ] Migration Prisma para `catalogo.produtos`, `catalogo.variacoes_produto`, `catalogo.categorias`.
- [ ] Teste unitário de domínio (Invariante 1: Produto sempre nasce com ao menos uma Variação).
- [ ] Teste unitário de domínio (Invariante 2: Produto não fica disponível sem nenhuma Variação disponível).
- [ ] Teste de integração dos Casos de Uso principais (Criar Produto, Alternar Disponibilidade de Produto e de Variação) com repositório real.
- [ ] Teste de contrato: módulo `catalogo` não importa de outro Bounded Context.
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `docker compose up` verdes.
- [ ] `POST /produtos` responde em menos de 500ms local (mesmo critério informal das Missões 0009/0010).
- [ ] Nenhuma linha de Cliente, Pedido, Pagamento, Estoque ou Fidelidade neste incremento.

## 8. Próximo passo

Aprovado sem necessidade de nova rodada de revisão — implementação segue em incrementos pequenos e validados, mesmo modelo das Missões 0009/0010.
