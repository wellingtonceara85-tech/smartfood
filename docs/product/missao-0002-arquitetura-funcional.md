# SmartFood — Arquitetura Funcional do Produto

**Missão 0002**
**Status:** ✅ CONGELADA — versão oficial (confirmada ao iniciar a Missão 0003)
**Referência obrigatória:** [Smart Platform](../../../Smart%20Platform/INDEX.md) — em especial o modelo de papéis do [Smart Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md) e as camadas de IA do [Smart AI Guide](../../../Smart%20Platform/SMART_AI_GUIDE_v1.0.md), usados aqui apenas como vocabulário funcional — nenhuma tecnologia é definida neste documento.
**Insumo:** [Missão 0001 — Visão Estratégica](missao-0001-visao-estrategica.md) (personas, MVP comercial, roadmap)
**Histórico de decisões:** [missao-0002-review-notes.md](../../engineering/review-notes/missao-0002-review-notes.md)
**Escopo:** Arquitetura funcional pura — módulos, jornadas, fluxos, dependências, eventos, regras de negócio e linguagem oficial. Sem código, sem stack, sem modelagem de banco de dados.

---

## 1. Visão Geral da Plataforma

O SmartFood conecta três públicos em um único sistema: o **comerciante** (dono/gestor do estabelecimento), a **equipe operacional** (quem atende, prepara e entrega) e o **cliente final** (quem compra). O que torna o SmartFood uma plataforma, e não um cardápio isolado, é que esses três públicos operam sobre a **mesma fonte de dados em tempo real** — um pedido feito pelo cliente no site aparece instantaneamente no painel da cozinha, que atualiza o estoque, que atualiza o que o próximo cliente vê disponível no cardápio, que gera o dado que alimenta o relatório do comerciante.

**Como o comerciante usa:** cadastra a empresa uma vez (identidade, horário, forma de entrega), monta o catálogo de produtos, e a partir daí passa a maior parte do tempo em dois lugares: o **painel de pedidos** (operação do dia a dia) e o **painel de indicadores** (decisão). Ele não precisa entender de tecnologia — o sistema é pensado para ser operado inteiramente pelo celular, sozinho, sem suporte técnico externo.

**Como o cliente compra:** entra na vitrine própria do estabelecimento (site, QR Code de mesa, ou link direto), monta o pedido, escolhe a forma de recebimento (entrega, retirada, consumo na mesa) e a forma de pagamento, acompanha o status em tempo real e, ao final, pode avaliar e voltar a comprar com poucos cliques a partir do histórico.

**Como a equipe trabalha:** cada papel operacional vê apenas o que precisa ver — quem prepara vê o pedido e o item, não o financeiro da loja; quem entrega vê o endereço e o status, não o cardápio inteiro. Isso é o que permite ao SmartFood atender desde um comerciante sozinho (ele acumula todos os papéis) até uma equipe de dez pessoas com funções bem separadas, sem trocar de sistema.

**Como as áreas se conectam:** o pedido é o evento central do sistema — praticamente todo módulo existe para produzir um pedido (Comercial, Marketing), processá-lo (Operacional, Pagamentos), cobrá-lo e contabilizá-lo (Financeiro), comunicar seu status (Central de Comunicação), aprender com ele (Relatórios, Inteligência Artificial) ou mantê-lo seguro, configurável e rastreável (Administração, Configuração da Loja, Ecossistema, e os módulos transversais de Arquivos/Auditoria/Lixeira). Essa centralidade do pedido é o princípio organizador de toda a arquitetura funcional deste documento — e permanece inalterada nesta revisão.

---

## 2. Estrutura Geral dos Módulos (por Domínio)

Cada módulo abaixo é descrito com: **Objetivo**, **Quem utiliza**, **Funcionalidades**, **Dependências** e **Prioridade** (MVP / v2.0 / v3.0 / Enterprise — fases definidas na Seção 8, alinhadas ao roadmap da Missão 0001).

> **Nota de revisão:** nesta rodada, quatro domínios novos foram criados (Experiência do Cliente, Central de Comunicação, Pagamentos, Configuração da Loja), um domínio foi renomeado e ampliado (Integrações → Ecossistema), e três módulos passaram a ser tratados como **transversais** (Gerenciamento de Arquivos, Auditoria, Lixeira) — usados por praticamente todos os domínios em vez de pertencerem a um só. Nenhum módulo foi removido; todos os que existiam na versão anterior foram realocados ou mantidos. O racional completo está na Seção 3.

### 2.1 COMERCIAL

| Módulo                         | Objetivo                                                               | Quem utiliza           | Funcionalidades                                                                                                    | Dependências                                           | Prioridade |
| ------------------------------ | ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------- |
| **Catálogo de Produtos**       | Cadastrar e organizar tudo que a loja vende                            | Administrador, Gerente | Categorias e subcategorias, variações (tamanho/sabor/complemento), preço, foto, disponibilidade (esgotado sim/não) | Configuração da Loja, Gerenciamento de Arquivos (foto) | MVP        |
| **Vitrine / Cardápio Público** | Exibir o catálogo para o cliente final de forma navegável              | Cliente, Visitante     | Busca, filtro por categoria, destaque de promoções, identidade visual da marca                                     | Catálogo de Produtos, Configuração da Loja             | MVP        |
| **Carrinho e Checkout**        | Converter navegação em pedido confirmado                               | Cliente                | Adição/remoção de item, escolha de entrega/retirada/mesa, escolha de endereço, escolha de pagamento, confirmação   | Vitrine, Catálogo, Endereços, Pagamentos               | MVP        |
| **Motor de Pedidos**           | Fonte única de verdade de todo pedido, independente do canal de origem | Sistema (transversal)  | Unifica pedido de site, QR Code de mesa, balcão e comanda em um único fluxo de status                              | Checkout                                               | MVP        |
| **QR Code de Mesa**            | Permitir pedido direto da mesa, sem intermediação de garçom            | Cliente, Operador      | Geração de QR por mesa, pedido vinculado à mesma base do delivery                                                  | Motor de Pedidos                                       | MVP        |
| **Comandas**                   | Organizar consumo de salão com múltiplos itens por mesa/cliente        | Operador, Supervisor   | Abertura/fechamento de comanda, divisão de conta, item por comensal                                                | Motor de Pedidos, QR Code de Mesa                      | v2.0       |
| **Assinatura / Recorrência**   | Suportar venda recorrente (ex: marmitaria semanal)                     | Cliente, Administrador | Definição de frequência, pedido automático recorrente, pausa/cancelamento pelo cliente                             | Motor de Pedidos, Catálogo                             | v2.0       |
| **Precificação Assistida**     | Ajudar o comerciante a precificar corretamente                         | Administrador          | Sugestão de preço considerando insumo, embalagem, taxa de entrega e comissão                                       | Catálogo, Relatórios, Configuração Inteligente         | v3.0       |

### 2.2 OPERACIONAL

| Módulo                                | Objetivo                                                   | Quem utiliza                  | Funcionalidades                                                                                     | Dependências                                          | Prioridade |
| ------------------------------------- | ---------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- |
| **Painel de Pedidos**                 | Central de operação em tempo real                          | Operador, Supervisor, Gerente | Fluxo de status (recebido → em preparo → pronto/saiu para entrega → concluído), impressão/expedição | Motor de Pedidos                                      | MVP        |
| **Disponibilidade e Estoque Simples** | Evitar venda de item indisponível                          | Operador, Administrador       | Marcar item como esgotado, reativação automática programada                                         | Catálogo                                              | MVP        |
| **Estoque de Insumo / Ficha Técnica** | Controlar o que compõe cada produto e alertar nível mínimo | Administrador, Gerente        | Ficha técnica por produto, baixa automática de insumo, alerta de nível mínimo                       | Catálogo, Painel de Pedidos                           | v2.0       |
| **Gestão de Entregadores**            | Organizar entrega própria (sem plataforma terceira)        | Supervisor, Operador          | Atribuição de entrega, status do entregador, roteirização simples                                   | Painel de Pedidos                                     | v2.0       |
| **Multiloja**                         | Administrar mais de uma unidade na mesma conta             | Administrador                 | Catálogo mestre com variação por unidade, painel consolidado                                        | Catálogo, Painel de Pedidos (validados em loja única) | v3.0       |

_Nota: Área de Entrega e Horário de Funcionamento saíram deste domínio e agora vivem em **Configuração da Loja** (Seção 2.8) — são parâmetros de identidade/regra da loja, não ações operacionais do dia a dia._

### 2.3 PAGAMENTOS _(novo domínio — separado de Financeiro)_

Responsável por **tudo que é transacional**: receber, autorizar, repassar e estornar dinheiro de um pedido específico. Distinto de Financeiro (Seção 2.4), que trata da **visão consolidada** do dinheiro da empresa ao longo do tempo.

| Módulo                              | Objetivo                                                                                         | Quem utiliza                  | Funcionalidades                                                          | Dependências                                        | Prioridade |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- | ---------- |
| **Processamento de Pagamento**      | Cobrar o cliente no fechamento do pedido                                                         | Cliente, Sistema              | Pix, cartão, dinheiro na entrega                                         | Carrinho e Checkout                                 | MVP        |
| **Status e Tentativas de Cobrança** | Garantir visibilidade de sucesso/falha de cobrança                                               | Sistema, Operador             | Estado da cobrança (pendente/aprovada/recusada), nova tentativa          | Processamento de Pagamento                          | MVP        |
| **Carteiras Digitais**              | Ampliar opções de pagamento do cliente                                                           | Cliente                       | Apple Pay, Google Pay, PicPay e afins                                    | Processamento de Pagamento                          | v2.0       |
| **Estornos e Reembolsos**           | Reverter cobrança quando o pedido é cancelado                                                    | Operador, Financeiro, Cliente | Fluxo de solicitação, aprovação, estorno pelo meio de pagamento original | Processamento de Pagamento                          | v2.0       |
| **Split de Pagamento**              | Repartir automaticamente o valor entre lojista, plataforma e terceiros (ex: entregador parceiro) | Sistema                       | Regra de divisão configurável por tipo de repasse                        | Processamento de Pagamento, Ecossistema (parceiros) | Enterprise |

