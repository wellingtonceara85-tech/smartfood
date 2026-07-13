# SmartFood — Modelagem do Banco de Dados

**Missão 0006**
**Status:** ✅ CONGELADA — versão oficial (aprovada em 2026-07-11, após Rodada 2 de ajustes)
**Referências obrigatórias:** [Smart Platform](../../../Smart%20Platform/INDEX.md) · [Missão 0002 — congelada](missao-0002-arquitetura-funcional.md) · [Missão 0004 — congelada](missao-0004-modelagem-dominio.md) · [Missão 0005 — congelada](missao-0005-arquitetura-solucao.md), em especial a Seção 18 (Preparação para esta missão) · [ADRs 0001-0018](../../engineering/adr/README.md)
**Histórico de decisões:** [missao-0006-review-notes.md](../../engineering/review-notes/missao-0006-review-notes.md)
**Escopo:** Tradução física das decisões já congeladas — mapeamento de Agregado (Missão 0004) para tabela, relacionamento, chave, isolamento multi-tenant a nível de dado, esquema de eventos e auditoria. **Ainda sem escolha de tecnologia** — nenhum SGBD, ORM ou fornecedor é nomeado aqui (isso é Missão 0007). O vocabulário usado (tabela, chave, esquema/schema) é relacional por ser a família de modelo mais adequada ao domínio fortemente transacional do SmartFood — essa é uma decisão de **paradigma**, não de produto específico.
**Mindset:** continua o padrão de Software Architect — cada tabela existe porque um Agregado ou Value Object da Missão 0004 a exige, nunca por conveniência de implementação.

---

## 1. Visão Geral da Modelagem

### Filosofia

O banco de dados não introduz nenhum conceito de negócio novo — é a **tradução física** de decisões já tomadas nas Missões 0004 e 0005. Três regras guiam toda a modelagem:

1. **Um Agregado (Missão 0004) é, no mínimo, uma tabela — nunca menos.** A fronteira de consistência transacional do domínio vira a fronteira de transação física.
2. **Um Value Object nunca vira tabela própria com chave estrangeira** — é sempre coluna composta/embutida na tabela do seu dono. Herdado diretamente da Missão 0004 e reforçado na Missão 0005 (Seção 18).
3. **Cada Bounded Context (Missão 0005) tende a possuir seu próprio agrupamento lógico de tabelas** (schema), mesmo que fisicamente colocado num único banco no MVP — nenhuma tabela de um contexto é referenciada por chave estrangeira direta de outro contexto (ver Seção 9).

### Nomenclatura

Tabelas em `snake_case`, no plural (`pedidos`, `itens_pedido`), consistente com a convenção já registrada na Smart Platform Architecture — esta missão não define a convenção, apenas a aplica.

---

## 2. Mapeamento Agregado → Tabelas

Cada um dos 11 Agregados da Missão 0004 (Seção 4) vira um grupo de tabelas. A tabela abaixo lista, por Agregado: a tabela raiz (nome da Aggregate Root), as tabelas filhas (entidades internas ao agregado) e os Value Objects embutidos (nunca tabela própria).

| Agregado (Missão 0004)    | Tabela raiz           | Tabelas filhas (dentro do mesmo agregado)             | Value Objects embutidos (colunas compostas)                                                                                                        |
| ------------------------- | --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pedido**                | `pedidos`             | `itens_pedido`, `historico_status_pedido`¹            | `endereco_entrega` (rua/número/bairro/cidade/CEP/complemento), `canal_venda` (tipo enum: site/qr_code/mesa/balcao/autoatendimento/marketplace/api) |
| **Cliente** ²             | `clientes`            | `enderecos_salvos`, `metodos_pagamento_salvos`        | `telefone`, `email`                                                                                                                                |
| **Empresa**               | `empresas`, `lojas` ³ | `configuracoes_loja`, `configuracoes_globais_empresa` | `horario_funcionamento`, `area_cobertura`, `cnpj_cpf`, `chave_pix`                                                                                 |
| **Produto** ³             | `produtos`            | `variacoes_produto`                                   | `dinheiro` (valor + moeda, em cada linha de preço)                                                                                                 |
| **Categoria**             | `categorias`          | —                                                     | —                                                                                                                                                  |
| **Pagamento**             | `pagamentos`          | `tentativas_cobranca`, `estornos`                     | `dinheiro`                                                                                                                                         |
| **Comanda**               | `comandas`            | `itens_comanda` (referências a Pedido/item)           | —                                                                                                                                                  |
| **Conta de Fidelidade**   | `contas_fidelidade`   | `movimentacoes_pontos`                                | —                                                                                                                                                  |
| **Assinatura de Produto** | `assinaturas_produto` | `itens_assinatura`                                    | `periodo` (frequência)                                                                                                                             |
| **Cupom**                 | `cupons`              | —                                                     | `desconto` (percentual ou valor fixo), `periodo` (validade)                                                                                        |
| **Item de Estoque**       | `itens_estoque`       | `movimentacoes_estoque`                               | —                                                                                                                                                  |

