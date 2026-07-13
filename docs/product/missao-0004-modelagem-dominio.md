# SmartFood — Modelagem do Domínio (Domain Model)

**Missão 0004**
**Status:** ✅ CONGELADA — versão oficial (Rodada 2 incorporada, confirmada em 2026-07-11)
**Referências obrigatórias:** [Smart Platform](../../../Smart%20Platform/INDEX.md) · [Missão 0001](missao-0001-visao-estrategica.md) · [Missão 0002 — congelada](missao-0002-arquitetura-funcional.md) · [Missão 0002 Review Notes](../../engineering/review-notes/missao-0002-review-notes.md) · [Missão 0003 — congelada](missao-0003-ux-jornadas.md) · [Missão 0003 Review Notes](../../engineering/review-notes/missao-0003-review-notes.md)
**Histórico de decisões:** [missao-0004-review-notes.md](../../engineering/review-notes/missao-0004-review-notes.md)
**Escopo:** Modelo conceitual de domínio (DDD) — entidades, objetos de valor, agregados, eventos, regras, ciclo de vida. **Nenhum banco de dados, SQL, ORM ou código é definido aqui.**

---

## 1. Domínios — Core, Supporting e Generic

Classificação segundo Domain-Driven Design: onde investir profundidade de modelagem e cuidado de design (Core), onde a solução precisa ser boa mas não é o diferencial (Supporting), e onde a solução ideal é a mais simples/padrão possível, sem inventar nada (Generic).

| Domínio (Missão 0002)                                                        | Classificação                                                                                                 | Justificativa                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comercial** (Catálogo, Motor de Pedidos, Checkout)                         | **Core**                                                                                                      | É a razão de existir do produto — o Motor de Pedidos unificado é o diferencial estrutural identificado desde a Missão 0002 (Seção 7). Investimento de design deve ser máximo aqui.                                                                                                                                                                                                                                                                             |
| **Operacional** (Painel de Pedidos, fila de preparo, comandas)               | **Core**                                                                                                      | É onde a promessa "substitui o caos de WhatsApp/papel" (Missão 0001) se prova ou falha na prática, minuto a minuto.                                                                                                                                                                                                                                                                                                                                            |
| **Experiência do Cliente** (login, perfil, endereços, fidelidade, histórico) | **Core**                                                                                                      | É o que devolve ao comerciante a posse do dado do cliente — proposta de valor central contra marketplaces (Missão 0001, Proposta de Valor).                                                                                                                                                                                                                                                                                                                    |
| **Pagamentos**                                                               | **Supporting**                                                                                                | Essencial e usado o tempo todo, mas o SmartFood não compete em inovar como processar Pix/cartão — compete em como o pagamento se integra ao resto. A lógica de negócio (status, tentativa, split) é própria; o processamento em si tende a apoiar-se em provedor externo.                                                                                                                                                                                      |
| **Financeiro**                                                               | **Supporting**                                                                                                | Necessário e específico do domínio de food service (fechamento de caixa por turno é diferente de um SaaS genérico), mas não é o que faz um comerciante escolher o SmartFood.                                                                                                                                                                                                                                                                                   |
| **Central de Comunicação**                                                   | **Supporting**                                                                                                | Orquestração (quando/quem/por qual canal) é específica do negócio; o envio em si (WhatsApp/e-mail/SMS) é capacidade genérica por trás.                                                                                                                                                                                                                                                                                                                         |
| **Configuração da Loja**                                                     | **Supporting**                                                                                                | Modelagem própria (identidade, horário, entrega) é necessária, mas não é onde a inovação do produto acontece.                                                                                                                                                                                                                                                                                                                                                  |
| **Marketing**                                                                | **Supporting**                                                                                                | Cupons/promoções são esperados de qualquer plataforma de venda — importante, não diferenciador.                                                                                                                                                                                                                                                                                                                                                                |
| **Relatórios**                                                               | **Supporting**                                                                                                | Fundamental para a proposta de valor ("decisão simples", Missão 0001), mas a lógica de agregação de dado é bem entendida no mercado — não é onde reinventamos algo.                                                                                                                                                                                                                                                                                            |
| **Administração** (usuários, papéis)                                         | **Generic**                                                                                                   | Gestão de usuário e permissão é um problema resolvido — já herda o modelo do [Smart Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md), compartilhado entre produtos Smart.                                                                                                                                                                                                                                                               |
| **Inteligência Artificial**                                                  | **Generic** no MVP → **Supporting** na evolução → potencialmente **Core** quando baseada em dado proprietário | Hoje (MVP) consome só a infraestrutura genérica do [Smart AI Guide](../../../Smart%20Platform/SMART_AI_GUIDE_v1.0.md), sem diferencial próprio. Vira Supporting quando Recomendação/Previsão passam a usar dado acumulado do SmartFood (Fase 3, Missão 0002). Pode chegar a Core se, no longo prazo, um modelo treinado sobre dado exclusivo do SmartFood se tornar razão de escolha do comerciante — reclassificar a cada marco de maturidade, não antecipar. |
| **Ecossistema** (API, Webhooks, Marketplace de Apps)                         | **Generic**                                                                                                   | Padrões de mercado (REST, webhook, app marketplace) — a inovação do SmartFood não está em como uma API é exposta.                                                                                                                                                                                                                                                                                                                                              |
| **Módulos Transversais** (Arquivos, Auditoria, Lixeira)                      | **Generic**                                                                                                   | Por definição (Missão 0002, Seção 3) — infraestrutura reutilizável, candidatos naturais a serem, no futuro, capacidades compartilhadas da própria Smart Platform, não só do SmartFood.                                                                                                                                                                                                                                                                         |

**Implicação prática:** Core Domains recebem o nível de detalhe mais alto neste documento (agregados bem delimitados, eventos explícitos, regras rígidas). Supporting Domains recebem modelo suficiente para funcionar corretamente, sem over-engineering. Generic Domains são modelados no mínimo necessário — não vale a pena investir tempo de design de domínio em um problema já resolvido pelo mercado.

---

## 2. Entidades

Uma Entidade tem **identidade própria** que persiste ao longo do tempo, mesmo que seus atributos mudem.