### 2.4 FINANCEIRO _(redefinido — visão consolidada, não mais transacional)_

| Módulo                                       | Objetivo                                                                                     | Quem utiliza              | Funcionalidades                                                          | Dependências                                  | Prioridade |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- | ---------- |
| **Fechamento de Caixa**                      | Consolidar o resultado financeiro de um período operacional                                  | Operador, Financeiro      | Totais por forma de pagamento, conferência, abertura/fechamento de turno | Painel de Pedidos, Processamento de Pagamento | v2.0       |
| **Assinatura do Comerciante (Billing SaaS)** | Cobrar a mensalidade do próprio SmartFood                                                    | Administrador, Sistema    | Plano contratado, cobrança recorrente, histórico de fatura               | Configuração da Loja                          | MVP        |
| **Fluxo de Caixa**                           | Visão de entradas e saídas ao longo do tempo                                                 | Administrador, Financeiro | Projeção simples de saldo, filtro por período                            | Fechamento de Caixa                           | v2.0       |
| **Receitas e Despesas**                      | Registrar custo além do que passa pelo pedido (ex: aluguel, insumo comprado fora do sistema) | Financeiro                | Lançamento manual de receita/despesa avulsa, categorização               | Fluxo de Caixa                                | v3.0       |
| **DRE (Demonstrativo de Resultado)**         | Visão gerencial de lucro/prejuízo do período                                                 | Administrador, Financeiro | Consolidação de receita, custo e despesa em um demonstrativo simples     | Receitas e Despesas, Fluxo de Caixa           | Enterprise |
| **Central de Compras Consolidada**           | Negociar insumo entre unidades de uma mesma rede                                             | Administrador (rede)      | Compra consolidada entre lojas da mesma conta                            | Multiloja, Estoque de Insumo                  | Enterprise |

### 2.5 EXPERIÊNCIA DO CLIENTE _(novo domínio — consolida o que antes estava disperso)_

Centraliza tudo o que pertence à conta e à jornada pessoal do cliente final, hoje disperso entre Atendimento, Comercial e Configurações na versão anterior deste documento. Ver justificativa completa na Seção 3.

| Módulo                          | Objetivo                                                                 | Quem utiliza           | Funcionalidades                                                                                                      | Dependências                                    | Prioridade |
| ------------------------------- | ------------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| **Cadastro do Cliente Final**   | Guardar identidade e histórico do comprador                              | Cliente, Sistema       | Nome, telefone, e-mail, criado automaticamente no primeiro pedido                                                    | Checkout                                        | MVP        |
| **Login**                       | Autenticar o cliente em visitas futuras                                  | Cliente                | Entrada por telefone/e-mail, sessão persistente                                                                      | Cadastro do Cliente Final                       | MVP        |
| **Perfil**                      | Permitir ao cliente ver e editar seus próprios dados                     | Cliente                | Edição de nome/telefone/e-mail, preferências                                                                         | Login                                           | MVP        |
| **Endereços**                   | Ver Módulo de Endereços (Seção 2.6) — módulo dedicado, referenciado aqui | Cliente                | —                                                                                                                    | —                                               | MVP        |
| **Métodos de Pagamento Salvos** | Agilizar checkouts futuros                                               | Cliente                | Salvar cartão/carteira digital preferida (dado sensível tratado pelo domínio Pagamentos, nunca armazenado fora dele) | Login, Processamento de Pagamento               | v2.0       |
| **Favoritos**                   | Permitir salvar produtos/lojas preferidos                                | Cliente                | Marcar produto ou loja como favorito, acesso rápido                                                                  | Login, Catálogo                                 | v2.0       |
| **Histórico e Recompra**        | Permitir comprar de novo com poucos cliques                              | Cliente                | Lista de pedidos anteriores, repetir pedido                                                                          | Cadastro do Cliente Final, Motor de Pedidos     | MVP        |
| **Avaliação Pós-Pedido**        | Capturar satisfação e gerar prova social                                 | Cliente, Administrador | Nota e comentário, resposta pública do lojista                                                                       | Motor de Pedidos concluído                      | v2.0       |
| **Fidelidade**                  | Recompensar recorrência                                                  | Cliente, Administrador | Pontos/recompensas vinculados à conta do cliente, níveis                                                             | Cadastro do Cliente Final, Histórico de Pedidos | v2.0       |
| **Suporte / Chat**              | Resolver dúvida ou problema do cliente com o pedido                      | Cliente, Operador      | Canal de mensagem vinculado ao pedido                                                                                | Motor de Pedidos, Central de Comunicação        | v3.0       |

### 2.6 MÓDULO DE ENDEREÇOS _(novo — desenhado para reuso)_

| Módulo        | Objetivo                                                                                             | Quem utiliza | Funcionalidades                                                                                                                                  | Dependências                   | Prioridade |
| ------------- | ---------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ---------- |
| **Endereços** | Permitir múltiplos endereços por cliente, reutilizáveis em qualquer fluxo que precise de localização | Cliente      | Cadastro de múltiplos endereços rotulados (Casa, Trabalho, Empresa, Condomínio, Outro), definição de endereço padrão, seleção rápida no checkout | Login (Experiência do Cliente) | MVP        |

Este módulo é desenhado desde já como **peça reutilizável**, não amarrada só ao checkout — é a mesma estrutura de dado que Área de Entrega (Configuração da Loja) usa para calcular cobertura, que uma futura funcionalidade de "presente para terceiro" (Missão 0001, Funcionalidades Futuras) usaria para endereço de entrega diferente do próprio cliente, e que a Gestão de Entregadores usaria para roteirização.

### 2.7 CENTRAL DE COMUNICAÇÃO _(novo domínio)_

Ponto único por onde toda mensagem sai do SmartFood — para o cliente, para a equipe, ou futuramente disparada por um agente de IA. Substitui e consolida três pontos antes dispersos: notificação de status de pedido, canais de notificação configuráveis e notificação externa de integração.

| Módulo                                    | Objetivo                                              | Quem utiliza                        | Funcionalidades                                                              | Dependências                              | Prioridade |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- | ---------- |
| **Canais de Envio (WhatsApp/E-mail/SMS)** | Levar mensagem transacional até o cliente ou a equipe | Sistema                             | Envio de confirmação de pedido, mudança de status, confirmação de cadastro   | Configuração da Loja (canais habilitados) | MVP        |
| **Notificações Internas**                 | Avisar a equipe dentro do próprio painel              | Operador, Supervisor, Administrador | Alerta de novo pedido, alerta de estoque baixo, alerta de avaliação recebida | Painel de Pedidos                         | MVP        |
| **Push**                                  | Notificação nativa fora do navegador/app aberto       | Cliente                             | Aviso de status sem precisar estar com a página aberta                       | Canais de Envio                           | v2.0       |
| **Histórico de Comunicações**             | Rastrear o que foi enviado, quando e para quem        | Administrador, Auditoria            | Log de toda mensagem disparada pela plataforma                               | Canais de Envio, Auditoria                | MVP        |

**Preparação futura:** este domínio é o ponto de integração natural para os **Agentes** do [Smart AI Guide](../../../Smart%20Platform/SMART_AI_GUIDE_v1.0.md) — quando a camada de Automação/Agentes amadurecer (Configuração Inteligente, Seção 2.12), ela dispara mensagem através deste mesmo domínio, em vez de criar um canal de envio próprio.

### 2.8 CONFIGURAÇÃO DA LOJA _(novo domínio — identidade completa da empresa)_

Consolida tudo que antes estava disperso entre "Configurações Gerais", "Identidade Visual da Vitrine" (Marketing), "Área de Entrega" e "Horário de Funcionamento" (Operacional), e "Domínio Próprio" (Administração).

| Módulo                           | Objetivo                                            | Quem utiliza  | Funcionalidades                                                                                     | Dependências                                     | Prioridade                                           |
| -------------------------------- | --------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **Identidade Visual**            | Personalizar a marca dentro do padrão da plataforma | Administrador | Logo, banner, cores, fotos de destaque                                                              | Onboarding da Empresa, Gerenciamento de Arquivos | MVP                                                  |
| **Horário de Funcionamento**     | Controlar quando a loja aceita pedido               | Administrador | Configuração de horário, pausa manual, pausa automática por sobrecarga (ver Seção 13, regra global) | Onboarding da Empresa                            | MVP                                                  |
| **Entrega e Retirada**           | Definir onde, como e por quanto a loja atende       | Administrador | Raio ou bairro de cobertura, taxa por área, tempo estimado, opção de retirada no balcão             | Onboarding da Empresa                            | MVP                                                  |
| **Domínio Próprio**              | Elevar a vitrine de subdomínio para domínio próprio | Administrador | Configuração de domínio `.com.br` próprio                                                           | Onboarding da Empresa                            | v2.0                                                 |
| **Métodos de Pagamento Aceitos** | Definir o que a loja aceita receber                 | Administrador | Ativar/desativar Pix, cartão, dinheiro, carteiras digitais                                          | Processamento de Pagamento                       | MVP                                                  |
| **Redes Sociais**                | Exibir presença digital da loja na vitrine          | Administrador | Links de Instagram/Facebook/WhatsApp exibidos publicamente                                          | Identidade Visual                                | v2.0                                                 |
| **Dados Fiscais**                | Registrar dados formais da empresa                  | Administrador | Razão social, CNPJ/CPF, endereço fiscal                                                             | Onboarding da Empresa                            | MVP (básico) / Enterprise (completo, ligado a NFC-e) |
| **Contato**                      | Canal público de contato da loja                    | Administrador | Telefone/WhatsApp de atendimento exibido na vitrine                                                 | Central de Comunicação                           | MVP                                                  |
| **Chave PIX de Recebimento**     | Dado cadastral usado pelo domínio Pagamentos        | Administrador | Cadastro da chave PIX de destino                                                                    | Onboarding da Empresa                            | MVP                                                  |