_¹ `historico_status_pedido` é a materialização persistente da evolução temporal do Pedido — cada linha é um Value Object (um "fato" de mudança de status, sem identidade própria além de pedido+timestamp), não uma Entidade de domínio independente. Não deve ser tratado como agregado próprio nem ganhar comportamento além de registrar a transição._

_² Ver subseção "Cliente é Global" logo abaixo — ajuste da Rodada 2._

_³ Ver subseção "Produto e a Unidade Operacional (Loja)" logo abaixo — ajuste da Rodada 2. `Favoritos` foi removido da lista de filhos de Cliente nesta rodada — ver explicação abaixo._

**Nota sobre `Usuário`/`Papel`:** não são um Agregado de negócio no sentido de Vendas/Catálogo — pertencem ao Bounded Context Identidade & Empresa (Missão 0005). Tabelas: `usuarios`, `papeis`, `usuario_papel` (associação). Diferente de Cliente, Usuário **é** escopado por Empresa (Missão 0004, Invariante 4) — `usuarios.empresa_id` é obrigatório e correto como está.

**Nota sobre `Notificação`:** pertence ao Bounded Context Comunicação. Tabela: `notificacoes` (registro de envio — quem, quando, canal, referência ao evento que originou).

**Nota sobre `Registro de Auditoria`:** módulo transversal (Missão 0004), sem dono de Bounded Context — ver Seção 8.

### Cliente é Global (Rodada 2 — ajuste obrigatório)

A Missão 0004 (Seção 11, Invariante 4) é explícita: **"Um Cliente pode comprar em várias Lojas (inclusive de Empresas diferentes) — a identidade do Cliente não é presa a uma única Empresa, diferente da identidade do Usuário."** Isso significa que `clientes`, `enderecos_salvos` e `metodos_pagamento_salvos` representam a **identidade** do Cliente — global, sem `empresa_id` — nunca escopados por Empresa.

O que **é** escopado por Empresa não é a identidade do Cliente, é a **relação de negócio** entre aquele Cliente e aquela Empresa:

- `pedidos` — já correto, tem `cliente_id` (global) **e** `empresa_id` (a compra pertence a uma Empresa).
- `contas_fidelidade` — já correto (Missão 0004, Invariante 8: par Cliente+Empresa).
- `favoritos` — passa a viver como tabela própria com `cliente_id` + `produto_id` (o produto favoritado já carrega sua Empresa/Loja por herança — ver abaixo) — deixou de ser listado como filho direto de `clientes` na tabela acima porque, diferente de Endereço/Pagamento salvo, Favoritos é inerentemente uma relação com algo de uma Empresa específica, não parte da identidade global do Cliente.

**Regra geral, generalizável:** toda tabela sob o Bounded Context Clientes que representa _quem o Cliente é_ (identidade, contato, forma de pagamento) é global; toda tabela que representa _o que o Cliente faz em relação a uma Empresa específica_ (comprar, favoritar, acumular ponto) é escopada por Empresa. Esta é a única exceção documentada à regra "toda tabela de negócio tem `empresa_id`" (Seção 5) — e é uma exceção por Invariante de domínio, não uma inconsistência.