| Entidade                           | Responsabilidade                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresa**                        | Representa o negócio do comerciante. Raiz de tudo que pertence a uma conta SmartFood. _Ver nota Empresa vs. Tenant logo abaixo da tabela._                                                                                                                                                                                                   |
| **Configuração Global da Empresa** | Parâmetros que valem para toda a Empresa, acima do nível de Loja: timezone, idioma, moeda, feature flags habilitadas, integrações ativas, plano contratado. Parte do agregado Empresa (Seção 4) — não é uma tela nova, é a formalização de algo que a Missão 0002 já previa de forma implícita dentro de Configuração da Loja/Administração. |
| **Loja**                           | Ponto de venda operacional de uma Empresa (1 no MVP, várias na Fase 3 — Multiloja).                                                                                                                                                                                                                                                          |
| **Usuário**                        | Pessoa com acesso ao painel interno (Administrador, Gerente, Operador...), vinculada a uma Empresa por um Papel.                                                                                                                                                                                                                             |
| **Papel (Role)**                   | Conjunto nomeado de permissões atribuível a um Usuário dentro de uma Empresa.                                                                                                                                                                                                                                                                |
| **Cliente**                        | Pessoa que compra da Loja — entidade própria, independente de Usuário (nunca a mesma tabela conceitual).                                                                                                                                                                                                                                     |
| **Endereço Salvo**                 | Um endereço cadastrado por um Cliente, com rótulo (Casa/Trabalho/...), editável e removível — ver distinção com o Value Object "Endereço de Entrega" na Seção 3.                                                                                                                                                                             |
| **Método de Pagamento Salvo**      | Referência tokenizada a um cartão/carteira digital do Cliente, para checkout futuro.                                                                                                                                                                                                                                                         |
| **Produto**                        | Item vendável do Catálogo de uma Loja.                                                                                                                                                                                                                                                                                                       |
| **Categoria**                      | Agrupamento de Produtos.                                                                                                                                                                                                                                                                                                                     |
| **Variação**                       | Opção de um Produto (tamanho/sabor/complemento) com preço e disponibilidade próprios.                                                                                                                                                                                                                                                        |
| **Pedido**                         | Unidade central de transação — aggregate root do domínio Comercial (Seção 4). **É um snapshot completo da venda no momento da confirmação** — ver reforço desta regra na Seção 6 e nos Invariantes (Seção 11).                                                                                                                               |
| **Item do Pedido**                 | Um Produto/Variação específico dentro de um Pedido — snapshot completo, não só de preço: nome, descrição, imagem e categoria também são congelados no momento da compra.                                                                                                                                                                     |
| **Comanda**                        | Registro de consumo vinculado a uma Mesa, agrupando um ou mais Pedidos/itens.                                                                                                                                                                                                                                                                |
| **Mesa**                           | Unidade física do salão à qual uma Comanda pode ser aberta.                                                                                                                                                                                                                                                                                  |
| **Pagamento**                      | Evento de cobrança associado a um Pedido — aggregate root do domínio Pagamentos.                                                                                                                                                                                                                                                             |
| **Tentativa de Cobrança**          | Uma tentativa específica de processar um Pagamento (pode haver mais de uma, em caso de recusa).                                                                                                                                                                                                                                              |
| **Estorno**                        | Reversão de um Pagamento já confirmado.                                                                                                                                                                                                                                                                                                      |
| **Entrega**                        | Acompanha o deslocamento físico de um Pedido até o Cliente, incluindo atribuição a um Motoboy.                                                                                                                                                                                                                                               |
| **Cupom**                          | Regra de desconto aplicável a um Pedido, com validade e condição de uso.                                                                                                                                                                                                                                                                     |
| **Item de Estoque**                | Insumo controlado (Fase 2 — Estoque de Insumo/Ficha Técnica).                                                                                                                                                                                                                                                                                |
| **Movimentação de Estoque**        | Registro de entrada/saída de um Item de Estoque — histórico append-only.                                                                                                                                                                                                                                                                     |
| **Arquivo**                        | Metadado de um arquivo armazenado (foto de produto, logo, documento) — o binário em si vive fora do domínio (armazenamento de objeto).                                                                                                                                                                                                       |
| **Notificação**                    | Registro de uma mensagem enviada pela Central de Comunicação — o que foi enviado, por qual canal, para quem.                                                                                                                                                                                                                                 |
| **Avaliação**                      | Nota e comentário de um Cliente sobre um Pedido concluído.                                                                                                                                                                                                                                                                                   |
| **Conta de Fidelidade**            | Saldo de pontos/nível de um Cliente em uma Empresa.                                                                                                                                                                                                                                                                                          |
| **Movimentação de Pontos**         | Crédito ou débito específico na Conta de Fidelidade — histórico append-only.                                                                                                                                                                                                                                                                 |
| **Assinatura de Produto**          | Configuração de recorrência de um Cliente sobre um conjunto de Produtos (ex: marmita semanal) — **não confundir** com "Assinatura da Plataforma" (billing do comerciante, ver Seção 9).                                                                                                                                                      |
| **Fatura**                         | Cobrança periódica da Assinatura da Plataforma (billing SaaS do comerciante).                                                                                                                                                                                                                                                                |
| **Registro de Auditoria**          | Log append-only de ação sensível — quem fez o quê, quando (Missão 0002, módulo transversal Auditoria).                                                                                                                                                                                                                                       |

> **Nota — Empresa vs. Tenant:** nesta missão, **Empresa representa o Tenant do SmartFood** — são, na prática, o mesmo conceito com nomes diferentes (Empresa é o termo de negócio/produto; Tenant é o termo de infraestrutura/isolamento de dado, usado pela Smart Platform Architecture). Essa equivalência 1:1 é adequada para o SmartFood hoje, mas **não deve ser assumida como universal**: a Smart Platform pode, no futuro, separar os dois conceitos (ex: um Tenant guarda-chuva contendo mais de uma Empresa, útil para um grupo econômico com CNPJs diferentes usando produtos Smart distintos). Este documento fixa a equivalência apenas no escopo do SmartFood — qualquer decisão de unificar ou separar os dois conceitos na Smart Platform é decisão de arquitetura de plataforma, fora do escopo desta missão.

**Deliberadamente NÃO modelados como entidades próprias** (para evitar over-modeling):