_Nota de nomenclatura: "Tema" aqui significa a identidade visual pública da loja (cores/marca), diferente de "Preferências do Painel" (Seção 2.9), que é o tema claro/escuro da tela interna de quem opera o sistema — são dois conceitos de "tema" que a Linguagem Ubíqua (Seção 15) mantém deliberadamente separados para não confundir documentação futura._

### 2.9 ADMINISTRAÇÃO

| Módulo                                | Objetivo                                                | Quem utiliza            | Funcionalidades                                                                                     | Dependências                  | Prioridade |
| ------------------------------------- | ------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------- | ---------- |
| **Onboarding da Empresa**             | Colocar a loja no ar                                    | Administrador           | Cadastro de empresa, categoria, subdomínio/vitrine inicial                                          | — (ponto de entrada)          | MVP        |
| **Gestão de Usuários e Papéis**       | Controlar quem acessa o quê dentro da equipe            | Administrador           | Convite de usuário, atribuição de papel (ver Smart Security Guide e Matriz de Permissões, Seção 14) | Onboarding da Empresa         | MVP        |
| **Preferências do Painel**            | Ajuste de conforto de quem opera o sistema internamente | Administrador, Operador | Tema claro/escuro/automático da tela interna (distinto do tema da vitrine)                          | —                             | v2.0       |
| **Gestão Multiloja (Administrativa)** | Administrar permissões e usuários entre unidades        | Administrador (rede)    | Papel por unidade, visão consolidada de equipe                                                      | Multiloja, Gestão de Usuários | v3.0       |

### 2.10 MARKETING

| Módulo                          | Objetivo                                             | Quem utiliza           | Funcionalidades                                                    | Dependências                                   | Prioridade        |
| ------------------------------- | ---------------------------------------------------- | ---------------------- | ------------------------------------------------------------------ | ---------------------------------------------- | ----------------- |
| **Cupons e Promoções**          | Incentivar conversão e recorrência                   | Administrador, Cliente | Cupom por código, desconto por produto/combo, validade             | Catálogo, Motor de Pedidos                     | v2.0              |
| **Recomendação de Combos (IA)** | Sugerir combinação de produtos com base em histórico | Administrador, Cliente | Sugestão automática de combo/promoção                              | Relatórios, Configuração Inteligente           | v3.0              |
| **Campanha de Recuperação**     | Reengajar cliente inativo ou carrinho abandonado     | Administrador, Sistema | Disparo automático de mensagem para cliente inativo                | Experiência do Cliente, Central de Comunicação | v3.0              |
| **Programa de Indicação**       | Gerar aquisição via cliente atual                    | Cliente, Administrador | Código de indicação, recompensa para quem indica e quem é indicado | Fidelidade                                     | Futuro (pós-v3.0) |

### 2.11 RELATÓRIOS

_Domínio de leitura operacional/comercial do passado — distinto de Financeiro (Seção 2.4), que é a leitura contábil do dinheiro._

| Módulo                                | Objetivo                             | Quem utiliza                       | Funcionalidades                                    | Dependências                                   | Prioridade |
| ------------------------------------- | ------------------------------------ | ---------------------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------- |
| **Dashboard de Indicadores**          | Leitura rápida do dia a dia          | Administrador, Gerente             | Pedidos do dia, ticket médio, produto mais vendido | Motor de Pedidos                               | MVP        |
| **Relatórios de Vendas por Período**  | Entender tendência ao longo do tempo | Administrador, Gerente, Financeiro | Comparação semana a semana, produtos parados       | Dashboard de Indicadores (dados acumulados)    | v2.0       |
| **Relatórios Comparativos Multiloja** | Comparar performance entre unidades  | Administrador (rede)               | Ranking de loja, produto por loja                  | Multiloja                                      | v3.0       |
| **Previsão de Demanda (IA)**          | Apoiar decisão de compra de insumo   | Administrador                      | Estimativa de pedidos esperados por dia/período    | Relatórios de Vendas, Configuração Inteligente | v3.0       |

### 2.12 INTELIGÊNCIA ARTIFICIAL

Organizada pelas camadas do [Smart AI Guide](../../../Smart%20Platform/SMART_AI_GUIDE_v1.0.md) — nenhuma camada avançada entra sem a anterior estar validada em uso real.

| Módulo                           | Objetivo                                                                                                | Quem utiliza  | Camada (Smart AI Guide)        | Dependências                                   | Prioridade |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------ | ---------------------------------------------- | ---------- |
| **Configuração Inteligente**     | Hub central que reúne sugestões, automações, regras inteligentes, assistentes e agentes ativos na conta | Administrador | Transversal a todas as camadas | Todos os módulos de IA abaixo                  | v3.0       |
| **Onboarding Assistido por IA**  | Acelerar o cadastro inicial do catálogo                                                                 | Administrador | Chat                           | Onboarding da Empresa                          | v2.0       |
| **Recomendação de Combos/Preço** | Sugerir ação comercial                                                                                  | Administrador | Recomendação                   | Relatórios, volume mínimo                      | v3.0       |
| **Previsão de Demanda**          | Apoiar decisão de compra                                                                                | Administrador | Análise / Recomendação         | Relatórios de Vendas                           | v3.0       |
| **Painel de Comparação Anônima** | Mostrar como a loja performa frente à média do setor                                                    | Administrador | Análise                        | Relatórios, base agregada de múltiplos tenants | Enterprise |

### 2.13 ECOSSISTEMA _(renomeado e ampliado — antes "Integrações")_

Representa toda extensão da plataforma para além do que o SmartFood entrega nativamente — de API pública a parceiros externos.

| Módulo                                       | Objetivo                                                        | Quem utiliza                          | Funcionalidades                                        | Dependências                                              | Prioridade                           |
| -------------------------------------------- | --------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------ |
| **API Pública**                              | Permitir integração externa (contabilidade, marketing)          | Desenvolvedor terceiro, Administrador | Acesso programático a dados do próprio tenant          | Motor de Pedidos, Catálogo maduros                        | v3.0                                 |
| **Webhooks**                                 | Notificar sistemas externos em tempo real sobre eventos da loja | Desenvolvedor terceiro                | Inscrição em Eventos do Sistema (Seção 12)             | API Pública                                               | v3.0                                 |
| **Marketplace de Aplicativos**               | Permitir que parceiros ofereçam extensões ao lojista            | Administrador                         | Vitrine de plugins/apps compatíveis com o SmartFood    | API Pública                                               | Enterprise                           |
| **Plugins**                                  | Estender funcionalidade sem alterar o núcleo da plataforma      | Administrador                         | Ativação/configuração de extensão de terceiro          | Marketplace de Aplicativos                                | Enterprise                           |
| **Parceiros**                                | Gerenciar relação com fornecedores/parceiros de negócio         | Administrador                         | Cadastro de parceiro, termos de integração             | API Pública                                               | Enterprise                           |
| **Sincronização com Marketplaces de Pedido** | Importar pedido de canais externos (ex: iFood)                  | Sistema                               | Sincronização de pedido externo com o Motor de Pedidos | API Pública, Motor de Pedidos                             | Futuro (depende de parceria externa) |
| **Fiscal (NFC-e)**                           | Emitir nota fiscal quando exigido                               | Sistema, Financeiro                   | Emissão simplificada vinculada ao pedido               | Dados Fiscais (Configuração da Loja), Fechamento de Caixa | Enterprise                           |

_Nota de nomenclatura: o antigo módulo "Marketplaces Terceiros" foi renomeado para "Sincronização com Marketplaces de Pedido" para não ser confundido com o novo "Marketplace de Aplicativos" (loja de plugins) — são conceitos diferentes que usavam o mesmo nome na versão anterior. Ver Seção 15._

### 2.14 MÓDULOS TRANSVERSAIS _(novo — não pertencem a um único domínio)_

Diferente dos demais, estes três módulos não respondem a uma pergunta de um público específico — são infraestrutura funcional usada por praticamente todo domínio acima. Por isso não viraram "domínios" novos (o que inflaria a lista de dez para treze sem necessidade): eles são **serviços de plataforma**, chamados a partir de qualquer módulo que precise deles.

| Módulo                        | Objetivo                                        | Quem utiliza           | Funcionalidades                                                                                                       | Usado por (exemplos)                                   | Prioridade |
| ----------------------------- | ----------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| **Gerenciamento de Arquivos** | Guardar e servir qualquer arquivo da plataforma | Sistema, Administrador | Upload/armazenamento de fotos, logos, banners, PDFs de cardápio, documentos                                           | Catálogo, Configuração da Loja, Central de Comunicação | MVP        |
| **Auditoria**                 | Registrar quem fez o quê, quando                | Sistema, Administrador | Log de alteração de preço, cancelamento, exclusão de produto, mudança de configuração/permissão, alteração de estoque | Todos os domínios com ação sensível                    | MVP        |
| **Lixeira**                   | Evitar exclusão definitiva acidental            | Sistema, Administrador | Exclusão reversível por período configurável antes de remoção definitiva                                              | Catálogo, Cupons, Usuários e qualquer registro crítico | v2.0       |

---

## 3. Por que Organizar os Módulos Nesses Domínios