### Produto e a Unidade Operacional (Loja) (Rodada 2 — ajuste obrigatório)

A Missão 0004 (Seção 11, Invariante 3) declara: **"Um Produto pertence a uma única Loja — catálogo não é compartilhado entre Lojas, mesmo dentro da mesma Empresa (Multiloja replica/varia produtos, não os compartilha por referência única)."** A Rodada 1 desta missão modelou `produtos` apenas com `empresa_id`, o que funciona hoje (1 Loja por Empresa no MVP) mas contradiz o Invariante e criaria migração estrutural quando Multiloja (Missão 0002, Fase 3 — já roadmapada) for implementada.

**Correção:** `produtos` (e `variacoes_produto`, por herança do mesmo agregado) carregam `loja_id`, não `empresa_id` diretamente. Introduz-se a tabela `lojas` (filha do Agregado Empresa — Loja é "Ponto de venda operacional de uma Empresa", Missão 0004, Seção 2), com `lojas.empresa_id` estabelecendo a cadeia Produto → Loja → Empresa. No MVP, cada Empresa tem exatamente uma Loja (criada automaticamente no Onboarding, Missão 0002) — o modelo já nasce correto para Multiloja sem exigir migração estrutural quando a segunda Loja de uma Empresa for criada, só passa a ter mais de uma linha em `lojas` por `empresa_id`.

**Categoria permanece em `empresa_id`** (não `loja_id`) — decisão consciente e conservadora: a Missão 0002 descreve Multiloja como "catálogo mestre com variação por unidade", sugerindo que a taxonomia de categorias tende a ser compartilhada entre Lojas da mesma Empresa, enquanto os Produtos específicos (e sua disponibilidade) variam por Loja. Se essa leitura se mostrar errada quando Multiloja for de fato implementada, é um ajuste isolado a `categorias`, não uma revisão desta missão inteira.

**Extensão natural (registrada, não implementada agora):** Mesa, Comanda e Item de Estoque são, pela mesma lógica de "unidade operacional física", também candidatos naturais a `loja_id` em vez de `empresa_id` quando Multiloja chegar — sinalizado aqui para que a Missão 0007/implementação não repita a mesma descoberta tardia que gerou este ajuste.

---

## 3. Relacionamentos e Chaves

**Regra única (Rodada 2 — substitui as três formulações divergentes da Rodada 1):** entre Bounded Contexts, **nunca existe Foreign Key física** — nem com `CASCADE`, nem sem. Existe apenas: (1) armazenamento do ID como coluna comum (sem constraint de integridade referencial no banco), (2) validação da existência/estado do registro referenciado pela camada de aplicação quando necessário, e (3) consistência entre os dois lados garantida por Evento de Domínio (Missão 0005, ADR-0006), nunca pelo SGBD. Isso vale **mesmo quando os schemas estiverem fisicamente no mesmo banco** — a independência arquitetural definida na Missão 0005 (cada Bounded Context poder migrar para armazenamento próprio sem redesenho) só é real se o banco nunca criar um acoplamento físico que a aplicação depois precise desfazer.