- **Histórico** — não é uma entidade; é uma consulta/projeção sobre entidades já existentes (histórico de Pedido = consulta de Pedidos por Cliente; histórico de Comunicação = consulta de Notificações por destinatário). Modelar "Histórico" como entidade duplicaria dado que já existe em outro lugar.
- **Lixeira** — não é uma entidade; é um **estado de ciclo de vida** (Seção 7) compartilhado por qualquer entidade excluível (Produto, Cupom, Endereço Salvo, Usuário...), com campo de exclusão reversível e prazo, não uma tabela própria de "itens excluídos".
- **Motoboy** — não é um tipo de entidade separado; é um Usuário com Papel "Operador" especializado em tela (Missão 0002, Seção 14). A entidade que importa é **Entrega**, que referencia qual Usuário está atribuído.

---

## 3. Objetos de Valor (Value Objects)

Um Value Object **não tem identidade própria** — é definido inteiramente pelos seus atributos, é imutável, e é comparado por valor (dois VOs com os mesmos atributos são o mesmo VO). Quando muda, é _substituído_, nunca _editado_.

| Value Object                                 | Por que é um Value Object                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endereço de Entrega**                      | Snapshot imutável do endereço no momento da compra, embutido no agregado Pedido. Se o Cliente depois editar ou excluir o Endereço Salvo correspondente, o pedido já feito não muda — por isso não pode ser uma referência viva a uma Entidade, tem que ser uma cópia de valor. _(Nota: o "Endereço Salvo" do Cliente, ao contrário, É uma Entidade — ver Seção 2 e a distinção explícita na Seção 9.)_ |
| **Dinheiro**                                 | Valor monetário + moeda. Dois "R$ 25,90" são idênticos e intercambiáveis — não faz sentido dar identidade a uma quantia de dinheiro.                                                                                                                                                                                                                                                                   |
| **Telefone**                                 | Validado por formato, comparado por valor — dois registros com o mesmo número são o mesmo telefone.                                                                                                                                                                                                                                                                                                    |
| **E-mail**                                   | Mesma lógica do Telefone.                                                                                                                                                                                                                                                                                                                                                                              |
| **CPF/CNPJ**                                 | Identificador de valor fixo e validável — não tem ciclo de vida próprio dentro do domínio SmartFood (não é o SmartFood quem "cria" um CNPJ).                                                                                                                                                                                                                                                           |
| **Chave PIX**                                | Dado cadastral de valor único, substituível por completo quando muda, nunca "editado parcialmente".                                                                                                                                                                                                                                                                                                    |
| **Horário de Funcionamento**                 | Janela de abertura/fechamento por dia da semana — descreve uma regra, não algo com identidade própria; duas lojas com o mesmo horário têm o mesmo Value Object.                                                                                                                                                                                                                                        |
| **Coordenadas**                              | Latitude/longitude — puro valor, sem identidade.                                                                                                                                                                                                                                                                                                                                                       |
| **Período**                                  | Par de datas (início/fim), usado em relatórios e validade de cupom/promoção.                                                                                                                                                                                                                                                                                                                           |
| **Área de Cobertura**                        | Raio ou lista de bairros + taxa — descreve uma regra de entrega, substituída como um todo quando o comerciante reconfigura.                                                                                                                                                                                                                                                                            |
| **Variação Selecionada (no Item do Pedido)** | Snapshot imutável e **completo** de qual opção foi escolhida — preço, nome, descrição, imagem e categoria no momento da compra — distinto da entidade "Variação" do Catálogo (que pode mudar depois; o Item do Pedido não "segue" essa mudança). O Pedido inteiro é, por design, uma fotografia da venda no instante em que aconteceu, não uma referência viva ao Catálogo.                            |
| **Desconto**                                 | Percentual ou valor fixo aplicado por um Cupom — puro valor, sem identidade própria além do Cupom que o define.                                                                                                                                                                                                                                                                                        |
| **Canal de Venda**                           | Identifica a origem de um Pedido — Site, QR Code, Mesa, Balcão, Autoatendimento, Marketplace, API. Puro valor descritivo, sem comportamento ou ciclo de vida próprio; formaliza, ao nível de domínio, a unificação de canais que o Motor de Pedidos já promete desde a Missão 0002.                                                                                                                    |

---

## 4. Agregados

Um Agregado define a **fronteira de consistência transacional** — tudo dentro dele muda junto, de forma atômica; tudo fora é referenciado por identificador e sincronizado por evento, não por edição direta.

| Agregado (raiz em negrito) | Contém                                                                                                                                                          | Referencia por ID (fora do agregado)                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Pedido**                 | Itens do Pedido, Endereço de Entrega (VO), Canal de Venda (VO), histórico de status (timeline)                                                                  | Cliente, Cupom aplicado, Pagamento, Comanda (se aplicável)           |
| **Cliente**                | Endereços Salvos, Métodos de Pagamento Salvos, lista de Favoritos (referências)                                                                                 | Empresa/Loja (contexto, não posse)                                   |
| **Empresa**                | Configuração da Loja (identidade, horário, entrega, dados fiscais), Configuração Global da Empresa (timezone, idioma, moeda, feature flags, integrações, plano) | Usuários (referenciados, não contidos — ver justificativa abaixo)    |
| **Produto**                | Variações                                                                                                                                                       | Categoria (referência)                                               |
| **Categoria**              | — (agregado simples: nome, ordem)                                                                                                                               | —                                                                    |
| **Pagamento**              | Tentativas de Cobrança, Estornos                                                                                                                                | Pedido (referência)                                                  |
| **Comanda**                | Referências a Pedidos/itens vinculados à Mesa                                                                                                                   | Mesa (referência)                                                    |
| **Conta de Fidelidade**    | Movimentações de Pontos                                                                                                                                         | Cliente (referência)                                                 |
| **Assinatura de Produto**  | — (agregado simples: frequência, produtos incluídos, status)                                                                                                    | Cliente, gera Pedidos por referência (não contém os Pedidos gerados) |
| **Cupom**                  | — (agregado simples e independente)                                                                                                                             | —                                                                    |
| **Item de Estoque**        | Movimentações de Estoque                                                                                                                                        | Produto (referência)                                                 |

**Por que Usuário não está dentro do agregado Empresa:** um Usuário tem ciclo de vida próprio (pode ser convidado, remover acesso, e — no cenário de SSO futuro entre produtos Smart — potencialmente pertencer a mais de um contexto). Colocá-lo dentro do agregado Empresa forçaria toda alteração de time a passar pela mesma trava de consistência que protege a configuração da loja, sem necessidade real.