A divisão em domínios não é arbitrária — cada domínio corresponde a uma **pergunta que alguém dentro do negócio do lojista precisa responder**, e a um **papel diferente** que consome aquela resposta. Nesta revisão, a lista cresceu de dez para treze domínios funcionais mais uma categoria de módulos transversais:

```
COMERCIAL                 → "O que eu vendo e como o pedido é feito?"          (dono, cliente)
OPERACIONAL               → "Como esse pedido vira produto entregue?"          (equipe operacional)
PAGAMENTOS                → "Como eu recebo o dinheiro deste pedido?"          (sistema, cliente)
FINANCEIRO                → "Quanto entrou e quanto eu devo, ao longo do
                              tempo?"                                          (financeiro, dono)
EXPERIÊNCIA DO CLIENTE     → "Quem é esse cliente e o que ele já fez comigo?"   (cliente)
CENTRAL DE COMUNICAÇÃO     → "Como eu falo com quem precisa saber de algo?"     (sistema, cliente, equipe)
CONFIGURAÇÃO DA LOJA        → "Quem essa empresa é e como ela se apresenta?"    (dono)
ADMINISTRAÇÃO               → "Quem pode fazer o quê dentro da minha loja?"     (dono, rede)
MARKETING                   → "Como eu vendo mais para quem já é meu cliente
                                e para quem ainda não é?"                       (dono)
RELATÓRIOS                  → "O que os dados do passado estão me dizendo?"     (dono, gerente)
INTELIGÊNCIA ARTIFICIAL      → "O que o sistema pode decidir/sugerir por mim?"   (dono)
ECOSSISTEMA                  → "Como o SmartFood se conecta com o resto do
                                 mundo e cresce além do que eu construí?"       (sistema, terceiros)

Módulos transversais (Arquivos, Auditoria, Lixeira) → "infraestrutura que
qualquer domínio acima usa, sem pertencer a nenhum sozinho"
```

**Por que separar Pagamentos de Financeiro:** a versão anterior misturava "processar a cobrança de um pedido específico" com "entender o resultado financeiro da empresa ao longo do tempo" no mesmo domínio. São ritmos e responsáveis diferentes — Pagamentos é evento por evento, em tempo real, e frequentemente responsabilidade do próprio fluxo de checkout; Financeiro é consolidação periódica, responsabilidade de quem cuida da saúde do negócio. Separar os dois evita que uma decisão sobre gateway de pagamento (Pagamentos) fique acoplada a uma decisão sobre como fechar o caixa do mês (Financeiro).

**Por que criar Experiência do Cliente:** login, perfil, endereços, favoritos, histórico e fidelidade pertencem à mesma pessoa e deveriam evoluir juntos — antes estavam espalhados entre Atendimento, Comercial e Configurações, o que tornava fácil esquecer uma dessas peças ao planejar uma tela nova do cliente. Centralizar aqui também facilita raciocinar sobre LGPD/dado pessoal no futuro: é um único domínio a auditar.

**Por que criar Central de Comunicação:** notificação de pedido, canal de contato e notificação de integração eram três pontos diferentes fazendo, na prática, a mesma coisa (mandar mensagem). Unificados, ganham histórico único, e — mais importante para o futuro — um único lugar por onde um Agente de IA (Smart AI Guide) manda mensagem, em vez de cada funcionalidade nova reinventar seu próprio canal de envio.

**Por que criar Configuração da Loja:** identidade visual, horário, área de entrega e domínio próprio são, na prática, a mesma pergunta respondida em pedaços ("quem é essa empresa e como ela opera") — hoje estavam em três domínios diferentes (Marketing, Operacional, Administração), o que forçava o comerciante a "caçar" onde configurar cada coisa.

**Por que renomear Integrações para Ecossistema:** "Integrações" sugeria só conexão técnica ponto a ponto; "Ecossistema" comunica a ambição real do domínio — parceiros, marketplace de aplicativos, webhooks — que é maior que uma lista de integrações.

**Por que Arquivos/Auditoria/Lixeira não são domínios, e sim módulos transversais:** eles não respondem a uma pergunta de um público específico do negócio (a pergunta de "onde fica meu arquivo" não é do dono nem do cliente — é uma necessidade de qualquer módulo que lide com imagem ou documento). Tratá-los como serviço de plataforma, chamável por qualquer domínio, evita duplicar a mesma capacidade em três lugares diferentes — exatamente o problema que a criação da Central de Comunicação já resolveu para mensagens.

Esta divisão continua evitando os dois erros identificados na versão anterior deste documento: (1) misturar "o que a loja vende" com "como a loja opera" no mesmo módulo; e (2) tratar Relatórios (descrição do passado) e Inteligência Artificial (sugestão de ação futura) como o mesmo domínio.

---

## 4. Jornada Completa do Comerciante

1. **Descoberta e cadastro.** O comerciante acessa o SmartFood, cria a conta e informa dados básicos da empresa (nome, categoria de negócio, telefone) — módulo Onboarding da Empresa.
2. **Configuração inicial.** Define horário de funcionamento, área de entrega e taxa, métodos de pagamento aceitos, dados fiscais básicos e chave PIX — todos reunidos em Configuração da Loja.
3. **Identidade visual.** Sobe logo, escolhe cor de marca, opcionalmente banner de destaque (Configuração da Loja + Gerenciamento de Arquivos) — a vitrine já nasce com a cara do negócio, não genérica.
4. **Montagem do catálogo.** Cadastra categorias e produtos (nome, preço, foto, variação) — pode fazer manualmente ou, na v2.0, via onboarding assistido por IA a partir de fotos do cardápio físico.
5. **Configuração de equipe.** Convida funcionários e atribui papel (quem vê o painel de pedidos, quem vê o financeiro) — Gestão de Usuários e Papéis.
6. **Publicação da vitrine.** A loja fica visível publicamente no endereço próprio (subdomínio inicialmente, domínio próprio a partir da v2.0).
7. **Divulgação.** O comerciante compartilha o link da vitrine (redes sociais, WhatsApp, QR Code impresso na mesa/balcão).
8. **Primeira venda.** Um cliente faz o primeiro pedido; o comerciante recebe a notificação no painel de pedidos (via Central de Comunicação — notificação interna).
9. **Operação do dia a dia.** Ciclo diário se repete: pedido chega → equipe prepara → status é atualizado → pedido é concluído → dado alimenta o dashboard.
10. **Leitura de resultado.** Ao final do dia/semana, o comerciante consulta o dashboard (Relatórios) para decidir; ao final do mês, consulta Financeiro para entender o resultado consolidado.
11. **Evolução natural.** Conforme o negócio cresce, o comerciante ativa módulos de fases posteriores (fidelidade, comandas, multiloja, Configuração Inteligente) sem precisar migrar de sistema.

---

## 5. Jornada Completa do Cliente Final

1. **Entrada.** Cliente chega à vitrine por link direto, QR Code de mesa, ou busca/indicação — sem necessidade de baixar aplicativo.
2. **Navegação.** Vê categorias, busca produto, lê descrição e vê disponibilidade em tempo real; se logado, pode navegar direto aos Favoritos.
3. **Carrinho.** Adiciona itens, escolhe variação (tamanho, sabor, complemento), ajusta quantidade.
4. **Escolha do modo de recebimento.** Define entrega (seleciona um endereço salvo ou cadastra um novo — módulo Endereços), retirada, ou — se estiver na mesa via QR Code — consumo no local vinculado à comanda.
5. **Pagamento.** Escolhe entre os métodos habilitados pela loja (Pix, cartão, dinheiro na entrega, ou método salvo a partir da v2.0) e confirma o pedido.
6. **Confirmação.** Recebe confirmação imediata com número/identificação do pedido, via Central de Comunicação.
7. **Acompanhamento.** Vê o status evoluir em tempo real: confirmado → em preparo → pronto/saiu para entrega → concluído, com notificação automática a cada mudança.
8. **Recebimento.** Recebe o pedido em casa, retira no balcão, ou é atendido na mesa.
9. **Avaliação.** Pode avaliar a experiência (nota + comentário) após a conclusão — a partir da v2.0.
10. **Fidelização.** Pontos/recompensas são creditados automaticamente à conta do cliente (v2.0); histórico de pedido fica salvo para recompra em um clique.
11. **Recompra.** Na próxima visita, o cliente repete um pedido anterior com poucos toques, sem remontar o carrinho do zero — ou acessa seu Perfil para gerenciar dados, endereços e métodos salvos a qualquer momento.

---

## 6. Fluxos Operacionais Detalhados

### 6.1 Cadastro da Empresa

1. Comerciante informa dados básicos → 2. Define categoria de negócio (isso pré-configura sugestões de categoria de catálogo) → 3. Confirma e-mail/telefone → 4. Sistema cria o espaço (tenant) isolado do comerciante → 5. Comerciante é direcionado ao checklist de Configuração da Loja (horário, entrega, catálogo).

### 6.2 Cadastro de Produtos

1. Comerciante cria categoria → 2. Adiciona produto (nome, descrição, preço, foto via Gerenciamento de Arquivos) → 3. Define variações, se houver (tamanho/sabor/complemento) → 4. Define disponibilidade → 5. Produto passa a aparecer na vitrine imediatamente (sem etapa de "publicação" separada, para reduzir fricção).

### 6.3 Recebimento do Pedido

1. Cliente confirma pedido no checkout → 2. Motor de Pedidos registra o pedido com status "recebido" → 3. Painel de Pedidos da equipe é notificado em tempo real (Central de Comunicação — notificação interna) → 4. Operador aceita o pedido (ou o sistema aceita automaticamente, conforme configuração da loja) → 5. Status muda para "em preparo", cliente é notificado.

### 6.4 Preparação