| Relação                                       | Cruza Bounded Context?                                                              | Regra                                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pedidos.cliente_id` → `clientes.id`          | Sim (Vendas & Operação → Clientes)                                                  | ID armazenado, sem FK física. Nunca `JOIN` obrigatório em leitura operacional — o nome/telefone do cliente no momento da compra já está embutido no próprio Pedido se necessário para exibição rápida     |
| `pedidos.cupom_id` → `cupons.id`              | Sim (Vendas & Operação → Marketing)                                                 | ID armazenado, sem FK física. O valor do desconto aplicado já está congelado no Pedido (Missão 0004, snapshot)                                                                                            |
| `pedidos.loja_id` → `lojas.id`                | Não (mesmo Bounded Context, Identidade & Empresa é Tier 0 consumido por referência) | ID armazenado, sem FK física — mesma regra, já que atravessa fronteira de Bounded Context                                                                                                                 |
| `pagamentos.pedido_id` → `pedidos.id`         | Sim (Pagamentos → Vendas & Operação)                                                | ID armazenado, sem FK física — a relação é resolvida por evento (`PEDIDO_CANCELADO` → aciona lógica de Estorno), nunca por integridade referencial do banco                                               |
| `itens_pedido.produto_id` / `variacao_id`     | Sim (Vendas & Operação → Catálogo)                                                  | ID armazenado apenas como referência histórica — o Item do Pedido **não depende** dela para exibição, todo dado necessário (nome, preço, imagem) já está congelado como coluna própria (reforça ADR-0003) |
| `produtos.loja_id` → `lojas.id`               | Sim (Catálogo → Identidade & Empresa)                                               | ID armazenado, sem FK física                                                                                                                                                                              |
| `enderecos_salvos.cliente_id` → `clientes.id` | Não — mesmo Agregado (Cliente contém Endereços Salvos)                              | Chave estrangeira física normal, **com** integridade referencial garantida pelo banco — estão na mesma fronteira de consistência forte                                                                    |
| `favoritos.cliente_id` → `clientes.id`        | Não (mesmo BC Clientes)                                                             | FK física normal                                                                                                                                                                                          |
| `favoritos.produto_id` → `produtos.id`        | Sim (Clientes → Catálogo)                                                           | ID armazenado, sem FK física                                                                                                                                                                              |

**Regra geral:** dentro de um mesmo Agregado, chave estrangeira física com integridade referencial garantida pelo banco é esperada — é a mesma fronteira de consistência forte da Missão 0004. **Entre Agregados de Bounded Contexts diferentes, jamais existe FK física, em nenhuma circunstância** — mesmo quando o Bounded Context de destino é Tier 0 (Identidade & Empresa, Catálogo). A consistência entre eles é sempre eventual (Missão 0005, ADR-0006).

### Chaves Naturais vs. Artificiais (Rodada 2 — ajuste recomendado)

Toda tabela usa **chave primária artificial (surrogate)** — um identificador gerado pelo sistema, sem significado de negócio. Identificadores que parecem "naturais" (CNPJ/CPF em `empresas`, e-mail/telefone em `clientes`) são sempre modelados como **restrição de unicidade** (`UNIQUE`), nunca como chave primária. Motivo: um identificador natural pode, em casos raros mas reais, precisar mudar (correção de CNPJ, troca de e-mail associado à conta) — se ele fosse a chave primária, essa mudança se propagaria como alteração de chave estrangeira em toda tabela que o referencia; como restrição de unicidade sobre uma chave artificial estável, a mudança é uma atualização local de uma única linha.

---

## 4. Value Objects como Estruturas Embutidas

Reforça o princípio já estabelecido (Missão 0004/0005): nenhum Value Object dos 12 identificados na Missão 0004 vira tabela própria. Cada um é modelado como um grupo de colunas na tabela do seu dono, ou como uma estrutura composta (registro embutido) quando o SGBD escolhido na Missão 0007 suportar isso nativamente — decisão de representação física exata (colunas separadas vs. estrutura composta) é adiada para a Missão 0007, mas a regra "nunca tabela própria com FK" já está fixada agora.

| Value Object             | Onde vive                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Endereço de Entrega      | Colunas embutidas em `pedidos`                                                                          |
| Dinheiro                 | Colunas `valor` + `moeda` em qualquer tabela que registra quantia (`pedidos`, `pagamentos`, `produtos`) |
| Telefone / E-mail        | Colunas em `clientes`                                                                                   |
| CPF/CNPJ                 | Coluna em `empresas`                                                                                    |
| Chave PIX                | Coluna em `empresas` (configuração de recebimento)                                                      |
| Horário de Funcionamento | Colunas embutidas em `configuracoes_loja`                                                               |
| Coordenadas              | Colunas `latitude`/`longitude` onde aplicável (endereço)                                                |
| Período                  | Colunas `data_inicio`/`data_fim` em `cupons`, `assinaturas_produto`                                     |
| Área de Cobertura        | Colunas embutidas em `configuracoes_loja`                                                               |
| Variação Selecionada     | Colunas embutidas em `itens_pedido` (nome, preço, atributos no momento da compra)                       |
| Desconto                 | Colunas embutidas em `cupons`                                                                           |
| Canal de Venda           | Coluna enum em `pedidos`                                                                                |

---

## 5. Estratégia Multi-tenant a Nível de Dado

Expande [ADR-0002](../../engineering/adr/ADR-0002-multi-tenant-por-empresa.md) e a Missão 0005 (Seção 11) para o nível físico. **Revisado na Rodada 2** para refletir três níveis de escopo, não um só.

**Decisão:** isolamento por **coluna discriminadora**, presente desde a primeira definição de cada tabela — nunca adicionada depois — mas o discriminador correto depende do que a tabela representa:

| Nível de escopo                                       | Coluna       | Aplica-se a                                                                                                                                                                                                             |
| ----------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresa (Tenant)**                                  | `empresa_id` | Usuários/Papéis, Pedidos, Pagamentos, Cupons, Financeiro, Contas de Fidelidade, Favoritos, Configuração da Loja/Global, Auditoria — a maioria das tabelas de negócio                                                    |
| **Loja (unidade operacional, dentro de uma Empresa)** | `loja_id`    | Produtos, Variações — ver Seção 2, "Produto e a Unidade Operacional"                                                                                                                                                    |
| **Global (nenhum discriminador de tenant)**           | —            | `clientes`, `enderecos_salvos`, `metodos_pagamento_salvos` — identidade do Cliente (Seção 2, "Cliente é Global") — **única exceção documentada**, justificada por Invariante de domínio (Missão 0004), não por descuido |

Considerado (e não escolhido por ora) o modelo de schema-por-tenant (uma estrutura de banco isolada por Empresa): rejeitado para o MVP porque o número de Empresas cresce rápido e schema-por-tenant tem custo operacional de gestão (migração, backup, monitoramento) que multiplica por Empresa — inadequado para um SaaS de auto-cadastro. Coluna discriminadora é revisitável no futuro **por Bounded Context individualmente** (ex: se Financeiro precisar de isolamento físico mais forte por exigência regulatória futura), não como decisão de tudo-ou-nada.

**Regra inegociável:** nenhuma consulta em nenhuma tabela escopada (por Empresa ou por Loja) é válida sem o filtro correspondente — essa é uma responsabilidade que deve existir na camada de acesso a dado (Missão 0007), nunca confiada à disciplina manual de quem escreve uma consulta específica. Para as tabelas globais de Cliente, a proteção equivalente é: nenhuma consulta expõe Cliente de uma Empresa para o painel de gestão de outra Empresa — o filtro, nesse caso, acontece pela tabela de relação (`pedidos`, `contas_fidelidade`, `favoritos`), nunca pela tabela de identidade em si.

**Exceção adicional:** Serviços Compartilhados/tabelas de plataforma puramente técnicas (ex: `feature_flags` de escopo global da plataforma) não são escopadas por Empresa — são compartilhadas por definição (Missão 0005, Seção 7). Isso **não** se aplica a `eventos_publicados`, que passa a carregar `empresa_id` — ver Seção 7.

---

## 6. Índices Conceituais

Sem especificar tipo de índice (decisão de implementação, Missão 0007) — apenas onde a necessidade de busca rápida já é evidente pelas jornadas das Missões 0002/0003:

| Necessidade de busca                                                                        | Onde                                                       |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Pedidos de uma Empresa por status (Painel de Pedidos, tempo real)                           | `pedidos (empresa_id, status)`                             |
| Pedidos de um Cliente (histórico/recompra — busca global, cruza Empresas)                   | `pedidos (cliente_id)`                                     |
| Produto por Loja e disponibilidade (Vitrine) — _ajustado na Rodada 2, era `empresa_id`_     | `produtos (loja_id, disponivel)`                           |
| Cliente por telefone/e-mail (login, identificação global no checkout) — _novo na Rodada 2_  | `clientes (telefone)`, `clientes (email)` — únicos, global |
| Pagamento por Pedido                                                                        | `pagamentos (pedido_id)`                                   |
| Notificação por destinatário (Central de Notificações)                                      | `notificacoes (cliente_id ou usuario_id, lida)`            |
| Registro de Auditoria por Empresa e período                                                 | `registros_auditoria (empresa_id, criado_em)`              |
| Evento publicado por Empresa e tipo (troubleshooting, reprocessamento) — _novo na Rodada 2_ | `eventos_publicados (empresa_id, tipo, criado_em)`         |

---

## 7. Esquema de Eventos Publicados

A Missão 0005 (Seção 18) já sinalizou a necessidade de um mecanismo de registro de evento publicado, **distinto** do Registro de Auditoria (Missão 0004) — aqui essa decisão vira estrutura explícita.

**Tabela conceitual `eventos_publicados`** (ou equivalente): registra cada Evento de Domínio efetivamente emitido, com campos conceituais — identificador único do evento, tipo (`PEDIDO_CRIADO`, etc.), versão de schema (ADR relacionado ao versionamento, Missão 0005 Seção 6), Agregado/Bounded Context de origem, **`empresa_id`** _(adicionado na Rodada 2 — obrigatório, não opcional)_, Correlation ID, payload do evento, status de entrega (pendente/entregue/morto), timestamp.

**Por que `empresa_id` é campo de primeira classe, não só parte do payload (Rodada 2):** auditoria, reprocessamento seletivo, troubleshooting, filtro operacional e, acima de tudo, isolamento multi-tenant durante reprocessamento/dead-letter (Missão 0005, Seção 6) exigem poder consultar "quais eventos aconteceram para esta Empresa" diretamente — depender de abrir o `payload` para descobrir a Empresa quebraria a mesma regra de acesso escopado que vale para todo o resto do sistema (Seção 5).

Esta tabela é, na prática, a materialização física da **Garantia de Publicação** (ADR-0013): o registro nasce na mesma transação que a mudança de estado do Agregado, e um processo separado (Missão 0007, não tecnologia definida aqui) garante a entrega efetiva ao Barramento de Eventos a partir dela — nunca o inverso.

**Distinção física de Auditoria (Seção 8):** `eventos_publicados` existe para fins de integração/reação entre contextos; `registros_auditoria` existe para fins de responsabilização humana. Um `PAGAMENTO_CONFIRMADO` (vindo do gateway, sem ator humano) gera linha em `eventos_publicados` mas não necessariamente em `registros_auditoria`; uma alteração manual de preço gera as duas.

**Diretriz de retenção (Rodada 2 — ajuste recomendado, não definitivo):** Auditoria (`registros_auditoria`) tende a exigir retenção longa (responsabilização, possível exigência legal/fiscal futura); Eventos Publicados (`eventos_publicados`) tende a exigir retenção apenas operacional (curta a média, suficiente para reprocessamento e troubleshooting). A política definitiva — prazos exatos, arquivamento vs. exclusão — continua sendo decisão da Missão 0007, esta é só a diretriz de que os dois propósitos não devem compartilhar a mesma política por padrão.

---

## 8. Esquema de Auditoria

**Tabela conceitual `registros_auditoria`**, transversal (Missão 0004), não pertencente a nenhum Bounded Context: quem (usuário), quando, o quê (ação), sobre qual entidade/agregado, valor anterior/novo quando aplicável, `empresa_id`. Append-only por regra (Missão 0004, Regra de Negócio Global 7) — nenhuma rotina do sistema deve ter permissão de `UPDATE`/`DELETE` sobre essa tabela, só `INSERT`.

---

## 9. Fronteiras de Schema por Bounded Context

Cada Bounded Context da Missão 0005 corresponde a um agrupamento lógico de tabelas (schema), mesmo colocado fisicamente no mesmo banco no MVP:

```
schema vendas_operacao     → pedidos, itens_pedido, historico_status_pedido, comandas, assinaturas_produto
schema catalogo             → produtos (loja_id), variacoes_produto, categorias (empresa_id)
schema clientes             → clientes, enderecos_salvos, metodos_pagamento_salvos   [globais, sem empresa_id]
                             → favoritos, contas_fidelidade                          [escopados por empresa_id]