**Por que Pagamento é um agregado separado de Pedido, e não contido nele:** já era uma decisão estrutural da Missão 0002 (Pagamentos ≠ Financeiro, domínios separados). Aqui a razão DDD é ainda mais direta: o ciclo de vida do Pagamento (múltiplas tentativas, aprovação assíncrona por um gateway externo) roda em ritmo diferente do ciclo de vida do Pedido, e forçá-los no mesmo agregado criaria contenção — duas partes do sistema (cozinha atualizando status do pedido, gateway confirmando pagamento) tentando alterar o mesmo agregado ao mesmo tempo. **Isso reforça o Invariante:** todo Pagamento pertence a um único Pedido, mas um Pedido pode existir e evoluir (ex: ser cancelado) antes de qualquer Pagamento ser confirmado — ver Seção 6 e Seção 11.

---

## 5. Eventos de Domínio

Expande os Eventos do Sistema já listados na Missão 0002 (Seção 12) com o detalhe completo pedido nesta missão.

| Evento                                       | Quem gera                                                  | Quando ocorre                                                                      | Quem consome                                                                      | Impactos                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **EMPRESA_CRIADA**                           | Agregado Empresa                                           | Conclusão do Onboarding                                                            | Configuração da Loja, Administração, Financeiro (billing), Central de Comunicação | Cria o espaço isolado da conta; dispara e-mail de boas-vindas                                   |
| **PRODUTO_ATUALIZADO**                       | Agregado Produto                                           | Criação/edição de produto ou variação                                              | Vitrine (Comercial), Auditoria                                                    | Atualização imediata do que o Cliente vê                                                        |
| **ESTOQUE_BAIXADO**                          | Agregado Item de Estoque (ou Produto, no controle simples) | Marcação manual ou baixa automática por Movimentação de Estoque                    | Catálogo, Vitrine                                                                 | Produto some/fica indisponível em tempo real                                                    |
| **CLIENTE_CADASTRADO**                       | Agregado Cliente                                           | Primeiro Pedido ou cadastro direto via Login                                       | Experiência do Cliente, Central de Comunicação, Auditoria                         | Mensagem de boas-vindas; perfil criado                                                          |
| **ENDERECO_ADICIONADO**                      | Agregado Cliente                                           | Cliente salva um novo Endereço Salvo                                               | Checkout (passa a oferecê-lo como opção)                                          | Nenhum impacto em Pedido já existente (reforça a natureza de Value Object do endereço embutido) |
| **PEDIDO_CRIADO**                            | Agregado Pedido                                            | Cliente confirma o Checkout                                                        | Motor de Pedidos, Painel de Pedidos, Central de Comunicação                       | Notifica equipe e cliente; inicia o ciclo de vida do Pedido                                     |
| **PAGAMENTO_CONFIRMADO**                     | Agregado Pagamento                                         | Gateway aprova a cobrança                                                          | Pedido (avança de status), Financeiro                                             | Pedido passa a ser preparável (Regra de Negócio Global 3, Missão 0002)                          |
| **PAGAMENTO_RECUSADO**                       | Agregado Pagamento                                         | Gateway recusa a cobrança                                                          | Pedido (permanece pendente), Central de Comunicação                               | Cliente avisado para tentar novamente; equipe operacional não é acionada                        |
| **PEDIDO_CANCELADO**                         | Agregado Pedido                                            | Cliente ou Operador solicita cancelamento                                          | Pagamento (aciona Estorno se aplicável), Auditoria                                | Pedido sai das métricas de venda concluída                                                      |
| **REEMBOLSO_PROCESSADO**                     | Agregado Pagamento (Estorno)                               | Gateway confirma o estorno                                                         | Financeiro, Central de Comunicação                                                | Cliente notificado; Fechamento de Caixa reflete a reversão                                      |
| **CUPOM_APLICADO**                           | Agregado Pedido (referenciando Cupom)                      | Cliente aplica cupom no Checkout                                                   | Marketing (contabiliza uso)                                                       | Desconto (VO) aplicado ao total do Pedido                                                       |
| **AVALIACAO_RECEBIDA**                       | Agregado Avaliação                                         | Cliente avalia Pedido concluído                                                    | Central de Comunicação (alerta ao Administrador)                                  | Habilita resposta pública do lojista                                                            |
| **FIDELIDADE_PONTOS_CREDITADOS**             | Agregado Conta de Fidelidade                               | Pedido muda para "concluído" (nunca sobre cancelado/reembolsado — Regra Global 11) | Experiência do Cliente                                                            | Saldo do Cliente atualizado                                                                     |
| **ASSINATURA_CRIADA / ASSINATURA_CANCELADA** | Agregado Assinatura de Produto                             | Cliente ativa ou cancela recorrência                                               | Motor de Pedidos (passa a gerar Pedidos automáticos)                              | Início/fim da geração automática de Pedido                                                      |
| **ITEM_MOVIDO_PARA_LIXEIRA**                 | Qualquer agregado excluível                                | Usuário solicita exclusão                                                          | Auditoria                                                                         | Inicia contagem do prazo de recuperação (Seção 7)                                               |
| **PERMISSAO_ALTERADA**                       | Agregado Usuário/Papel                                     | Administrador muda o papel de um Usuário                                           | Auditoria                                                                         | Acesso muda na próxima ação do usuário afetado                                                  |

### Eventos Negativos (preparação para monitoramento e automação)

Além do fluxo esperado, o domínio precisa reconhecer explicitamente quando algo sai do caminho normal — esses eventos são a base direta para observabilidade e automação futuras (relevante desde já para a Missão 0005 — Arquitetura da Solução — e a Missão 0006 — Modelagem do Banco de Dados):