1. Item aparece no painel operacional (cozinha/produção) → 2. Equipe prepara → 3. Item é marcado como pronto → 4. Se for entrega, pedido segue para etapa de despacho; se for retirada/mesa, aguarda o cliente/garçom.

### 6.5 Entrega

1. Pedido pronto é atribuído a um entregador (próprio, a partir da v2.0, ou informação repassada manualmente no MVP) → 2. Status muda para "saiu para entrega", cliente é notificado → 3. Entregador confirma entrega → 4. Status muda para "concluído".

### 6.6 Cancelamento

1. Cliente ou operador solicita cancelamento → 2. Sistema verifica em que status o pedido está (cancelamento antes do preparo é direto; depois do preparo iniciado requer decisão do operador) → 3. Se pagamento já foi processado, cancelamento aciona o fluxo de Estornos e Reembolsos (domínio Pagamentos) → 4. Pedido é marcado como "cancelado" (registrado em Auditoria) e não entra nas métricas de venda concluída, mas fica registrado para análise.

### 6.7 Reembolso

1. Cancelamento com pagamento já processado aciona solicitação de estorno → 2. Operador/Financeiro confirma o motivo → 3. Estorno é processado pelo meio de pagamento original (domínio Pagamentos) → 4. Cliente é notificado da conclusão do reembolso via Central de Comunicação.

### 6.8 Fechamento de Caixa

1. Ao fim do turno/dia, operador ou financeiro abre o resumo do período → 2. Sistema consolida total por forma de pagamento a partir dos pedidos concluídos (dados vindos do domínio Pagamentos) → 3. Responsável confere valores físicos (dinheiro) contra o total do sistema → 4. Fechamento é registrado (domínio Financeiro), ficando disponível para relatório financeiro futuro (Fluxo de Caixa, DRE).

### 6.9 Exclusão de Registro Crítico _(novo — decorrente do módulo Lixeira)_

1. Usuário solicita exclusão de um registro crítico (produto, categoria, usuário, cupom) → 2. Sistema move o registro para a Lixeira em vez de apagar definitivamente → 3. Ação é registrada em Auditoria (quem excluiu, quando) → 4. Registro fica recuperável por um período configurável → 5. Após o período, remoção definitiva automática, ou remoção manual antecipada por um Administrador.

---

## 7. Dependência entre Módulos

Princípio geral, mantido da versão anterior: **nenhum módulo de camada superior (Marketing, IA avançada, Multiloja) pode ser construído antes de o módulo de base (Catálogo, Motor de Pedidos) estar validado em uso real.** Esta revisão adiciona os novos módulos de fundação (Endereços, Central de Comunicação, Configuração da Loja, Pagamentos, módulos transversais) à camada mais inicial do mapa, pois vários outros módulos do MVP dependem deles.

```
Onboarding da Empresa
   ├── Configuração da Loja ──────────────────────────┐
   ├── Gerenciamento de Arquivos (transversal)          │
   └── Central de Comunicação ─────────────────────────┤
                                                         │
   Catálogo de Produtos (depende de Config. da Loja      │
   e Gerenciamento de Arquivos)                          │
         └── Vitrine / Cardápio Público                  │
               └── Endereços (independe do catálogo,      │
                    depende só de Login)                  │
               └── Carrinho e Checkout (depende de         │
                    Vitrine + Endereços + Pagamentos)       │
                     └── Processamento de Pagamento         │
                     └── Motor de Pedidos ──────────────────┘
                           ├── Painel de Pedidos
                           ├── QR Code de Mesa
                           ├── Cadastro do Cliente Final → Login → Perfil
                           └── Notificação de status (via Central de Comunicação)

   (a partir daqui, dependem de Motor de Pedidos já em operação real)
         ┌─────────────────────────────────────────────────────┐
         │  Comandas · Assinatura/Recorrência · Estoque de       │
         │  Insumo · Fidelidade · Avaliação · Cupons ·           │
         │  Fechamento de Caixa · Estornos e Reembolsos ·        │
         │  Domínio Próprio · Favoritos · Métodos de Pagamento    │
         │  Salvos · Lixeira                                      │
         └─────────────────────────────────────────────────────┘

   (dependem de histórico de dados acumulado)
         ┌─────────────────────────────────────────────────────┐
         │  Relatórios de Vendas por Período · Fluxo de Caixa ·  │
         │  Recomendação de Combos (IA) · Previsão de Demanda    │
         │  (IA) · Precificação Assistida · Configuração          │
         │  Inteligente                                            │
         └─────────────────────────────────────────────────────┘

   (depende de um tenant já maduro em loja única)
         ┌─────────────────────────────────────────────────────┐
         │  Multiloja · Relatórios Comparativos Multiloja ·      │
         │  Receitas e Despesas · DRE · Central de Compras       │
         │  Consolidada · Split de Pagamento · Ecossistema        │
         │  (API/Webhooks/Marketplace/Plugins/Parceiros)          │
         └─────────────────────────────────────────────────────┘

   Auditoria (transversal) acompanha, desde o início, qualquer
   módulo acima que registre ação sensível — não é uma camada
   posterior, é uma capacidade ativa desde o primeiro módulo do MVP.
```

Regras derivadas deste mapa:

- **Motor de Pedidos continua sendo o módulo mais crítico do sistema** — todo o resto depende dele direta ou indiretamente. Essa conclusão da versão anterior não muda.
- **Configuração da Loja e Gerenciamento de Arquivos agora são pré-requisito explícito de Catálogo** — antes essa dependência existia implicitamente (via Onboarding da Empresa), agora está nomeada, porque Catálogo precisa de identidade visual (para foto de produto) e configuração básica antes de fazer sentido publicar qualquer coisa.
- **Auditoria não é uma fase — é transversal desde o primeiro módulo do MVP.** Diferente dos demais módulos, ela não "espera" nada para começar a existir; qualquer módulo que registre uma ação sensível já nasce falando com Auditoria.
- **IA nunca é o segundo módulo construído.** Precisa de Relatórios (que precisa de Motor de Pedidos com histórico real) antes de ter dado suficiente para gerar recomendação confiável — inalterado.
- **Multiloja não é um "modo" ativado cedo.** Só faz sentido depois que o modelo de loja única está validado — inalterado.

---

## 8. Ordem Ideal de Desenvolvimento

### FASE 1 — Fundação Comercial e Operacional

Onboarding da Empresa, Configuração da Loja (identidade visual, horário, entrega/retirada, métodos de pagamento aceitos, dados fiscais básicos, contato, chave PIX), Gerenciamento de Arquivos (básico), Catálogo de Produtos, Vitrine, Endereços, Carrinho e Checkout, Processamento de Pagamento, Status e Tentativas de Cobrança, Motor de Pedidos, Painel de Pedidos, QR Code de Mesa, Cadastro do Cliente Final, Login, Perfil, Central de Comunicação (canais transacionais + notificações internas), Disponibilidade Simples, Gestão de Usuários e Papéis, Auditoria (ações críticas), Dashboard de Indicadores, Assinatura do Comerciante (billing).

_Motivo:_ é o conjunto mínimo que fecha o ciclo completo "cliente compra → loja opera → comerciante vê resultado". Sem isso, não existe produto vendável — corresponde ao MVP comercial da Missão 0001, agora com os módulos de fundação (identidade, comunicação, endereço, auditoria básica) explícitos em vez de implícitos.

### FASE 2 — Fidelização e Profundidade Operacional

Comandas, Assinatura/Recorrência, Estoque de Insumo/Ficha Técnica, Gestão de Entregadores, Fechamento de Caixa, Estornos e Reembolsos, Carteiras Digitais, Avaliação Pós-Pedido, Fidelidade, Favoritos, Métodos de Pagamento Salvos, Cupons e Promoções, Domínio Próprio, Redes Sociais, Push, Onboarding Assistido por IA, Relatórios de Vendas por Período, Fluxo de Caixa, Preferências do Painel, Lixeira.

_Motivo:_ ataca a segunda camada de dor — recorrência de cliente e profundidade de operação de salão/financeira — só depois que o comerciante já confia no canal de pedido da Fase 1.

### FASE 3 — Multiloja e Inteligência

Multiloja, Relatórios Comparativos Multiloja, Recomendação de Combos (IA), Previsão de Demanda (IA), Precificação Assistida, Configuração Inteligente, Campanha de Recuperação, Receitas e Despesas, API Pública, Webhooks, Suporte/Chat.

_Motivo:_ exige, respectivamente, um comerciante que já cresceu (validando o produto desde a Fase 1) e uma base histórica de dados que só existe depois de tempo real de operação — não faz sentido antecipar.

### FASE 4 — Enterprise

Central de Compras Consolidada, DRE, Split de Pagamento, Painel de Comparação Anônima (IA), Fiscal (NFC-e), Sincronização com Marketplaces de Pedido, Marketplace de Aplicativos, Plugins, Parceiros, Gestão Multiloja Administrativa avançada.

_Motivo:_ topo natural da pirâmide de upsell — só se sustenta com base relevante de contas médias migrando organicamente para redes maiores.

---

## 9. Funcionalidades do MVP

Critério de corte inalterado: **resolver por completo a jornada "cliente compra → loja opera → comerciante vê resultado" para uma loja única**, nada além disso. A lista cresce nesta revisão porque módulos de fundação que antes eram implícitos agora estão nomeados — não porque o escopo do MVP ficou mais ambicioso.