schema pagamentos           → pagamentos, tentativas_cobranca, estornos
schema financeiro           → faturas, fechamentos_caixa
schema comunicacao          → notificacoes
schema identidade_empresa   → empresas, lojas, configuracoes_loja, configuracoes_globais_empresa, usuarios, papeis
schema marketing            → cupons
schema estoque              → itens_estoque, movimentacoes_estoque
schema plataforma           → eventos_publicados (empresa_id), registros_auditoria (empresa_id), arquivos (metadado), feature_flags (global)
```

_Nota (Rodada 2): `clientes`/`enderecos_salvos`/`metodos_pagamento_salvos` permanecem no schema do Bounded Context Clientes — a mudança da Rodada 2 é sobre qual coluna de escopo cada tabela carrega (Seção 5), não sobre qual contexto é dono da decisão (Missão 0005, Ownership) sobre elas._

**Regra:** nenhuma consulta (`JOIN`) cruza schema de Bounded Contexts diferentes na camada de aplicação de negócio — se uma tela precisa de dado de mais de um contexto (ex: Painel de Gestão mostrando nome do Cliente ao lado do Pedido), a composição acontece na camada de aplicação, consumindo o contrato/consulta de cada contexto separadamente, nunca via `JOIN` direto de banco atravessando a fronteira. Isso preserva fisicamente, no banco, o mesmo princípio que a Missão 0005 já estabeleceu logicamente (Seção 1: "nenhum contexto acessa o agregado interno de outro").

---

## 10. Estratégia de Evolução de Schema

- Toda mudança de schema é uma migração versionada e reversível — nunca alteração manual direta em produção (herdado da Smart Platform Architecture).
- Migração de um Bounded Context nunca depende de migração simultânea de outro — reforça o isolamento de schema da Seção 9.
- Campo novo em tabela existente: sempre opcional/com valor padrão na primeira versão, nunca obrigatório de imediato — evita quebrar escrita em produção durante o deploy da migração.
- Remoção de campo/tabela: sempre em duas etapas (parar de escrever, depois remover), nunca em uma única migração — dá margem para reverter se algo for descoberto tarde demais.

---

## 11. Dados Persistidos, Cache e Temporários — Aplicação Física

Reconfirma a classificação da Missão 0004 (Seção 10) no nível físico:

- **Persistidos (tabela própria, sempre)**: todas as tabelas das Seções 2, 7 e 8 deste documento.
- **Cache (nunca fonte de verdade — reconstruível)**: Dashboard de Indicadores, Relatórios agregados, Painel de Comparação Anônima — não ganham tabela transacional própria nesta missão; são projeções calculadas a partir das tabelas de negócio, cuja estratégia de armazenamento (view materializada, tabela de leitura derivada, ou recomputada em tempo real) é decisão da Missão 0007.
- **Temporários (não sobrevivem a reinício de sessão)**: Carrinho antes da confirmação do Pedido, sessão de login — não ganham tabela no banco principal; vivem em mecanismo de sessão (decisão de implementação, Missão 0007).

---

## 12. Riscos de Modelagem

| Risco                                                                                                                                                | Descrição                                                                                                                                                                                                                                 | Mitigação                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Duplicação de dado por design (snapshot)**                                                                                                         | Nome/preço/imagem de Produto duplicados em cada `item_pedido` (ADR-0003) — crescimento de armazenamento proporcional ao volume de vendas.                                                                                                 | Aceito conscientemente (Missão 0004) — é o preço da integridade histórica, não um erro de normalização.                                                                                                                                            |
| **Discriminador de escopo errado ou esquecido em uma consulta** (`empresa_id`, `loja_id`, ou a ausência correta em tabelas de identidade de Cliente) | Maior risco de vazamento de dado entre tenants (Seção 5) se a disciplina for só manual — agora com três níveis de escopo (Empresa/Loja/Global) em vez de um só, o risco de confundir qual regra vale para qual tabela é maior, não menor. | Regra inegociável de que a camada de acesso a dado impõe o filtro correto por tabela — decisão de implementação a levar para a Missão 0007 com prioridade máxima; a tabela da Seção 5 deve virar checklist literal de revisão de cada tabela nova. |
| **Tabela `eventos_publicados` crescendo sem limite**                                                                                                 | Mesmo com diretriz de retenção (Seção 7), a política exata ainda não existe.                                                                                                                                                              | Política de retenção/arquivamento definitiva a definir na Missão 0007 — diretriz (retenção operacional, mais curta que Auditoria) já registrada.                                                                                                   |
| **Tentação de `JOIN` entre schemas de contextos diferentes por conveniência de performance**                                                         | Uma consulta de relatório "rápida de fazer" pode violar a fronteira de schema (Seção 9) sob pressão de prazo.                                                                                                                             | Regra explícita e documentada (Seção 9); revisão de código deve tratar isso como erro de arquitetura, não estilo.                                                                                                                                  |
| **Categoria modelada por `empresa_id`, não `loja_id`, ser a leitura errada de "catálogo mestre"** _(novo, Rodada 2)_                                 | Se a implementação real de Multiloja exigir categorias diferentes por Loja (não só produtos), a decisão da Seção 2 precisa ser revisitada.                                                                                                | Decisão isolada e conscientemente marcada como conservadora (Seção 2) — não bloqueia esta missão, mas deve ser a primeira pergunta a validar quando Multiloja entrar em implementação real.                                                        |

---

## 13. ADRs

Escritos por completo em [docs/engineering/adr/](../../engineering/adr/README.md) na consolidação desta missão:

- **ADR-0014** — Isolamento multi-tenant por coluna discriminadora, não schema-por-tenant, no MVP.
- **ADR-0015** — Registro de Evento Publicado como tabela própria, distinta de Auditoria, com `empresa_id` obrigatório.
- **ADR-0016** — Nenhuma Foreign Key física nem `JOIN` de banco cruza fronteira de Bounded Context — sempre ID armazenado + validação de aplicação + consistência por evento.
- **ADR-0017** _(Rodada 2)_ — Cliente é entidade global, não escopada por Empresa; a relação de negócio (Pedido, Fidelidade, Favoritos) é que é escopada.
- **ADR-0018** _(Rodada 2)_ — Produto (e conceitos operacionais análogos) escopado por Loja, não diretamente por Empresa — preparação para Multiloja sem migração estrutural futura.

---

## 14. Preparação para a Missão 0007

- **Fronteiras de schema (Seção 9) e o vocabulário relacional já adotado** (tabela, chave, schema) são o ponto de partida direto para a escolha de SGBD e ORM — a Missão 0007 escolhe a tecnologia que melhor serve a este modelo, não o contrário.
- **A decisão de coluna discriminadora para multi-tenant (Seção 5)** precisa virar mecanismo de imposição automática (nunca manual) na camada de acesso a dado — escolha de como fazer isso é técnica, mas a exigência já está definida.
- **A tabela de Eventos Publicados (Seção 7)** precisa de um mecanismo real de entrega ao Barramento de Eventos (Missão 0005, Seção 6) — a escolha de tecnologia de fila/mensageria acontece na Missão 0007, mas a estrutura de dado que a alimenta já está pronta aqui.
- **Índices conceituais (Seção 6)** e riscos de crescimento (Seção 12) devem informar diretamente as primeiras decisões de capacidade da Missão 0007.
- **A tabela de escopo de três níveis (Seção 5)** — Empresa/Loja/Global — precisa virar mecanismo explícito na camada de acesso a dado, não apenas convenção documental: a Missão 0007 deve escolher como impor cada nível de forma automática e diferenciada, não um único filtro genérico.

---

_Fim do documento — Missão 0006, ✅ CONGELADA. Ver [missao-0006-review-notes.md](../../engineering/review-notes/missao-0006-review-notes.md) para o histórico completo da revisão (2 rodadas). Os 5 ADRs da Seção 13 estão escritos por completo em [docs/engineering/adr/](../../engineering/adr/README.md)._