| Evento                   | Quem gera                | Quando ocorre                                                                           | Quem consome                                     | Impactos                                                                                  |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **PAGAMENTO_EXPIRADO**   | Agregado Pagamento       | Tentativa de Cobrança não é concluída dentro do prazo (ex: Pix gerado e não pago)       | Pedido, Central de Comunicação                   | Pedido não avança de status; abre caminho para nova tentativa ou abandono                 |
| **ESTOQUE_INSUFICIENTE** | Agregado Item de Estoque | Pedido tentaria consumir mais do que o disponível                                       | Catálogo (marca indisponível), Painel de Pedidos | Bloqueia a venda antes da confirmação — reforça a Regra de Negócio Global 2 (Missão 0002) |
| **LOJA_PAUSADA**         | Agregado Empresa/Loja    | Pausa manual ou automática por sobrecarga (Missão 0002, item ainda pendente de decisão) | Vitrine, Central de Comunicação                  | Vitrine para de aceitar novo Pedido; pedidos em andamento seguem até a conclusão          |
| **ENTREGA_ATRASADA**     | Agregado Entrega         | Tempo estimado é ultrapassado sem mudança de status                                     | Central de Comunicação, Painel de Pedidos        | Alerta à equipe e, opcionalmente, ao cliente                                              |
| **PEDIDO_EXPIRADO**      | Agregado Pedido          | Pedido fica tempo excessivo sem confirmação de pagamento                                | Motor de Pedidos, Central de Comunicação         | Cancelamento automático por timeout, sem intervenção humana                               |

**Distinção importante descoberta nesta missão:** _Evento de Domínio_ (linhas acima) e _Registro de Auditoria_ (Seção 2) não são a mesma coisa, embora se sobreponham. Evento de Domínio é sobre **mudança de estado do sistema** (dispara reação de outros agregados/domínios, inclusive automações futuras) — pode ser causado por um humano ou por outro sistema. Registro de Auditoria é sobre **responsabilização** (quem fez, para compliance/rastreabilidade) — só existe quando há ação atribuível a um ator. Nem todo Evento de Domínio gera Auditoria (ex: `PAGAMENTO_CONFIRMADO` vindo do gateway não tem um "usuário" para responsabilizar), e a Auditoria pode registrar detalhe que o Evento não carrega (ex: valor anterior vs. novo valor de um preço alterado).

---

## 6. Regras de Negócio por Domínio

Reorganiza as Regras de Negócio Globais da Missão 0002 (Seção 13) por domínio, com marcação de criticidade e volatilidade.

| Regra                                                                                                                                                                                                          | Domínio                          | Criticidade   | Muda com frequência?                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pedido não pode retroceder de status                                                                                                                                                                           | Comercial/Operacional            | 🔴 Crítica    | Não — é estrutural                                                                                                                     |
| Produto sem estoque não pode ser vendido (controle ativo)                                                                                                                                                      | Comercial                        | 🔴 Crítica    | Não                                                                                                                                    |
| Pagamento recusado não gera pedido confirmado                                                                                                                                                                  | Pagamentos                       | 🔴 Crítica    | Não                                                                                                                                    |
| Cupom expirado não pode ser utilizado                                                                                                                                                                          | Marketing                        | 🔴 Crítica    | Não                                                                                                                                    |
| Empresa bloqueada não pode receber novos pedidos                                                                                                                                                               | Financeiro/Administração         | 🔴 Crítica    | Não                                                                                                                                    |
| Exclusão de registro crítico sempre passa pela Lixeira                                                                                                                                                         | Transversal                      | 🟡 Importante | Prazo de retenção pode mudar (item pendente da Missão 0002, ainda não decidido)                                                        |
| Toda alteração sensível gera Auditoria                                                                                                                                                                         | Transversal                      | 🔴 Crítica    | Não                                                                                                                                    |
| Cliente só pode avaliar pedido já concluído                                                                                                                                                                    | Experiência do Cliente           | 🟡 Importante | Não                                                                                                                                    |
| Papel (RBAC) é sempre por tenant                                                                                                                                                                               | Administração                    | 🔴 Crítica    | Não                                                                                                                                    |
| Loja fora do horário não aceita novo pedido, mas conclui os em andamento                                                                                                                                       | Operacional/Configuração da Loja | 🟡 Importante | **Sim** — nível de automação da pausa por sobrecarga ainda é item pendente (Missão 0002, Seção 16)                                     |
| Fidelidade só acumula sobre pedido concluído                                                                                                                                                                   | Experiência do Cliente           | 🟡 Importante | **Sim** — regra de acúmulo (ex: pontos por real gasto) tende a ser configurável por Empresa no futuro                                  |
| Preço do Item do Pedido é congelado no momento da compra, não segue alteração posterior do Produto                                                                                                             | Comercial                        | 🔴 Crítica    | Não — decorre diretamente da Seção 3 (Variação Selecionada como Value Object)                                                          |
| Tentativa de Cobrança recusada não bloqueia nova tentativa no mesmo Pedido                                                                                                                                     | Pagamentos                       | 🟡 Importante | **Sim** — número máximo de tentativas é candidato a configuração                                                                       |
| Estorno só pode ser aberto sobre Pagamento previamente confirmado                                                                                                                                              | Pagamentos                       | 🔴 Crítica    | Não                                                                                                                                    |
| _(nova)_ **Todo Pagamento pertence a um Pedido, mas um Pedido pode existir antes da confirmação do Pagamento**                                                                                                 | Pagamentos/Comercial             | 🔴 Crítica    | Não — é o que sustenta o estado "Aguardando Pagamento" no ciclo de vida do Pedido (Seção 7) e a separação dos dois agregados (Seção 4) |
| _(nova)_ O Pedido é um snapshot completo da venda (itens, preços, nomes, descrições, imagens, categorias) no momento da confirmação — nenhuma alteração posterior no Catálogo se propaga a um Pedido já criado | Comercial                        | 🔴 Crítica    | Não                                                                                                                                    |

---

## 7. Ciclo de Vida das Principais Entidades

### Pedido

```
Criado (checkout confirmado)
  → Aguardando Pagamento
      → Pagamento Recusado → (Cliente tenta novamente ou abandona — pedido nunca chega a "Recebido")
      → Pagamento Confirmado → Recebido
  → Recebido → Em Preparo → Pronto/Saiu para Entrega → Concluído
  (a partir de qualquer estado antes de Concluído) → Cancelado
```

Estado terminal: **Concluído** ou **Cancelado** — nenhum dos dois retorna a estado anterior (Regra de Negócio Global 1).

### Produto

```
Criado → Ativo (disponível) ⇄ Indisponível (esgotado, alternância livre)
   → (exclusão solicitada) → Na Lixeira (recuperável) → Removido definitivamente (prazo expirado ou remoção manual)
```