| Funcionalidade                                                                                                            | Justificativa                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding autosserviço da empresa                                                                                        | Porta de entrada — sem isso não existe produto                                                                                           |
| Configuração da Loja completa (identidade, horário, entrega, pagamento aceito, dados fiscais básicos, contato, chave PIX) | Parâmetros mínimos para a loja operar sem erro grosseiro e já nascer com identidade própria                                              |
| Catálogo com categorias, variações e disponibilidade                                                                      | Núcleo do que a loja vende                                                                                                               |
| Vitrine pública personalizável                                                                                            | Entrega a promessa central de "loja própria" desde o dia um                                                                              |
| Login, Perfil e Endereços do cliente                                                                                      | Sem endereço reutilizável, todo pedido de entrega exige redigitação — fricção desnecessária já no MVP                                    |
| Carrinho, checkout e pagamento (Pix/cartão/dinheiro) com status de cobrança                                               | Sem isso não há venda — é o coração da proposta "sem comissão"                                                                           |
| Motor de Pedidos unificado (site + QR Code de mesa)                                                                       | Resolve a fragmentação de canais, a dor #1 do mercado (Missão 0001)                                                                      |
| Painel de Pedidos em tempo real                                                                                           | Substitui diretamente o caos de WhatsApp/comanda de papel                                                                                |
| Cadastro automático de cliente + notificação de status via Central de Comunicação                                         | Devolve ao comerciante a posse do dado do cliente; eleva a experiência ao nível de marketplaces grandes                                  |
| Gestão de usuários e papéis (básica)                                                                                      | Mesmo uma loja pequena já tem dono + pelo menos um funcionário operando o painel                                                         |
| Auditoria de ações críticas (cancelamento, exclusão, alteração de preço/configuração)                                     | Rastreabilidade mínima desde o início evita retrabalho de "instrumentar depois"; base necessária para qualquer cliente Enterprise futuro |
| Gerenciamento de Arquivos básico (upload de foto/logo)                                                                    | Pré-requisito direto de Catálogo e Configuração da Loja                                                                                  |
| Dashboard de indicadores básicos                                                                                          | Entrega valor percebido imediato sem exigir módulo de BI completo                                                                        |
| Assinatura do comerciante (billing)                                                                                       | O modelo de negócio precisa estar provado desde o MVP                                                                                    |

**Explicitamente fora do MVP** (e por quê — detalhado na Missão 0001, Seção 10, e mantido nesta revisão): fidelidade, comandas completas, estoque de insumo, multiloja, Configuração Inteligente (IA), Lixeira, DRE/Financeiro consolidado, Ecossistema (API/Webhooks/Marketplace), qualquer integração com marketplace terceiro.

---

## 10. Funcionalidades Futuras

Sem limite de escopo — candidatos a entrar em qualquer fase pós-MVP conforme validação de demanda real. Lista da versão anterior mantida, com adições desta revisão ao final:

- Reserva de mesa integrada à comanda
- Modo "Loja Fantasma" (segunda marca/dark kitchen na mesma cozinha)
- Split de conta social entre convidados de uma mesma mesa
- Pedido colaborativo em tempo real na mesma comanda (múltiplos celulares)
- Clube de vantagens pago pelo cliente final (frete grátis mensal, estilo assinatura)
- Roteirização de entrega própria
- Checkout por link direto (bio de rede social → produto específico)
- Modo Presente (compra agendada para outra pessoa/data — usaria o módulo Endereços para destinatário diferente do comprador)
- Cardápio por voz (acessibilidade)
- Score de confiabilidade do cliente (histórico de cancelamento/no-show)
- Marketplace interno de insumos entre lojistas parceiros
- Gamificação de fidelidade (níveis/badges, não só pontos)
- Cardápio sazonal automatizado por data
- Central de recall de produto
- Modo "Franquia Light" (acesso temporário e limitado para consultor/contador externo)
- Fidelidade cruzada entre lojas Smart parceiras da mesma região
- App nativo do consumidor (quando a base de usuários justificar o custo de manutenção de duas plataformas)
- Integração com marketplaces terceiros (importar pedido do iFood/Rappi)
- SSO entre produtos do ecossistema Smart (avaliar conforme demanda real)
- **(novo)** Notificação push nativa fora do navegador
- **(novo)** Webhooks públicos para parceiros reagirem a eventos da loja em tempo real
- **(novo)** Marketplace de plugins/aplicativos de terceiros dentro do painel do SmartFood
- **(novo)** Split de pagamento automático com entregador parceiro/terceirizado
- **(novo)** DRE completo com exportação para contabilidade externa
- **(novo)** Política de retenção da Lixeira configurável por tipo de registro
- **(novo)** Assistente de IA conversacional unificado dentro da Configuração Inteligente, atendendo tanto o comerciante quanto (futuramente) o cliente final
- **(novo)** Central de parceiros com programa de afiliados/indicação B2B

---

## 11. Pontos de Inovação

Mantidos integralmente da versão anterior — trinta e dois pontos que buscam explorar espaços pouco atendidos pelos concorrentes de referência (Seção 9 da Missão 0001), evitando copiar funcionalidade já padronizada no mercado. Nenhuma alteração nesta revisão, conforme instrução explícita de não adicionar funcionalidade desnecessária.

1. **Modo Fila Zero** — estimativa de tempo de espera em tempo real, calculada pela carga real da cozinha, mostrada antes de o cliente confirmar o pedido.
2. **Cardápio dinâmico por horário** — categorias inteiras aparecem/somem automaticamente por faixa horária (ex: café da manhã).
3. **Precificação por janela de demanda ética** — desconto em horário de baixo movimento em vez de aumento em pico, evitando a má fama do "surge pricing".
4. **Combo inteligente anti-desperdício** — IA monta combo priorizando insumo próximo do vencimento.
5. **Split de conta social** — cada convidado de uma mesa paga sua parte pelo próprio celular.
6. **Pedido colaborativo em tempo real** — múltiplos celulares adicionam itens à mesma comanda de mesa simultaneamente.
7. **Modo "Loja Fantasma"** — segunda marca/cardápio operando na mesma cozinha física, com identidade visual separada.
8. **Central de avaliação com resposta pública do lojista** — nativa, sem depender do Google Meu Negócio.
9. **Reserva de mesa integrada nativamente à comanda** — sem sistema terceiro de reserva.
10. **Modo Evento** — cardápio e operação temporários que não afetam o catálogo padrão.
11. **Clube de vantagens pago pelo cliente final** — modelo tipo assinatura local, receita adicional para o lojista.
12. **Alerta de canibalização de horário de preparo** — avisa quando dois produtos concorrem pelo mesmo recurso de cozinha em pico.
13. **Roteirização simples de entrega própria** — sem depender de plataforma terceira.
14. **Sugestão de preço por comparação anônima** — preço de produto novo sugerido a partir de dado agregado de lojas parecidas (sem expor dado individual).
15. **Checkout por link direto de bio de rede social** — cliente cai direto no carrinho de um produto específico.
16. **Modo Presente** — compra agendada para entrega a terceiro em data futura.
17. **Transparência de taxa no checkout** — mostrar exatamente quanto é produto e quanto é entrega, gerando confiança.
18. **Cardápio por voz** — acessibilidade para cliente com deficiência visual.
19. **Painel de "saúde do negócio" com score único** — leitura rápida sem interpretar múltiplos gráficos.
20. **Marketplace interno de insumos entre lojistas parceiros.**
21. **Detecção de pedido potencialmente duplicado** antes da confirmação (mesmo endereço/item em poucos minutos).
22. **Pausa automática inteligente por canal** — pausa só delivery (mantendo salão) ou vice-versa, conforme sobrecarga real.
23. **Gamificação de fidelidade** — níveis e badges, não apenas pontos genéricos.
24. **Cardápio sazonal automatizado por data**, sem intervenção manual repetida todo ano.
25. **Onboarding assistido por IA a partir de foto do cardápio físico.**
26. **Painel de comparação anônima frente à média do setor** (dado agregado entre tenants, nunca individual).
27. **Central de recall de produto** — notifica automaticamente quem comprou um item com problema.
28. **Modo "Franquia Light"** — acesso temporário e limitado a consultor/contador sem expor permissão total.
29. **Fidelidade cruzada entre lojas Smart parceiras** da mesma região.
30. **Fechamento de caixa com conferência assistida** — sistema já sugere a diferença entre o valor físico e o total esperado.
31. **Notificação de status com previsão dinâmica**, recalculada em tempo real conforme a fila da cozinha muda (não um tempo fixo estimado no pedido).
32. **Score de confiabilidade do cliente final** — histórico de cancelamento/no-show ajusta política de aceite (ex: exigir pagamento antecipado de cliente com histórico ruim), protegendo o lojista sem punir o cliente novo.

---

## 12. Eventos do Sistema

Os eventos são o "vocabulário de acontecimentos" da plataforma — cada evento tem um disparo claro, módulos que reagem a ele, e ações que costumam segui-lo. Esta seção é a base funcional para qualquer automação, Webhook ou Agente de IA construído nas próximas missões.

| Evento                       | O que dispara                                                       | Módulos impactados                                                   | Ações que costumam seguir                                                                               |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **EMPRESA_CRIADA**           | Comerciante conclui o Onboarding da Empresa                         | Configuração da Loja, Gestão de Usuários, Financeiro (billing)       | Envio de e-mail de boas-vindas (Central de Comunicação), início do checklist de configuração            |
| **PRODUTO_ATUALIZADO**       | Administrador cria/edita um produto do Catálogo                     | Vitrine, Painel de Pedidos (se afeta pedido em andamento), Auditoria | Atualização imediata da vitrine pública                                                                 |
| **ESTOQUE_BAIXADO**          | Item marcado como esgotado (manual ou automático por Ficha Técnica) | Vitrine, Catálogo                                                    | Produto some/fica indisponível na vitrine em tempo real                                                 |
| **CLIENTE_CADASTRADO**       | Primeiro pedido de um novo cliente ou cadastro direto via Login     | Experiência do Cliente, Auditoria                                    | E-mail/mensagem de boas-vindas, criação de perfil vazio para completar depois                           |
| **PEDIDO_CRIADO**            | Cliente confirma o Checkout                                         | Motor de Pedidos, Painel de Pedidos, Central de Comunicação          | Notificação à equipe (interna) e ao cliente (confirmação)                                               |
| **PAGAMENTO_CONFIRMADO**     | Gateway de pagamento aprova a cobrança                              | Pagamentos, Motor de Pedidos, Financeiro                             | Pedido avança de "recebido" para "em preparo"; dado alimenta Fechamento de Caixa                        |
| **PAGAMENTO_RECUSADO**       | Gateway de pagamento recusa a cobrança                              | Pagamentos, Motor de Pedidos, Central de Comunicação                 | Pedido não avança de status; cliente é avisado para tentar outro método (ver Regra de Negócio Global 3) |
| **PEDIDO_CANCELADO**         | Cliente ou operador cancela o pedido                                | Motor de Pedidos, Pagamentos (se pago, aciona estorno), Auditoria    | Estorno acionado se aplicável; pedido removido das métricas de venda concluída                          |
| **REEMBOLSO_PROCESSADO**     | Estorno confirmado pelo meio de pagamento                           | Pagamentos, Financeiro, Central de Comunicação                       | Cliente notificado da conclusão do reembolso                                                            |
| **ITEM_MOVIDO_PARA_LIXEIRA** | Usuário exclui um registro crítico                                  | Lixeira, Auditoria                                                   | Início da contagem do período de recuperação configurável                                               |
| **PERMISSAO_ALTERADA**       | Administrador muda o papel de um usuário                            | Administração, Auditoria                                             | Usuário afetado perde/ganha acesso imediatamente na próxima ação                                        |
| **AVALIACAO_RECEBIDA**       | Cliente avalia um pedido concluído                                  | Experiência do Cliente, Central de Comunicação (notificação interna) | Alerta ao Administrador para responder publicamente                                                     |

Esta lista não é exaustiva — é a base mínima que já cobre os fluxos descritos na Seção 6. Cresce naturalmente conforme novos módulos entram em fases futuras (ex: `ASSINATURA_RENOVADA` na Fase 2, `WEBHOOK_DISPARADO` na Fase 3).

---

## 13. Regras de Negócio Globais

Regras que valem para toda a plataforma, independente de módulo específico — a base de consistência que qualquer tela ou automação futura deve respeitar.

1. **Pedido não pode retroceder de status.** O fluxo recebido → em preparo → pronto/saiu para entrega → concluído é sempre progressivo; correção de erro operacional é tratada como cancelamento, nunca como "voltar" o status.
2. **Produto sem estoque não pode ser vendido quando o controle estiver ativo.** Se a loja usa Disponibilidade Simples ou Estoque de Insumo, um item marcado indisponível não pode ser adicionado ao carrinho, mesmo que o cliente já tivesse a página aberta antes da mudança.
3. **Pagamento recusado não gera pedido confirmado.** O Motor de Pedidos só assume um pedido como "recebido" de fato após confirmação do domínio Pagamentos — evita que a cozinha comece a preparar algo que não foi pago.
4. **Cupom expirado não pode ser utilizado.** Validação de validade acontece no momento da aplicação do cupom, não apenas na criação da promoção.
5. **Empresa bloqueada não pode receber novos pedidos.** Se a Assinatura do Comerciante está inadimplente ou a conta foi suspensa por outro motivo administrativo, a Vitrine para de aceitar novo Checkout, mas pedidos já em andamento seguem até a conclusão.
6. **Exclusão de registro crítico sempre passa pela Lixeira antes de remoção definitiva.** Nenhuma exclusão de produto, categoria, usuário ou cupom é imediatamente irreversível.
7. **Toda alteração de preço, estoque, permissão ou cancelamento gera registro de Auditoria.** Sem exceção, independente do papel de quem executou a ação.
8. **Cliente só pode avaliar pedido já concluído.** Avaliação não existe para pedido cancelado ou ainda em andamento.
9. **Papel (RBAC) é sempre por tenant.** Nenhum usuário tem acesso implícito a dado de outra empresa, mesmo que acumule papéis parecidos em contas diferentes.
10. **Loja fora do horário de funcionamento não aceita novo pedido, mas continua concluindo pedidos já em andamento.** Pausa de horário nunca interrompe um pedido já confirmado.
11. **Fidelidade só acumula pontos sobre pedido concluído**, nunca sobre pedido cancelado ou reembolsado.

---

## 14. Matriz de Permissões — Conceito

Visão conceitual de como os papéis se relacionam com os domínios funcionais — não é a lista detalhada de permissões (isso caberá à Missão 0004/0005). Os papéis abaixo são os nomes que aparecem na tela do SmartFood, todos mapeados aos sete papéis base do [Smart Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md) entre parênteses.

| Papel (tela do SmartFood)         | Comercial/Catálogo         | Painel de Pedidos                | Pagamentos/Financeiro                | Configuração da Loja/Administração | Relatórios            |
| --------------------------------- | -------------------------- | -------------------------------- | ------------------------------------ | ---------------------------------- | --------------------- |
| **Administrador** (Administrador) | Total                      | Total                            | Total                                | Total                              | Total                 |
| **Gerente** (Gerente)             | Total                      | Total                            | Parcial (visão, não configuração)    | Parcial                            | Total                 |
| **Supervisor** (Supervisor)       | Parcial (sem excluir)      | Total                            | Nenhum                               | Nenhum                             | Parcial (operacional) |
| **Operador / Cozinha** (Operador) | Consulta                   | Total (execução)                 | Nenhum                               | Nenhum                             | Nenhum                |
| **Caixa** (Operador)              | Consulta                   | Parcial (status de pagamento)    | Parcial (Pagamentos, não Financeiro) | Nenhum                             | Nenhum                |
| **Motoboy** (Operador)            | Nenhum                     | Parcial (só entregas atribuídas) | Nenhum                               | Nenhum                             | Nenhum                |
| **Financeiro** (Financeiro)       | Nenhum                     | Consulta                         | Total                                | Nenhum                             | Parcial (financeiro)  |
| **Cliente** (Cliente)             | Consulta (vitrine)         | Consulta (só o próprio pedido)   | Parcial (só o próprio pagamento)     | Nenhum                             | Nenhum                |
| **Visitante** (Visitante)         | Consulta (vitrine pública) | Nenhum                           | Nenhum                               | Nenhum                             | Nenhum                |

`Caixa`, `Cozinha` e `Motoboy` são especializações do papel base **Operador** — cada um enxerga uma fatia diferente do Painel de Pedidos, mas nenhum deles ganha acesso além do que um Operador já teria por padrão. Essa especialização é decisão de tela (Missão 0003), não de arquitetura de permissão.

---

## 15. Linguagem Ubíqua — Linguagem Oficial do Produto

Termos padronizados para evitar que documentos futuros (UX, banco de dados, arquitetura técnica) usem palavras diferentes para o mesmo conceito.

| Termo            | Definição oficial                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresa**      | O negócio real do comerciante que contrata o SmartFood — corresponde a um tenant.                                                                                                                         |
| **Loja**         | Um ponto de venda operacional de uma Empresa. Uma Empresa tem uma Loja no MVP; pode ter várias a partir da Fase 3 (Multiloja).                                                                            |
| **Tenant**       | Conceito técnico de isolamento de dados — na prática, equivale a uma Empresa. Usado apenas em contexto de arquitetura/dados, nunca em tela voltada ao usuário.                                            |
| **Comerciante**  | Pessoa dona ou gestora da Empresa — geralmente o papel Administrador.                                                                                                                                     |
| **Cliente**      | Pessoa que compra da Loja — nunca usar "cliente" para se referir ao comerciante que assina o SmartFood (esse é "Comerciante" ou, no contexto de billing, "Assinante").                                    |
| **Operador**     | Termo guarda-chuva para quem executa a operação do dia a dia (inclui as especializações Caixa, Cozinha, Motoboy — ver Seção 14).                                                                          |
| **Pedido**       | A unidade central de transação entre Cliente e Loja, unificada pelo Motor de Pedidos, independente do canal de origem (site, QR Code de mesa, balcão).                                                    |
| **Catálogo**     | O conjunto de Produtos cadastrados por uma Loja.                                                                                                                                                          |
| **Produto**      | Um item vendável do Catálogo, podendo ter Variações.                                                                                                                                                      |
| **Categoria**    | Agrupamento de Produtos dentro do Catálogo.                                                                                                                                                               |
| **Comanda**      | Registro de consumo vinculado a uma mesa/cliente no salão, composto por um ou mais Pedidos/itens.                                                                                                         |
| **Entrega**      | Modo de recebimento em que o Pedido é levado até um Endereço do Cliente.                                                                                                                                  |
| **Retirada**     | Modo de recebimento em que o Cliente busca o Pedido na Loja.                                                                                                                                              |
| **Pagamento**    | O evento de cobrança associado a um Pedido, tratado pelo domínio Pagamentos.                                                                                                                              |
| **Papel (Role)** | O conjunto de permissões atribuído a um usuário dentro de uma Empresa — ver Matriz de Permissões (Seção 14).                                                                                              |
| **Tema**         | Ambíguo por natureza — sempre qualificar: "Tema da Loja" (identidade visual pública) ou "Tema do Painel" (claro/escuro da tela interna). Nunca usar "Tema" sozinho em documentação a partir desta missão. |

---

## 16. Análise Crítica do Próprio Projeto

_Conteúdo da revisão anterior preservado integralmente; itens novos desta rodada marcados com **(revisão 2)**._

### Pontos fortes