### Pagamento

```
Iniciado → Tentativa de Cobrança (1..N) → Aprovado | Recusado (definitivo, sem mais tentativas se o Pedido foi abandonado)
   (a partir de Aprovado) → Estorno Solicitado → Estorno Concluído
```

### Entrega

```
Aguardando Atribuição → Atribuída (Motoboy aceitou) → Retirada → A Caminho → Entregue
   (a partir de qualquer estado antes de Entregue) → Cancelada (reflete cancelamento do Pedido)
```

### Cliente

```
Criado (primeiro pedido ou cadastro direto)
   → Ativo (indefinidamente — não há estado terminal natural)
   → (exclusão solicitada, ex: pedido de dado pessoal) → Na Lixeira → Removido definitivamente
```

_Nota: exclusão de Cliente tem implicação de retenção de dado transacional (Pedidos antigos referenciam o Cliente) — item registrado como dúvida no Resumo Executivo desta missão, relevante para regulação de dado pessoal._

### Empresa

```
Criada (onboarding) → Ativa
   → Inadimplente (Fatura em atraso) → Bloqueada (não recebe novo pedido, Regra de Negócio Global 5)
   → Ativa novamente (pagamento regularizado)
   → (encerramento voluntário) → Encerrada
```

---

## 8. Dependências entre Domínios

Reexamina o mapa de dependência da Missão 0002 (Seção 7) sob a lente de acoplamento entre agregados.

```
Empresa ← (contexto de todo o resto, sem exceção)
   │
   ├── Cliente ── independente de Catálogo/Pedido até o primeiro Pedido
   ├── Produto/Categoria ── depende só de Empresa
   │
   └── Pedido ── acopla-se a: Cliente (referência), Produto/Variação (snapshot no
                  momento da compra, não referência viva), Cupom (referência),
                  Pagamento (referência), Comanda (referência opcional)
         │
         ├── Pagamento ── acopla-se de volta a Pedido só por referência (nunca contido)
         ├── Entrega ── acopla-se a Pedido (referência) e a Usuário/Motoboy (referência)
         └── Avaliação ── acopla-se a Pedido concluído (referência)

   Conta de Fidelidade ── acopla-se a Cliente e reage a eventos de Pedido
                            (não lê o Pedido diretamente — reage ao evento)
```

**Acoplamento saudável identificado:** Pedido referencia (por ID) tudo que precisa, mas não _contém_ Pagamento, Entrega ou Avaliação — cada um evolui com seu próprio ritmo e trava de consistência, comunicando-se por Evento de Domínio (Seção 5). Isso evita o antipadrão de "agregado gigante" que travaria toda alteração no mesmo lock.

**Risco de acoplamento identificado:** o agregado **Pedido** referencia quatro outros conceitos diferentes (Cliente, Produto/Variação, Cupom, Comanda) além de ser referenciado por mais três (Pagamento, Entrega, Avaliação, Fidelidade). Ele é, de longe, o ponto de maior "gravidade" do domínio — coerente com ser um Core Domain (Seção 1), mas exige atenção redobrada na próxima missão técnica para não deixar essas sete relações virarem sete JOINs obrigatórios em toda leitura simples de pedido.

**Sugestão de melhoria:** ao desenhar a solução técnica, considerar que a maioria das leituras do dia a dia (Painel de Pedidos, Fila da Cozinha) só precisa dos dados **já embutidos como Value Object** no Pedido (itens, endereço, canal, preço) — não precisa fazer JOIN com Cliente/Produto/Cupom para renderizar a tela operacional. Isso é uma decisão de modelagem, não de banco, mas nasce direto da distinção Entidade/Value Object feita aqui.

---

## 9. Glossário — Atualização da Linguagem Ubíqua

Estende o glossário da Missão 0002 (Seção 15) com os termos e distinções que emergiram da modelagem de domínio. Termos já existentes não são repetidos aqui — ver o documento original para a lista completa.

| Termo novo                                                 | Definição oficial                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entidade**                                               | Conceito de domínio com identidade própria que persiste mesmo quando seus atributos mudam (ex: Produto, Pedido, Cliente).                                                                                                                                                                                                                                                                                 |
| **Objeto de Valor (Value Object)**                         | Conceito de domínio sem identidade própria, definido inteiramente por seus atributos, imutável — substituído, nunca editado (ex: Dinheiro, Endereço de Entrega).                                                                                                                                                                                                                                          |
| **Agregado**                                               | Fronteira de consistência transacional — um grupo de Entidades/Value Objects que muda de forma atômica, com uma única raiz (Aggregate Root) através da qual todo o resto é acessado.                                                                                                                                                                                                                      |
| **Empresa** vs. **Tenant**                                 | _Empresa_ é o termo de negócio/produto usado em toda a documentação SmartFood. _Tenant_ é o termo de infraestrutura/isolamento de dado da Smart Platform Architecture. No SmartFood, hoje, **são o mesmo conceito** (1 Empresa = 1 Tenant) — essa equivalência é local ao SmartFood, não uma regra universal da Smart Platform (ver nota completa na Seção 2).                                            |
| **Endereço Salvo** vs. **Endereço de Entrega**             | _Endereço Salvo_ é a Entidade que o Cliente cadastra, edita e remove no seu Perfil (Missão 0003). _Endereço de Entrega_ é o Value Object — uma cópia imutável de um Endereço Salvo, embutida no Pedido no momento da compra, que não muda mesmo que o Endereço Salvo original seja depois editado ou excluído. **Nunca usar "Endereço" sozinho a partir desta missão** — sempre qualificar qual dos dois. |
| **Assinatura de Produto** vs. **Assinatura da Plataforma** | _Assinatura de Produto_ é a recorrência de compra configurada por um Cliente (ex: marmita semanal, módulo Comercial). _Assinatura da Plataforma_ é o billing SaaS do comerciante com o próprio SmartFood (módulo Financeiro/Billing). São contextos completamente diferentes que compartilhavam a palavra "Assinatura" nos documentos anteriores — a partir desta missão, sempre qualificar.              |
| **Evento de Domínio** vs. **Registro de Auditoria**        | _Evento de Domínio_ é uma notificação de mudança de estado do sistema, que pode ou não ter um ator humano por trás (ex: `PAGAMENTO_CONFIRMADO` vem do gateway, não de uma pessoa). _Registro de Auditoria_ é especificamente sobre responsabilização de uma ação humana/administrativa. Nem todo Evento gera Auditoria; nem toda Auditoria é modelada como Evento.                                        |
| **Aggregate Root**                                         | A única Entidade de um Agregado que pode ser referenciada de fora dele — todo acesso ao conteúdo interno do agregado passa por ela (ex: não se acessa um Item do Pedido diretamente, sempre através do Pedido).                                                                                                                                                                                           |
| **Invariante**                                             | Regra estrutural que nunca pode ser violada em nenhuma circunstância, distinta de regra de negócio comum que pode ter exceção configurável — ver Seção 11.                                                                                                                                                                                                                                                |
| **Canal de Venda**                                         | Origem de um Pedido (Site, QR Code, Mesa, Balcão, Autoatendimento, Marketplace, API) — ver Seção 3.                                                                                                                                                                                                                                                                                                       |

---

## 10. Preparação para Persistência

Sem definir banco de dados — apenas classificar cada entidade quanto à natureza de armazenamento, para orientar a próxima missão técnica sem redefinir conceito de negócio.

| Classificação                                                                            | Entidades                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistida (fonte de verdade, sempre)**                                                | Empresa (inclui Configuração Global embutida), Loja, Usuário, Papel, Cliente, Endereço Salvo, Método de Pagamento Salvo, Produto, Categoria, Variação, Pedido, Item do Pedido, Comanda, Mesa, Pagamento, Tentativa de Cobrança, Estorno, Entrega, Cupom, Item de Estoque, Movimentação de Estoque, Arquivo (metadado), Notificação (registro de envio), Avaliação, Conta de Fidelidade, Movimentação de Pontos, Assinatura de Produto, Fatura, Registro de Auditoria |
| **Cache (derivável — recalculável a partir de dado persistido, não é fonte de verdade)** | Dashboard de Indicadores, Relatórios de Vendas agregados, Painel de Comparação Anônima (IA), Previsão de Demanda (IA) — todos recalculáveis a partir de Pedido/Pagamento; perder o cache não perde informação, só custa reprocessamento                                                                                                                                                                                                                              |
| **Temporária (curta duração, não precisa sobreviver a reinício de sessão)**              | Carrinho antes da confirmação do Pedido (só vira dado persistente de verdade quando o `PEDIDO_CRIADO` dispara), estado de sessão de login, rascunho de formulário não salvo                                                                                                                                                                                                                                                                                          |

**Nota sobre Arquivo:** o **metadado** (nome, tipo, referência, quem enviou) é persistido como qualquer outra entidade; o **conteúdo binário** em si (a foto, o PDF) não é modelado aqui como parte do domínio de negócio — vive em armazenamento de objeto (Seção 1 da Smart Platform Architecture, "Armazenamento de arquivos: S3 ou compatível"), fora do escopo desta modelagem de domínio.

---

## 11. Invariantes do Domínio

Diferente das Regras de Negócio (Seção 6) — que incluem regras que podem se tornar configuráveis — Invariantes são verdades estruturais que **nunca podem ser violadas em nenhuma circunstância**, sob nenhuma configuração futura. Uma violação de Invariante é sempre um bug, nunca uma decisão de negócio.

1. **Um Pedido pertence a uma única Empresa** — nunca é compartilhado ou transferido entre Empresas.
2. **Um Pagamento pertence a um único Pedido** — nunca cobre mais de um Pedido, nunca existe sem um Pedido associado (mesmo que o Pedido ainda esteja "Aguardando Pagamento", a referência já existe).
3. **Um Produto pertence a uma única Loja** — catálogo não é compartilhado entre Lojas, mesmo dentro da mesma Empresa (Multiloja replica/varia produtos, não os compartilha por referência única — ver Missão 0002, Multiloja).
4. **Um Cliente pode comprar em várias Lojas** (inclusive de Empresas diferentes) — a identidade do Cliente não é presa a uma única Empresa, diferente da identidade do Usuário (que é sempre escopado a uma Empresa).
5. **Um Item do Pedido nunca muda depois de criado** — é snapshot imutável, reflexo do Invariante mais amplo do Pedido como fotografia da venda (Seção 6).
6. **Um Papel (Role) só concede permissão dentro da Empresa à qual pertence** — nunca há vazamento de permissão entre Empresas (herda diretamente do [Smart Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md)).
7. **Um Pedido nunca retrocede de status** (Regra de Negócio Global 1, Missão 0002) — elevado a Invariante porque nenhuma configuração futura deveria ter permissão de flexibilizar isso sem quebrar a integridade do histórico.
8. **Uma Conta de Fidelidade pertence a exatamente um par (Cliente, Empresa)** — pontos não atravessam Empresa, mesmo que o mesmo Cliente compre em várias.

---

## 12. Entidades Futuras (Roadmap Arquitetural)

Conceitos identificados durante esta modelagem que **não fazem parte do domínio atual nem do MVP**, mas que já merecem estar registrados para que uma decisão futura não precise redescobrir o espaço de possibilidades do zero:

| Entidade Futura             | Ideia                                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gift Card**               | Crédito pré-pago que o Cliente pode comprar/presentear, resgatável em Pedido futuro.                                                                                                                               |
| **Combo**                   | Agrupamento de Produtos vendido como unidade própria, com preço diferente da soma das partes — relaciona-se com o Ponto de Inovação "Combo Inteligente" (Missão 0002).                                             |
| **Receita / Ficha Técnica** | Detalhamento de quais Itens de Estoque compõem um Produto, além do controle simples já modelado — necessário para baixa automática de insumo (Fase 2, Missão 0002).                                                |
| **Fornecedor**              | Origem de um Item de Estoque — relevante quando Compras (Central de Compras Consolidada, Missão 0002 Enterprise) for modelada de fato.                                                                             |
| **Campanha**                | Agrupamento de Cupons/Promoções sob um objetivo de marketing com métrica própria — mais estruturado que um Cupom avulso.                                                                                           |
| **Clube de Assinatura**     | Programa de vantagens pago pelo Cliente diretamente ao lojista (Ponto de Inovação 11, Missão 0002) — distinto de Assinatura de Produto (recorrência de compra) e de Fidelidade (pontos gratuitos por recorrência). |