- O **Motor de Pedidos como módulo central único** é a decisão estrutural mais forte deste documento — resolve a dor #1 do mercado (fragmentação de canais) de forma estrutural, não superficial.
- A sequência de fases (Seção 8) espelha fielmente a maturidade real de um comerciante pequeno crescendo, reduzindo o risco de construir funcionalidade que ninguém usa ainda.
- A separação entre Relatórios (passado) e Inteligência Artificial (futuro/sugestão) evita a armadilha comum de prometer "IA" cedo demais, antes de haver dado suficiente.
- Vários pontos de inovação (Seção 11) atacam dores operacionais reais e específicas do setor (fila, canibalização de horário, desperdício) em vez de replicar feature de concorrente.
- **(revisão 2)** A separação Pagamentos/Financeiro e a criação de Experiência do Cliente e Central de Comunicação eliminam três casos reais de duplicação que existiam na primeira versão (notificação aparecia em três domínios diferentes) — ganho direto de consistência, sem inflar o MVP.
- **(revisão 2)** A introdução de Eventos do Sistema e Regras de Negócio Globais cria uma camada de especificação que qualquer engenheiro (mesmo sem ter lido este documento inteiro) consegue usar como referência rápida — isso reduz risco de divergência quando a Missão 0004/0005 começar.

### Riscos

- **Catálogo genérico demais para dois extremos.** O mesmo módulo de Catálogo precisa atender uma pizzaria (15 itens) e um mercado de bairro (persona Sônia, centenas de SKUs). Se a estrutura de categorização não for pensada com profundidade suficiente desde a Fase 1, o mercado de bairro vira um caso especial caro de corrigir depois.
- **Motor de Pedidos como ponto único de falha.** Por ser o módulo mais crítico, qualquer decisão apressada nele tem custo de retrabalho amplificado em cascata sobre praticamente todos os outros módulos.
- **QR Code de Mesa no MVP pode ser ambicioso.** Está classificado como MVP porque resolve dor real (personas Diego e Camila), mas é tecnicamente mais complexo que "só delivery" — vale reconfirmar na Missão 0003 se não deveria abrir o MVP em duas ondas.
- **Pausa automática de horário/sobrecarga** é uma automação de negócio com potencial de bloquear venda incorretamente se mal calibrada — precisa de configuração clara e reversível pelo comerciante.
- **(revisão 2)** A divisão entre Pagamentos e Financeiro exige reconciliação constante entre os dois domínios — se a Missão 0006 (Modelagem do Banco de Dados) não desenhar bem essa fronteira, existe risco real de os dois números divergirem (ex: caixa fechado no Financeiro não bater com o total processado em Pagamentos).
- **(revisão 2)** Central de Comunicação como preparação explícita para Agentes de IA é decisão acertada a médio prazo, mas amplia a superfície do domínio se a Fase 1 não limitar estritamente o escopo ao canal transacional (confirmação, status) — Push, campanhas e uso por Agente ficam de fora do MVP por design, e isso precisa continuar claro na Missão 0003.
- **(revisão 2)** Módulos transversais (Arquivos, Auditoria, Lixeira) só funcionam como "serviço chamado por qualquer domínio" se a Missão 0005 (Arquitetura da Solução) de fato os tratar como serviço compartilhado — existe risco de um desenvolvedor menos experiente reimplementá-los localmente dentro de um domínio, reintroduzindo a duplicação que esta revisão acabou de eliminar.

### Complexidades

- Unificar delivery, retirada e mesa num único Motor de Pedidos sem tornar a experiência confusa para o cliente exige cuidado de UX que será decidido na Missão 0003 — este documento define a função, não a tela.
- RBAC adaptado ao domínio de food service precisa de nomes mais próximos da realidade do comerciante — **(revisão 2)** este ponto já foi parcialmente resolvido nesta rodada com a Matriz de Permissões da Seção 14 (Caixa/Cozinha/Motoboy como especializações de Operador), mas a tela final ainda é decisão da Missão 0003.
- Estoque de insumo/ficha técnica (Fase 2) é historicamente o módulo mais subestimado em complexidade em sistemas de food service — vale tratar com cautela extra quando chegar a hora.
- **(revisão 2)** A Linguagem Ubíqua (Seção 15) só cumpre sua função se for de fato consultada nas próximas missões — glossário sem uso ativo tende a ficar desatualizado silenciosamente; vale revisitá-lo no início de cada nova missão.

### Sugestões de melhoria

- Considerar dividir o módulo "Catálogo de Produtos" em duas variantes de configuração (perfil "cardápio" vs. perfil "mercado") desde a Fase 1, mesmo que a diferença hoje seja só de rótulo/categoria padrão sugerida — evita retrabalho estrutural quando a persona Sônia (mercado de bairro) entrar de fato.
- Validar com um comerciante real (mesmo que informalmente) a ordem de prioridade dentro da própria Fase 1 antes da Missão 0003, para não assumir que todos os módulos do MVP têm o mesmo peso de urgência.
- Definir, ainda nesta missão ou no início da 0003, uma política simples e explícita para pedidos "travados" (nenhuma mudança de status por X tempo) — o fluxo operacional (Seção 6) ainda não cobre esse caso de borda.
- **(revisão 2)** Ao chegar na Missão 0006 (Modelagem do Banco de Dados), tratar explicitamente a fronteira Pagamentos/Financeiro como um dos primeiros pontos de modelagem, dado o risco de reconciliação apontado acima.

### Itens que precisam ser decididos antes da Missão 0003

1. QR Code de Mesa entra na primeira onda do MVP ou é a "onda 1.5" logo após o delivery/retirada básico?
2. Aceite de pedido é automático por padrão ou manual (operador confirma) — e isso é configurável por loja?
3. Nomenclatura de tela para Caixa/Cozinha/Motoboy (Seção 14) — confirmar se esses são os melhores rótulos ou se o comerciante brasileiro reconhece outros termos mais naturalmente.
4. Perfil de catálogo "cardápio" vs. "mercado" — mesmo módulo com configuração diferente, ou dois módulos desde já?
5. Política para pedido travado / sem atualização de status por tempo excessivo.
6. Nível de automação da pausa por sobrecarga (Seção 2.2/13) — sugestão ao comerciante ou ação automática direta?
7. **(revisão 2)** Período padrão de retenção da Lixeira (Seção 2.14) antes da remoção definitiva — 7 dias? 30 dias? Configurável por tipo de registro desde já ou só na Fase 2?
8. **(revisão 2)** Escopo exato de "canal transacional" da Central de Comunicação no MVP — confirmar que WhatsApp/E-mail cobrem o suficiente sem precisar de SMS já na Fase 1.

---

## 17. Resumo desta Revisão (CTO Review — Rodada 2)

### O que foi incorporado

- Quatro domínios novos: **Experiência do Cliente**, **Central de Comunicação**, **Pagamentos** e **Configuração da Loja**.
- Um domínio renomeado e ampliado: **Integrações → Ecossistema**.
- Uma nova categoria estrutural: **Módulos Transversais** (Gerenciamento de Arquivos, Auditoria, Lixeira), deliberadamente não tratados como domínios.
- Um módulo dedicado e reutilizável: **Endereços**.
- Quatro seções novas: **Eventos do Sistema**, **Regras de Negócio Globais**, **Matriz de Permissões (conceito)**, **Linguagem Ubíqua**.
- Mapa de dependência (Seção 7), fases (Seção 8), MVP (Seção 9) e Análise Crítica (Seção 16) atualizados para refletir os novos módulos, sem alterar a filosofia, o roadmap ou remover conteúdo da versão anterior.
- Documento de histórico de decisões criado: [missao-0002-review-notes.md](../../engineering/review-notes/missao-0002-review-notes.md).

### Decisões arquiteturais tomadas

- **Pagamentos ≠ Financeiro.** Transacional (evento a evento) separado de consolidado (visão ao longo do tempo).
- **Arquivos, Auditoria e Lixeira são serviços de plataforma, não domínios de negócio** — usados por todos, pertencentes a nenhum.
- **Central de Comunicação é o único canal de saída de mensagem da plataforma**, inclusive para uso futuro por Agentes de IA — nenhum módulo deve criar seu próprio canal de envio.
- **"Marketplace" passou a ter dois sentidos deliberadamente distintos** e nomeados sem ambiguidade: Sincronização com Marketplaces de Pedido (iFood/Rappi) vs. Marketplace de Aplicativos (loja de plugins do Ecossistema).
- **RBAC de tela (Caixa/Cozinha/Motoboy) é especialização de Operador**, não papel novo — mantém o modelo de 7 papéis base do Smart Security Guide intacto.

### Impactos nas próximas missões

- **Missão 0003 (UX):** já tem confirmado o glossário oficial (Seção 15) e a matriz conceitual de permissões (Seção 14) para nomear telas sem ambiguidade; os 8 itens pendentes de decisão (Seção 16) devem ser resolvidos no início dessa missão.
- **Missão 0006 (Modelagem do Banco de Dados):** os Eventos do Sistema (Seção 12) e a fronteira Pagamentos/Financeiro (risco apontado na Seção 16) são os dois pontos de maior atenção ao modelar entidades e relacionamentos.
- **Missão 0005 (Arquitetura da Solução):** a decisão de tratar Arquivos/Auditoria/Lixeira como serviços compartilhados (não reimplementados por domínio) precisa virar decisão técnica explícita, não apenas funcional.

_Nota pós-congelamento, 2026-07-11: os números/nomes de missão futura citados nesta seção foram atualizados para refletir o roadmap oficial (inserção da Missão 0004 — Modelagem do Domínio, e renomeação da Missão 0005 para Arquitetura da Solução, empurrando Banco de Dados para 0006). Nenhuma decisão de conteúdo desta missão foi alterada — apenas as referências cruzadas._

---

_Fim do documento — Missão 0002, Revisão 2. Pronta para congelamento como versão oficial, mediante confirmação final do usuário._