Nenhuma dessas entidades é modelada em detalhe agora — registrar a existência do conceito é suficiente para orientar decisões futuras sem sinalizar compromisso de escopo.

---

## 13. Resumo Executivo

Esta missão formalizou o modelo de domínio do SmartFood usando DDD: 3 domínios Core (Comercial, Operacional, Experiência do Cliente — onde a inovação do produto de fato acontece), 6 Supporting e 4 Generic (com Inteligência Artificial marcada para reclassificação progressiva: Generic → Supporting → potencialmente Core); 29 Entidades com responsabilidade única cada; 12 Value Objects justificados por imutabilidade e ausência de identidade; 11 Agregados com fronteira de consistência explícita; 21 Eventos de Domínio detalhados (16 de fluxo esperado + 5 negativos, preparando observabilidade e automação futuras); regras de negócio classificadas por criticidade e volatilidade; 8 Invariantes estruturais nunca-violáveis; ciclo de vida das 6 entidades centrais; um roadmap de 6 Entidades Futuras explicitamente fora do MVP; e um mapa de dependência que identifica o Pedido como o agregado de maior acoplamento do sistema.

O ganho mais importante desta missão é ter **separado explicitamente conceitos que os documentos anteriores tratavam como equivalentes sem serem**: Endereço Salvo vs. Endereço de Entrega, Assinatura de Produto vs. Assinatura da Plataforma, Evento de Domínio vs. Registro de Auditoria, e — nesta rodada de consolidação — Empresa vs. Tenant. Nenhuma dessas distinções muda o que o produto faz — todas mudam como ele deve ser construído sem gerar bug de inconsistência.

### Decisões tomadas

- Pedido, Pagamento, Entrega e Avaliação são agregados **separados**, conectados por referência e Evento de Domínio — nunca um agregado gigante.
- Endereço tem dupla natureza deliberada: Entidade quando salvo pelo Cliente, Value Object quando embutido em um Pedido.
- Histórico e Lixeira não são entidades — são, respectivamente, uma projeção de consulta e um estado de ciclo de vida.
- Motoboy não é um tipo de entidade — é um Usuário/Papel, e a entidade real é a Entrega.
- IA reclassificada em três estágios progressivos (Generic → Supporting → potencialmente Core), não mais uma transição única.
- Empresa e Tenant tratados como equivalentes **apenas no escopo do SmartFood** — não assumir essa equivalência em outros produtos Smart sem revisão.
- Configuração Global da Empresa formalizada como parte do agregado Empresa, sem criar tela ou domínio novo.
- Canal de Venda formalizado como Value Object do Pedido.
- Pedido reforçado explicitamente como snapshot completo (não só preço) — agora também um Invariante, não apenas uma regra.
- 8 Invariantes do Domínio registrados como camada acima das Regras de Negócio comuns.
- 6 Entidades Futuras documentadas como roadmap, sem compromisso de escopo.

### Dúvidas

1. Exclusão de Cliente (LGPD/dado pessoal): como reconciliar com Pedidos antigos que o referenciam? Anonimizar em vez de excluir? Decisão de negócio + jurídica, não só de modelagem.
2. Prazo de retenção da Lixeira (já pendente desde a Missão 0002) — esta missão não resolve, apenas reafirma que é estado de ciclo de vida, não entidade.
3. Regra de acúmulo de Fidelidade (pontos por real gasto) será configurável por Empresa desde o início, ou fixa até a Fase 2 amadurecer?
4. Número máximo de Tentativas de Cobrança antes de desistir automaticamente do Pagamento — valor fixo ou configurável por Empresa?
5. _(nova)_ Empresa vs. Tenant: quando (e se) a Smart Platform decidir separar os dois conceitos formalmente, como fica a migração do SmartFood, que hoje assume equivalência 1:1?

### Impacto na próxima missão técnica

- Os 11 Agregados desta missão são o ponto de partida direto para o desenho de módulos/serviços internos — cada Aggregate Root tende a ancorar um Bounded Context ou submódulo.
- Value Objects (Endereço de Entrega, Dinheiro, Variação Selecionada, Canal de Venda) tendem a ser campos embutidos/estruturas compostas, não entidades próprias com referência — decisão que evita acoplamento desnecessário nas leituras operacionais mais frequentes (Painel de Pedidos, Fila da Cozinha).
- O risco de acoplamento do agregado Pedido (Seção 8) deve orientar o desenho da leitura operacional do Painel de Pedidos sem depender de busca cruzada com Cliente/Produto/Cupom.
- Distinção Evento de Domínio vs. Auditoria (Seção 5/9) sugere dois mecanismos de registro potencialmente distintos, não um único mecanismo fazendo os dois papéis — relevante diretamente para a Estratégia de Eventos da próxima missão.
- Os 5 Eventos Negativos (Seção 5) são candidatos diretos a gatilho de observabilidade/alerta na próxima missão técnica.
- Os 8 Invariantes (Seção 11) devem virar validação estrutural obrigatória, não checagem opcional, na implementação futura.
- Entidades "Cache" (Seção 10) não precisam de modelagem transacional rígida — podem tolerar reconstrução/reprocessamento.

### Itens que deverão ser registrados nas Review Notes

- As quatro distinções de linguagem resolvidas nesta missão (Endereço, Assinatura, Evento vs. Auditoria, Empresa vs. Tenant) — decisão de nomenclatura com efeito prático em bug futuro se não for respeitada.
- Pedido como agregado de maior acoplamento — risco assumido conscientemente por ser Core Domain, não um erro de modelagem.
- Reclassificação progressiva de IA (Generic → Supporting → Core), condicionada a marcos de maturidade, não a uma data.
- Empresa/Tenant como equivalência local ao SmartFood, não regra universal da Smart Platform — risco de desalinhamento futuro registrado conscientemente.
- Invariantes (Seção 11) como categoria nova, superior hierarquicamente às Regras de Negócio comuns (Seção 6).
- As 5 dúvidas acima, para não se perderem antes da próxima rodada de revisão.

---

_Fim do documento — Missão 0004, CONGELADA. Ver [missao-0004-review-notes.md](../../engineering/review-notes/missao-0004-review-notes.md) para o histórico completo da revisão._
