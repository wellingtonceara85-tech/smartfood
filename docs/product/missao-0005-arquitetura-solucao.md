# SmartFood — Arquitetura da Solução (Solution Architecture)

**Missão 0005**
**Status:** ✅ CONGELADA — versão oficial (aprovada em 2026-07-11, após Rodada 2 de ajustes)
**Referências obrigatórias:** [Smart Platform](../../../Smart%20Platform/INDEX.md) · [Missão 0001](missao-0001-visao-estrategica.md) · [Missão 0002 — congelada](missao-0002-arquitetura-funcional.md) · [Missão 0003 — congelada](missao-0003-ux-jornadas.md) · [Missão 0004 — congelada](missao-0004-modelagem-dominio.md)
**Histórico de decisões:** [missao-0005-review-notes.md](../../engineering/review-notes/missao-0005-review-notes.md)
**Escopo:** Arquitetura lógica da solução — Bounded Contexts, módulos, comunicação, eventos, serviços compartilhados, cache, APIs, segurança, observabilidade, escalabilidade, resiliência. **Nenhuma tecnologia é escolhida aqui** — sem banco de dados, sem framework, sem fornecedor de infraestrutura. Toda decisão é consequência direta das Missões 0001-0004.
**Mindset:** escrito como Software Architect — toda decisão passa pelo teste "isso ainda fará sentido daqui a dez anos de evolução do produto?" (diretriz de mindset adotada em 2026-07-11, registrada na memória de longo prazo do projeto).

---

## 1. Visão Geral da Arquitetura

### Filosofia

O SmartFood é organizado como uma **arquitetura modular orientada a Bounded Contexts**, internamente estruturada em camadas (domínio → aplicação → interface/infraestrutura, no espírito de Clean Architecture) e comunicando-se por **contratos explícitos** e **Eventos de Domínio** — nunca por acesso direto ao dado interno de outro contexto.

A unidade de módulo não é a tela nem o domínio de produto da Missão 0002 — é o **Bounded Context** (Seção 2), que pode agrupar mais de um domínio funcional quando eles compartilham modelo e mudam juntos, e nunca deve ser maior que o necessário para manter uma linguagem única e consistente internamente.

### Como os módulos conversam

Dois canais, e apenas dois, por design:

1. **Contrato síncrono explícito** (uma Application Service Interface/API interna) — quando o consumidor precisa de resposta imediata para completar sua própria operação.
2. **Evento de Domínio assíncrono** — quando a reação de outro contexto não precisa ser imediata nem bloquear o fluxo de quem originou a mudança.

Nunca existe um terceiro canal ("dar um jeitinho" de ler a tabela/estrutura interna de outro contexto). Essa é a regra mais importante deste documento — todo o resto deriva dela.

### Como o sistema cresce

A arquitetura é desenhada para nascer como uma unidade coesa (deployável como um todo no MVP) e evoluir para contextos independentemente implantáveis conforme a carga e a maturidade da equipe exigirem — **sem redesenho do modelo de domínio**. Isso só é possível porque a fronteira de Bounded Context já é, desde o primeiro dia, tratada como fronteira de processo em potencial, não uma pasta de conveniência. Crescer não significa reescrever; significa separar fisicamente algo que já era logicamente separado.

### Como evitar acoplamento

- Nenhum contexto acessa o agregado interno de outro — só o que o contrato publicado expõe.
- Nenhuma transação cruza a fronteira de um agregado (herdado da Missão 0004) — muito menos a fronteira de um Bounded Context.
- Dependência é sempre unidirecional por camada de maturidade (Seção 3) — nunca circular.
- Serviços compartilhados (Seção 7) são infraestrutura de plataforma, nunca lógica de negócio de um contexto específico vazando para os outros.

### Princípios arquiteturais

1. Bounded Context é a unidade de decomposição — não é 1:1 obrigatório com os domínios funcionais da Missão 0002.
2. Toda comunicação entre contextos é por contrato explícito ou evento — nunca leitura/escrita direta de dado alheio.
3. Agregado (Missão 0004) é a única fronteira de consistência transacional forte; entre contextos, a consistência é sempre eventual.
4. Cada contexto é "independentemente implantável" em potencial desde o desenho, mesmo que coabite o mesmo processo hoje.
5. Multi-tenant (Empresa) é transversal e não-negociável em todo contexto — nunca uma opção configurável por módulo.
6. Serviços compartilhados nunca carregam regra de negócio de um contexto específico.
7. Inversão de dependência (SOLID): a camada de domínio de um contexto nunca depende de detalhe de infraestrutura — depende de abstração.
8. Observabilidade e segurança são requisito arquitetural desde a Seção 1, não uma camada "adicionada depois".
9. Nenhuma estrutura deve servir só ao SmartFood quando puder virar padrão reutilizável da Smart Platform.
10. Toda decisão desta missão passa pelo teste dos dez anos antes de ser aceita.

---

## 2. Bounded Contexts

A Missão 0004 classificou **Domínios** (Core/Supporting/Generic). Esta missão traduz esses domínios em **Bounded Contexts** — a fronteira técnica de modelo e linguagem. A tradução **não é 1:1**: dois domínios que compartilham o mesmo agregado central e mudam sempre juntos viram um único contexto (ver Comercial+Operacional abaixo); um domínio "Generic" pode não precisar de contexto próprio algum, virando serviço compartilhado (Seção 7) em vez de Bounded Context.

| Bounded Context          | Responsabilidade                                             | Agregados possuídos (Missão 0004)               | Dono do dado         | Classificação herdada                          |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------------- | -------------------- | ---------------------------------------------- |
| **Catálogo**             | O que a Loja vende                                           | Produto, Categoria                              | Catálogo             | Core                                           |
| **Vendas & Operação**    | Do carrinho até a conclusão do pedido — criação e execução   | Pedido, Comanda, Assinatura de Produto          | Vendas & Operação    | Core                                           |
| **Clientes**             | Identidade, histórico e relacionamento com o comprador final | Cliente, Conta de Fidelidade                    | Clientes             | Core                                           |
| **Pagamentos**           | Processar e reverter cobrança                                | Pagamento                                       | Pagamentos           | Supporting                                     |
| **Financeiro**           | Visão consolidada do dinheiro da Empresa ao longo do tempo   | Fatura (billing)                                | Financeiro           | Supporting                                     |
| **Comunicação**          | Orquestrar o que é comunicado, quando e por qual canal       | Notificação                                     | Comunicação          | Supporting                                     |
| **Identidade & Empresa** | Quem é a Empresa e quem pode fazer o quê dentro dela         | Empresa (+ Configuração Global), Usuário, Papel | Identidade & Empresa | Generic (RBAC herdado do Smart Security Guide) |
| **Marketing**            | Incentivo de conversão e recorrência                         | Cupom                                           | Marketing            | Supporting                                     |
| **Estoque**              | Controle de insumo (Fase 2+)                                 | Item de Estoque                                 | Estoque              | Supporting                                     |
| **Ecossistema**          | Extensão da plataforma para fora dela                        | — (API/Webhook são contrato, não agregado)      | —                    | Generic                                        |

**Inteligência Artificial e Relatórios & Analytics não estão nesta tabela** — ver "Capabilities vs. Bounded Context" logo abaixo, decisão tomada na Rodada 2 de revisão.

### Capabilities vs. Bounded Context — Inteligência Artificial e Relatórios & Analytics

A revisão desta missão levantou uma pergunta legítima: Inteligência Artificial e Relatórios & Analytics deveriam ser Bounded Contexts, ou algo diferente? Ambos, hoje, não possuem agregado próprio, não escrevem em nenhum outro contexto e não desenvolveram uma linguagem ubíqua distinta — são consumidores de evento/consulta que reprocessam dado de outros contextos. Isso é o critério clássico de DDD para **não** tratar algo como Bounded Context: um Bounded Context existe onde há um modelo de domínio com linguagem própria a proteger, não simplesmente onde há uma responsabilidade de sistema.

**Decisão (Rodada 2):** Inteligência Artificial e Relatórios & Analytics são tratados como **Capabilities da Plataforma** — Inteligência Artificial é uma capacidade de plataforma consumida por qualquer contexto via o serviço compartilhado "Acesso a IA" (Seção 7, já alinhado ao [Smart AI Guide](../../../Smart%20Platform/SMART_AI_GUIDE_v1.0.md)); Relatórios & Analytics é uma **Plataforma de Leitura** (Read Platform) que projeta e reapresenta dado de outros contextos, sem regra de negócio própria sobre o que aconteceu.

Isso é uma reclassificação de rótulo, não de posição arquitetural — ambos continuam no mesmo lugar do mapa de dependência (Seção 3, Tier 4), consumindo os mesmos eventos, com os mesmos limites já descritos. O que muda é que eles deixam de ser tratados como donos de decisão de negócio.

**Gatilho de reclassificação futura (documentado para não precisar redescobrir esta discussão):** se, no futuro, Inteligência Artificial ou Relatórios & Analytics desenvolverem uma linguagem própria e passarem a concentrar regra de negócio específica que hoje não existe — por exemplo, um "Modelo de Recomendação" versionado com política de negócio própria que a IA passa a _decidir_ (não só sugerir), ou um "Score de Comparação Anônima" que vira produto com regra própria de cálculo protegida — cada um vira candidato real a Bounded Context próprio, com agregado, linguagem e dono de decisão. Essa reavaliação já é esperada na trajetória Generic → Supporting → potencialmente Core da IA definida na Missão 0004.

_Nota de transparência: esta é uma decisão de arquitetura, não uma verdade absoluta — equipes experientes em DDD modelam Analytics/IA como Bounded Context quando eles já desenvolveram linguagem própria. A decisão acima é o julgamento correto para o estágio atual do SmartFood, revisável quando o gatilho acima ocorrer._

### Ownership — quem decide, não só quem guarda o dado

"Dono do dado" (coluna da tabela acima) não é o mesmo que "dono da decisão de negócio". Um contexto pode consultar dado de outro sem ganhar autoridade sobre a decisão que aquele dado representa. Esta tabela torna explícito quem tem a palavra final sobre cada decisão central do domínio:

| Decisão de negócio                                              | Bounded Context dono da decisão                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "Este Pedido pode avançar de status?"                           | Vendas & Operação                                                           |
| "Este Pagamento está aprovado/recusado?"                        | Pagamentos                                                                  |
| "Qual o preço vigente deste Produto agora?"                     | Catálogo                                                                    |
| "Este Cupom é válido para uso neste momento?"                   | Marketing                                                                   |
| "Este Usuário pode executar esta ação?"                         | Identidade & Empresa                                                        |
| "Esta Empresa está apta a operar (não bloqueada/inadimplente)?" | Financeiro (inadimplência) + Identidade & Empresa (bloqueio administrativo) |
| "Este Cliente pode acumular pontos deste Pedido?"               | Clientes                                                                    |
| "Este evento deve virar notificação, e para quem?"              | Comunicação                                                                 |

Nenhum outro contexto pode tomar essas decisões "por conta própria" ao consumir o dado — mesmo que o dado esteja disponível via evento ou consulta, a decisão pertence sempre ao contexto listado acima. Isso é o que evita que a mesma regra de negócio seja implementada (e diverja) em mais de um lugar.

### Anti-Corruption Layer (ACL)

Toda fronteira com um sistema externo (marketplace de pedido, gateway de pagamento, parceiro de integração) passa por uma **Anti-Corruption Layer** dentro do contexto responsável por aquela integração (tipicamente Ecossistema, ou Pagamentos no caso do gateway). A regra é direcional e não-negociável: **o parceiro externo é adaptado ao modelo de domínio do SmartFood — nunca o contrário.** O formato, a nomenclatura e as peculiaridades de um sistema externo nunca vazam para dentro de um Bounded Context; a tradução acontece uma única vez, na borda, e o que passa para dentro já fala a Linguagem Ubíqua do SmartFood (Missão 0004).

Isso protege o domínio interno de duas formas: (1) uma mudança na API de um parceiro externo nunca força mudança no modelo de domínio, só na camada de tradução; (2) inconsistência ou modelo pobre de um parceiro externo nunca "contamina" a qualidade do modelo interno. O Callback de gateway de pagamento (Seção 9) e a Sincronização com Marketplaces de Pedido (Missão 0002) são os dois casos concretos de ACL já identificados no domínio hoje.

### Por que Comercial e Operacional viram um único Bounded Context

A Missão 0004 tratou Comercial e Operacional como dois **Domínios** Core separados — correto do ponto de vista de negócio (perguntas diferentes: "o que vendo" vs. "como esse pedido é executado"). Mas os dois compartilham o **mesmo agregado raiz** (Pedido) e mudam junto, minuto a minuto, na mesma transação de negócio (Missão 0004, Seção 8: Pedido é o agregado de maior acoplamento do sistema). Separá-los em Bounded Contexts diferentes forçaria uma de duas coisas: (a) transação distribuída para cada mudança de status — inaceitável pelo Princípio 3; ou (b) um dos dois lados operar sobre uma cópia/projeção do Pedido, reintroduzindo exatamente a duplicação e o atraso que o Motor de Pedidos unificado foi desenhado para eliminar desde a Missão 0002. Por isso, **Vendas & Operação é um único Bounded Context**, com sub-módulos internos (Catálogo de Venda/Checkout vs. Painel Operacional/Fila) que dividem responsabilidade _dentro_ do mesmo contexto, não entre contextos.

### Por que Arquivos, Auditoria e Lixeira não são Bounded Contexts

Consistente com a Missão 0004 (Seção 2): são infraestrutura usada por qualquer contexto, não um domínio de negócio com linguagem própria. Tratados como Serviços Compartilhados (Seção 7).

### Limites explícitos (o que cada contexto NUNCA faz)

- **Catálogo** nunca sabe se um Produto foi vendido — não tem visão de Pedido.
- **Vendas & Operação** nunca calcula preço de venda a partir de regra de precificação complexa — consulta Catálogo, que é quem decide o preço vigente no momento da consulta (o Pedido depois congela esse valor como snapshot, Missão 0004/ADR-0003).
- **Pagamentos** nunca sabe o que foi comprado (item, categoria) — só sabe o valor total e a referência do Pedido.
- **Clientes** nunca guarda histórico de venda em si (isso é responsabilidade de Vendas & Operação, consultado por referência) — guarda identidade, endereço, preferência e saldo de fidelidade.
- **Identidade & Empresa** nunca contém lógica de negócio de nenhum outro contexto — só identidade, papel e configuração.
- **Relatórios & Analytics** e **Inteligência Artificial** (Capabilities, não Bounded Contexts — ver acima) nunca escrevem em nenhum outro contexto — são consumidores puros (read-only) de evento/consulta.
- **Ecossistema** nunca acessa agregado de outro contexto diretamente — só o que estiver publicado como API Pública/Webhook.

---

## 3. Arquitetura Modular

**Nota da Rodada 2:** os tiers abaixo representam **direção preferencial de dependência**, não uma restrição física absoluta. Uma exceção pontual e justificada (ex: uma consulta síncrona estreita e de baixo risco a um contexto nominalmente "acima") pode existir, desde que seja uma decisão arquitetural explícita e documentada — nunca drift silencioso. O objetivo do modelo de tiers é dar uma heurística clara para a maioria das decisões, não criar uma regra que quebra o sistema no primeiro caso legítimo de exceção.

### Camadas de dependência (tiers)

```
TIER 0 — Fundação (não depende de nenhum contexto de negócio)
  Identidade & Empresa · Catálogo

TIER 1 — Depende só de Tier 0
  Clientes · Estoque

TIER 2 — Núcleo transacional (depende de Tier 0/1)
  Vendas & Operação

TIER 3 — Reage ao núcleo (depende de Tier 0/1/2, nunca o contrário)
  Pagamentos · Marketing · Comunicação

TIER 4 — Consolida e analisa (consome de qualquer tier abaixo, nunca escreve neles)
  Financeiro (Bounded Context) · Relatórios & Analytics (Capability/Read Platform) ·
  Inteligência Artificial (Capability)

TIER 5 — Estende para fora
  Ecossistema
```

### Regra de dependência

- Um contexto de tier N pode **consumir contrato síncrono** apenas de contextos em tier < N.
- Um contexto de tier N pode **reagir a evento** de qualquer tier — inclusive tier superior — porque reagir a evento não cria dependência de disponibilidade (o publisher nunca espera o subscriber).
- Nenhum contexto de tier inferior chama sincronamente um contexto de tier superior. Se isso parecer necessário, é sinal de erro de classificação de tier, não uma exceção válida.

### Quem nunca pode depender de quem

- **Catálogo nunca depende de Vendas & Operação** — precisa funcionar (cadastro de produto) mesmo que o motor de pedidos esteja indisponível.
- **Identidade & Empresa nunca depende de nada de negócio** — é a fundação; se dependesse de outro contexto, uma falha ali derrubaria login/permissão de todo o sistema.
- **Relatórios & Analytics e Inteligência Artificial nunca são fonte de verdade de escrita** para nenhum outro contexto — um contexto de negócio nunca lê "de volta" um dado gerado por IA/Relatórios como se fosse dado primário.
- **Ecossistema nunca é dependência de nenhum contexto interno** — é estritamente uma extensão de saída; se o Ecossistema cair, nenhum contexto interno pode ser afetado.

### Diagrama textual

```
                         ┌────────────────────┐
                         │   Ecossistema        │  Tier 5
                         └─────────▲────────────┘
                                   │ (consome API pública)
        ┌──────────────┬──────────┴──────────┬────────────────┐
        │  Financeiro   │  Relatórios &        │  Inteligência   │  Tier 4
        │  (BC)         │  Analytics           │  Artificial      │
        │               │  (Capability)        │  (Capability)    │
        └───────▲───────┴──────────▲───────────┴────────▲────────┘
                │  (leitura/evento)│                     │
        ┌───────┴───────┬──────────┴──────────┬──────────┴──────┐
        │  Pagamentos    │  Marketing           │  Comunicação     │  Tier 3
        └───────▲────────┴──────────▲───────────┴────────▲───────┘
                │ (evento)          │ (contrato/evento)   │ (evento)
                └──────────┬────────┴──────────────┬──────┘
                            │                        │
                   ┌────────┴────────────────────────┴───┐
                   │        Vendas & Operação              │  Tier 2
                   └────────▲──────────────────▲───────────┘
                            │ (contrato)        │ (contrato)
                 ┌──────────┴──────┐  ┌─────────┴─────────┐
                 │    Clientes       │  │      Estoque       │  Tier 1
                 └──────────▲────────┘  └─────────▲──────────┘
                            │ (contrato)           │ (contrato)
                 ┌──────────┴───────────────────────┴──────────┐
                 │       Catálogo         │   Identidade & Empresa   │  Tier 0
                 └─────────────────────────┴───────────────────────┘
```

---

## 4. Comunicação entre Módulos

| Mecanismo                                              | Quando usar                                                                                                                          | Exemplo real do domínio                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chamada direta (síncrona)**                          | O consumidor precisa da resposta imediata para completar sua própria operação, e o dado consultado é de um contexto de tier inferior | Checkout (Vendas & Operação) consulta Catálogo para validar preço/disponibilidade antes de criar o Pedido                                                                                                   |
| **Evento (assíncrono)**                                | A reação de outro contexto não bloqueia nem é necessária para o fluxo de quem originou a mudança                                     | `PEDIDO_CONCLUIDO` → Clientes credita ponto de fidelidade; `PAGAMENTO_CONFIRMADO` → Financeiro atualiza fluxo de caixa                                                                                      |
| **Fila (com garantia de entrega e retry)**             | Processamento precisa acontecer, mas pode ser assíncrono, e a entrega não pode ser perdida mesmo sob falha temporária                | Envio de notificação (Comunicação); geração de relatório pesado (Relatórios)                                                                                                                                |
| **Processamento assíncrono (worker de longa duração)** | A tarefa depende de recurso externo lento ou de duração variável, e nunca deve travar a requisição que a originou                    | Chamada a modelo de IA (Recomendação/Previsão); geração de PDF (Missão 0002); sincronização com marketplace externo (Ecossistema)                                                                           |
| **Agendamento (scheduling)**                           | A ação depende de tempo, não de um evento de negócio disparado por alguém                                                            | Geração automática do Pedido de uma Assinatura de Produto recorrente; expiração de Pedido/Pagamento sem confirmação (`PEDIDO_EXPIRADO`, `PAGAMENTO_EXPIRADO` — Missão 0004); fechamento diário de relatório |

**Regra de desempate:** se uma interação pode ser resolvida por evento sem prejuízo à experiência do usuário, ela deve ser — chamada síncrona é a exceção que precisa de justificativa, não o padrão default.

---

## 5. Eventos da Plataforma

Expande os 21 Eventos de Domínio da Missão 0004 (16 de fluxo esperado + 5 negativos) com uma classificação arquitetural.

**Princípio fundamental (Rodada 2): um Evento representa um fato que já ocorreu — passado, irrevogável — nunca um comando ou uma solicitação de ação futura.** `PEDIDO_CRIADO` relata que o pedido já foi criado; não é um pedido para que alguém crie um pedido. Essa distinção não é semântica — tem consequência arquitetural direta: um evento pode ter zero, um ou múltiplos subscribers reagindo livremente, porque ninguém "decide" se o fato aconteceu (já aconteceu); um comando, ao contrário, tem exatamente um destinatário responsável por decidir se executa ou recusa. O SmartFood usa Eventos entre Bounded Contexts (Seção 4) — nunca um mecanismo de comando distribuído entre contextos; toda decisão de "fazer algo" é sempre local ao contexto que a possui (ver Ownership, Seção 2), nunca solicitada de fora via evento. Convenção de nomenclatura: todo evento é nomeado no particípio passado (`_CRIADO`, `_CONFIRMADO`, `_CANCELADO`), nunca no imperativo (`CRIAR_X`, `CONFIRMAR_Y`) — a nomenclatura já usada nos 21 eventos da Missão 0004 já seguia essa convenção; agora está formalizada como regra.

| Classificação     | Definição                                                                                    | Exemplos (Missão 0004)                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Internos**      | Nunca cruzam fronteira de Bounded Context — usados só dentro do próprio contexto que os gera | Mudança de status intermediária do Pedido consumida só pelo próprio Kanban operacional dentro de Vendas & Operação |
| **Externos**      | Cruzam fronteira de contexto, mas nunca saem da plataforma SmartFood                         | `PEDIDO_CRIADO`, `PAGAMENTO_CONFIRMADO`, `FIDELIDADE_PONTOS_CREDITADOS`, `ESTOQUE_BAIXADO`                         |
| **Públicos**      | Elegíveis a virar Webhook para fora da plataforma (Ecossistema)                              | `PEDIDO_CRIADO`, `PEDIDO_CANCELADO`, `PAGAMENTO_CONFIRMADO` — sujeitos a assinatura do parceiro                    |
| **Privados**      | Nunca saem do backend, mesmo internamente visível só a quem precisa                          | `PERMISSAO_ALTERADA`, dado de auditoria detalhado                                                                  |
| **De integração** | Trocados com sistema externo, em qualquer direção                                            | Confirmação de pagamento vinda do gateway (entrada); pedido sincronizado com marketplace (saída, futuro)           |
| **De auditoria**  | Geram Registro de Auditoria (Missão 0004) além de (ou em vez de) reação funcional            | `PERMISSAO_ALTERADA`, `ITEM_MOVIDO_PARA_LIXEIRA`, qualquer evento de cancelamento/estorno                          |

### Classificação completa dos 21 eventos

| Evento                        | Classificação                                    |
| ----------------------------- | ------------------------------------------------ |
| EMPRESA_CRIADA                | Externo                                          |
| PRODUTO_ATUALIZADO            | Externo                                          |
| ESTOQUE_BAIXADO               | Externo                                          |
| CLIENTE_CADASTRADO            | Externo                                          |
| ENDERECO_ADICIONADO           | Interno (Clientes)                               |
| PEDIDO_CRIADO                 | Externo + Público                                |
| PAGAMENTO_CONFIRMADO          | Externo + Público + Integração (origem: gateway) |
| PAGAMENTO_RECUSADO            | Externo + Integração                             |
| PEDIDO_CANCELADO              | Externo + Público + Auditoria                    |
| REEMBOLSO_PROCESSADO          | Externo + Auditoria                              |
| CUPOM_APLICADO                | Interno (Vendas & Operação/Marketing)            |
| AVALIACAO_RECEBIDA            | Externo                                          |
| FIDELIDADE_PONTOS_CREDITADOS  | Interno (Clientes)                               |
| ASSINATURA_CRIADA / CANCELADA | Externo                                          |
| ITEM_MOVIDO_PARA_LIXEIRA      | Externo + Auditoria                              |
| PERMISSAO_ALTERADA            | Privado + Auditoria                              |
| PAGAMENTO_EXPIRADO            | Externo                                          |
| ESTOQUE_INSUFICIENTE          | Interno (Vendas & Operação/Estoque)              |
| LOJA_PAUSADA                  | Externo + Público                                |
| ENTREGA_ATRASADA              | Externo                                          |
| PEDIDO_EXPIRADO               | Externo + Auditoria                              |

---

## 6. Barramento de Eventos

Definição puramente arquitetural — nenhum produto/tecnologia é nomeado.

| Conceito          | Definição neste sistema                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Publisher**     | O Bounded Context dono do agregado que sofreu a mudança — só ele pode publicar evento sobre o próprio agregado.                                                                                                                          |
| **Subscriber**    | Qualquer contexto interessado, inscrito por tipo de evento — nunca por "tudo", sempre por contrato de quais eventos consome.                                                                                                             |
| **Event Bus**     | Componente arquitetural central que desacopla publisher de subscriber — o publisher não sabe (nem deveria saber) quem consome.                                                                                                           |
| **Versionamento** | Todo evento carrega uma versão de schema. Mudança incompatível gera novo tipo/versão do evento, nunca altera silenciosamente o significado de um evento existente — subscriber antigo continua funcionando até migrar.                   |
| **Idempotência**  | Todo subscriber trata reentrega do mesmo evento sem duplicar efeito — via identificador único do evento e registro do que já foi processado. Essencial porque "pelo menos uma entrega" é a garantia mais realista, não "exatamente uma". |
| **Retry**         | Falha temporária de um subscriber gera nova tentativa com espaçamento crescente — nunca reentrega imediata em loop.                                                                                                                      |
| **Dead Letter**   | Evento que falha todas as tentativas de entrega vai para um registro de observação manual — nunca é descartado silenciosamente. Alimenta diretamente a Observabilidade (Seção 13).                                                       |
| **Ordenação**     | Garantida por agregado/entidade (eventos do mesmo Pedido chegam e são processados em ordem) — entre agregados diferentes, não há garantia nem necessidade de ordem global.                                                               |
| **Correlação**    | Todo evento carrega um Correlation ID que permite reconstruir a cadeia de causa-efeito através de múltiplos contextos — a mesma identidade usada em Observabilidade (Seção 13).                                                          |

**Regra estrutural:** a publicação do evento é sempre **posterior** à confirmação da transação principal do agregado — o sucesso de uma operação de negócio nunca depende de o evento ter sido processado por ninguém. Isso é o que garante que uma falha no Event Bus (Seção 17, Riscos) nunca impede a operação central de Vendas & Operação.

**Garantia de publicação (princípio equivalente ao Outbox Pattern — Rodada 2):** "posterior à transação" não pode significar "torcer para que a publicação aconteça depois". O fato de que um evento _precisa_ ser publicado é registrado como parte da **mesma operação atômica** que a mudança de estado do agregado — se a mudança de estado é confirmada, o compromisso de publicar o evento correspondente também está garantido, mesmo que o sistema falhe exatamente entre os dois passos. A entrega real ao Event Bus pode acontecer um instante depois (é aí que o "posterior" da regra acima se aplica), mas a **garantia** de que ela vai acontecer nasce junto com a mudança de estado, não depois dela. Sem esse princípio, uma falha entre "estado mudou" e "evento publicado" perderia o evento silenciosamente — o pior tipo de bug, porque não gera erro visível, só um sistema gradualmente inconsistente.

---

## 7. Serviços Compartilhados

Infraestrutura de plataforma consumida por qualquer Bounded Context — nunca dona de regra de negócio de um contexto específico.

| Serviço                       | Responsabilidade                                                                      | Consumido por                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Autenticação**              | Verificar identidade de Usuário ou Cliente                                            | Todos os contextos com ação autenticada                                                                            |
| **Autorização/Permissões**    | Checar Papel × Permissão × Recurso antes de qualquer ação de escrita                  | Todo contexto de Tier 2 em diante                                                                                  |
| **Gerenciamento de Arquivos** | Upload/armazenamento de qualquer binário (Missão 0004, transversal)                   | Catálogo (foto de produto), Identidade & Empresa (logo), Comunicação (anexo)                                       |
| **Logs**                      | Registro estruturado de execução                                                      | Todos                                                                                                              |
| **Auditoria**                 | Registro append-only de ação sensível (Missão 0004, transversal)                      | Todo contexto com ação sensível                                                                                    |
| **Cache**                     | Ver Seção 8                                                                           | Contextos de leitura intensiva e baixa volatilidade                                                                |
| **Feature Flags**             | Habilitar/desabilitar funcionalidade por Empresa/plano sem alterar o resto do sistema | Qualquer contexto com funcionalidade condicionada a plano contratado (Configuração Global da Empresa, Missão 0004) |
| **Rate Limiting**             | Proteger contra abuso/sobrecarga em rota pública                                      | Vendas & Operação (checkout público), Ecossistema (API pública), Identidade & Empresa (login)                      |
| **Acesso a IA**               | Ponto único de acesso a capacidade de IA (Smart AI Guide)                             | Inteligência Artificial e qualquer contexto que consome uma de suas camadas                                        |

**Nota de desambiguação:** "Notificações" **não** está nesta lista — a orquestração de notificação (o quê, quando, para quem) é lógica de negócio do Bounded Context **Comunicação** (Seção 2), não um serviço genérico de infraestrutura. O que seria genérico (o mecanismo bruto de despacho de mensagem) é implementação, tratada na Missão 0006/0007, não nesta missão.

---

## 8. Estratégia de Cache

Puramente arquitetural — sem tecnologia.

| Regra                          | Detalhe                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quem usa**                   | Catálogo/Vitrine (leitura pública de alto volume, baixa frequência de mudança), Relatórios & Analytics (dado agregado caro de recalcular), Configuração da Loja/Identidade & Empresa (lida em praticamente toda requisição pública, muda raramente)                                                                                                                  |
| **Quem invalida**              | O próprio contexto dono do dado, no momento em que publica o evento de mudança correspondente (ex: `PRODUTO_ATUALIZADO` invalida o cache de Catálogo) — nunca um contexto de fora decide invalidar cache alheio                                                                                                                                                      |
| **Quem reconstrói**            | Reconstrução sob demanda (na primeira leitura após invalidação), não um processo obrigatório de reconstrução antecipada — evita custo de recalcular dado que pode nunca ser lido de novo                                                                                                                                                                             |
| **Quem nunca deve usar cache** | **Vendas & Operação** (estado do Pedido muda a cada segundo — cache aumentaria o risco de decisão sobre dado desatualizado, ex: cozinha vendo pedido já cancelado); **Pagamentos** (dado financeiro sensível precisa estar sempre atual); **Estoque**, quando o controle de disponibilidade está ativo (evitar overselling exige leitura sempre da fonte de verdade) |

---

## 9. Arquitetura das APIs

| Tipo                   | Consumidor                                                         | Característica                                                                                  |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **API Pública**        | Integrações externas (Ecossistema)                                 | Versionada, contrato estável de longo prazo, autenticação por chave/credencial por Empresa      |
| **API Interna**        | Painel de Gestão e Vitrine do próprio SmartFood                    | Evolui mais rápido que a pública, sem o mesmo compromisso de retrocompatibilidade estendida     |
| **API Administrativa** | Operação interna da Smart Platform (suporte, ferramentas internas) | Escopo elevado, nunca exposta ao comerciante                                                    |
| **API de Integração**  | Parceiros específicos (marketplace de pedido, contabilidade)       | Contrato dedicado, pode divergir do formato da API Pública genérica                             |
| **Webhook**            | Notificação de Evento Público (Seção 5) para fora da plataforma    | Assíncrono, com retry e assinatura de payload para verificação de autenticidade                 |
| **Callback**           | Entrada assíncrona de sistema externo (ex: gateway de pagamento)   | Tratado como Evento de Integração de entrada — nunca aceito como fonte de verdade sem validação |

- **Versionamento:** por contrato, não por implementação — nova versão só quando há quebra de compatibilidade; versão anterior mantida por período de transição anunciado.
- **Padrões:** todo endpoint segue o mesmo formato de erro, paginação e nomenclatura — candidato direto a um futuro Smart API Standards (Smart Platform, hoje coberto de forma resumida aqui).
- **Contrato:** toda API Pública/de Integração é especificada formalmente antes de implementada — nunca descoberta por leitura de código.

---

## 10. Estratégia Offline

| Pergunta                                  | Resposta                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Quais módulos podem operar offline**    | Nenhum contexto transacional central hoje. Partes específicas de UX (Missão 0003) podem exibir o último estado conhecido durante uma queda breve de conexão (resiliência de cliente), mas isso não é operação offline de dado — é tolerância de leitura.                                                                                                                                                                                                           |
| **Quais não podem**                       | **Pagamentos** (nunca confirma cobrança offline — risco financeiro/fraude); **Vendas & Operação** (criação de Pedido exige validação de disponibilidade e preço em tempo real).                                                                                                                                                                                                                                                                                    |
| **Sincronização/Conflitos/Reconciliação** | Como nenhum contexto central é offline-first, não há hoje necessidade de resolução de conflito distribuído — **decisão consciente de escopo**, não uma lacuna. Se no futuro um cenário exigir fila local de ação pendente (ex: Motoboy em área de sinal fraco), o princípio permanece: o servidor é sempre a fonte de verdade final — ação offline entra como proposta sujeita às mesmas regras e Invariantes (Missão 0004) de sempre, nunca aceita sem validação. |

---

## 11. Estratégia Multi-tenant

Expande o [ADR-0002](../../engineering/adr/ADR-0002-multi-tenant-por-empresa.md).

- **Isolamento:** toda leitura e escrita é implicitamente escopada por Empresa em todo Bounded Context — o próprio contrato de acesso a dado exige o identificador de Empresa, nunca depende de alguém "lembrar de filtrar".
- **O que é compartilhado:** infraestrutura de plataforma (Autenticação, Observabilidade, Event Bus, Serviços Compartilhados — Seção 7), a própria Smart Platform (Design System, Security Guide, AI Guide), e — de forma deliberadamente anônima e agregada — dado de comparação de mercado (Painel de Comparação Anônima, Missão 0002/0004) usado pela Inteligência Artificial.
- **O que nunca pode ser compartilhado:** qualquer dado transacional de negócio (Pedido, Cliente, Pagamento, Financeiro) entre Empresas diferentes, mesmo que pertençam ao mesmo grupo econômico — a única relação estrutural válida hoje é Empresa → várias Lojas (Multiloja, Missão 0002), nunca Empresa → Empresa.
- **Risco assumido conscientemente:** a equivalência Empresa = Tenant (ADR-0002) simplifica a arquitetura hoje, mas qualquer decisão futura de separar os dois conceitos na Smart Platform exigirá revisão desta seção — já registrado como dúvida aberta na Missão 0004.

---

## 12. Segurança Arquitetural

Fluxos conceituais, sem detalhe técnico de implementação.

| Fluxo            | Descrição                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação** | Identidade verificada uma vez no ponto de entrada; a sessão resultante carrega a identidade e a Empresa associada, usada por todo o resto do sistema — nunca re-verificada em cada contexto separadamente.                                                                                                                                                  |
| **Autorização**  | Toda operação de escrita passa por checagem de Papel × Permissão × Recurso **antes** de alcançar a lógica de domínio — nunca depois, nunca como um "if" opcional dentro da lógica de negócio.                                                                                                                                                               |
| **Auditoria**    | Toda ação sensível gera Registro de Auditoria de forma síncrona à própria ação — não é um evento de "melhor esforço" que pode se perder junto com uma falha do Event Bus.                                                                                                                                                                                   |
| **Identidade**   | Usuário (equipe interna) e Cliente (comprador final) são fluxos de identidade completamente separados, com mecanismos independentes — nunca compartilham sessão ou credencial (reforça a Linguagem Ubíqua da Missão 0004: "Cliente" e "Comerciante" nunca são a mesma pessoa no sistema, mesmo que sejam a mesma pessoa fisicamente em um negócio pequeno). |

---

## 13. Observabilidade

| Pilar                             | Como se aplica                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logs**                          | Estruturados, correlacionados por Correlation ID (Seção 6) — nunca texto solto sem contexto de rastreamento.                                                                                                                                                                                                                                                                                                                                                  |
| **Métricas**                      | Taxa de erro e latência medidas **por Bounded Context**, não só globalmente — um contexto de Tier 3+ degradando não deve ficar escondido atrás de uma métrica agregada saudável.                                                                                                                                                                                                                                                                              |
| **Tracing**                       | Rastreamento de uma requisição/evento através de múltiplos contextos, usando o mesmo Correlation ID de ponta a ponta.                                                                                                                                                                                                                                                                                                                                         |
| **Alertas**                       | Os 5 Eventos Negativos da Missão 0004 (`PAGAMENTO_EXPIRADO`, `ESTOQUE_INSUFICIENTE`, `LOJA_PAUSADA`, `ENTREGA_ATRASADA`, `PEDIDO_EXPIRADO`) são gatilho **direto** de alerta — não dado passivo esperando ser consultado.                                                                                                                                                                                                                                     |
| **Correlação**                    | Todo evento e toda requisição carregam identificador único que permite reconstruir a jornada completa de uma ação através de contextos.                                                                                                                                                                                                                                                                                                                       |
| **Health Checks**                 | Cada Bounded Context expõe seu próprio indicador de saúde. O sistema como um todo é considerado saudável apenas se os contextos de Tier 0-2 estiverem saudáveis; degradação em Tier 3+ é tolerada sem derrubar a operação central (ver Resiliência, Seção 15).                                                                                                                                                                                                |
| **Business Metrics** _(Rodada 2)_ | Distintas de métricas técnicas — medem a saúde do **negócio** em tempo real, não do sistema: taxa de conversão do checkout, ticket médio, taxa de cancelamento, tempo médio de preparo, taxa de recusa de pagamento. Consumidas por quem toma decisão de produto/operação, não só por quem opera infraestrutura — e, tecnicamente, alimentadas pelos mesmos Eventos de Domínio (Seção 5) que já circulam pela plataforma, sem exigir instrumentação paralela. |

---

## 14. Escalabilidade

| Dimensão                     | Estratégia                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Horizontal**               | Múltiplas instâncias do mesmo Bounded Context atendendo em paralelo — natural para contextos sem estado local retido entre requisições.                                                                                                            |
| **Vertical**                 | Aumentar recurso de uma instância — tratado como alívio de curto prazo, nunca estratégia de longo prazo (não passa no teste dos dez anos sozinho).                                                                                                 |
| **Por módulo/contexto**      | Cada Bounded Context escala de forma independente conforme sua própria carga — a decomposição da Seção 2 é o que **habilita** essa escolha; um pico de sexta à noite em Vendas & Operação não deveria forçar escalar Relatórios & Analytics junto. |
| **Por carga (multi-tenant)** | Uma Empresa com pico de tráfego não deve degradar a experiência de outra Empresa — isolamento de recurso por tenant é uma característica arquitetural a considerar desde o desenho, mesmo que a implementação inicial compartilhe recurso físico.  |

---

## 15. Resiliência

| Padrão                   | Aplicação                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeout**              | Toda chamada síncrona entre contextos tem tempo máximo de espera — nunca espera indefinida.                                                                                                    |
| **Retry**                | Para falha transitória, com espaçamento crescente, sempre respeitando idempotência (Seção 6).                                                                                                  |
| **Circuit Breaker**      | Se uma dependência (interna ou externa, ex: gateway de pagamento) falha consistentemente, parar de tentar temporariamente em vez de amplificar a falha para o resto do sistema.                |
| **Fallback**             | Comportamento alternativo quando uma dependência não crítica falha — ex: se a Recomendação de IA falhar, a Vitrine mostra o catálogo padrão sem recomendação, nunca quebra a navegação.        |
| **Bulkhead**             | Isolar recurso entre contextos para que a sobrecarga de um nunca consuma o recurso de outro — reforça diretamente a decomposição da Seção 2/3.                                                 |
| **Graceful Degradation** | O sistema sempre prioriza Tier 0-2 (Identidade & Empresa, Catálogo, Vendas & Operação) — o negócio central continua funcionando mesmo que Relatórios, IA ou Ecossistema estejam indisponíveis. |

---

## 16. ADRs (lista de decisões — texto completo a escrever separadamente)

Conforme o Smart Mission Workflow v1.1, apenas a lista é produzida aqui; cada item vira um ADR completo (contexto, decisão, alternativas, consequências) assim que esta missão for consolidada:

- **ADR-0004** — Bounded Context como unidade de decomposição, não 1:1 com Domínio de produto da Missão 0002.
- **ADR-0005** — Fusão de Comercial e Operacional em um único Bounded Context (Vendas & Operação).
- **ADR-0006** — Comunicação assíncrona por Evento de Domínio como padrão entre contextos; chamada síncrona é exceção justificada.
- **ADR-0007** — Cache proibido nos contextos transacionais críticos (Vendas & Operação, Pagamentos, Estoque com controle ativo).
- **ADR-0008** — Nenhuma estratégia offline para contextos transacionais centrais no horizonte atual do produto.
- **ADR-0009** — Publicação de evento sempre posterior à confirmação da transação principal — sucesso de negócio nunca depende de o evento ser processado.
- **ADR-0010** — "Comunicação" é Bounded Context com lógica de negócio própria, não serviço compartilhado genérico.
- **ADR-0011** _(Rodada 2)_ — Inteligência Artificial e Relatórios & Analytics classificados como Capabilities/Read Platform, não Bounded Contexts, com gatilho de reclassificação documentado.
- **ADR-0012** _(Rodada 2)_ — Anti-Corruption Layer obrigatória em toda fronteira com sistema externo — parceiro se adapta ao domínio, nunca o contrário.
- **ADR-0013** _(Rodada 2)_ — Garantia de publicação de evento atômica à mudança de estado (princípio equivalente ao Outbox Pattern), independente do momento real de entrega.

---

## 17. Riscos Arquiteturais

| Risco                                            | Descrição                                                                                                                                                                                                                        | Mitigação                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gargalo central**                              | Vendas & Operação (Tier 2) é o contexto mais requisitado do sistema — herda o risco de acoplamento do agregado Pedido já identificado na Missão 0004.                                                                            | Escalar horizontalmente esse contexto com prioridade máxima; nunca deixar contexto de menor criticidade competir pelo mesmo recurso.                                                                                                                                                                                                                                                                      |
| **Ponto único de falha**                         | O Event Bus é dependência implícita de toda comunicação assíncrona entre contextos.                                                                                                                                              | Dead Letter + reprocessamento manual (Seção 6); nenhuma operação crítica de escrita depende do evento ser processado com sucesso para a própria transação se completar.                                                                                                                                                                                                                                   |
| **Dependência externa perigosa**                 | Pagamentos depende de gateway fora do controle arquitetural do SmartFood.                                                                                                                                                        | Circuit Breaker + Fallback (Seção 15); o Invariante "Pedido pode existir antes do Pagamento confirmado" (Missão 0004) já desacopla estruturalmente o fluxo.                                                                                                                                                                                                                                               |
| **Acoplamento de fundação**                      | Identidade & Empresa é dependência de praticamente todo contexto (Tier 0) — o raio de impacto de uma falha ali é máximo.                                                                                                         | Mitigação primariamente disciplinar: mudança nesse contexto exige revisão extra, nunca deploy de rotina; observabilidade prioritária (Seção 13).                                                                                                                                                                                                                                                          |
| **Contrato público engessando evolução interna** | Ecossistema exige contrato estável — mudança de modelo interno de um contexto exposto publicamente tem custo de quebra externa.                                                                                                  | Versionamento explícito por contrato (Seção 9); nunca expor modelo interno diretamente, sempre um contrato traduzido.                                                                                                                                                                                                                                                                                     |
| **Proliferação de eventos** _(Rodada 2)_         | Sem governança, o número de tipos de evento cresce sem controle — eventos redundantes, mal nomeados, ou publicados "por precaução" sem consumidor real, tornando o Barramento de Eventos (Seção 6) difícil de entender e manter. | Governança explícita: todo novo tipo de evento passa por revisão antes de ser publicado (mesmo padrão de disciplina do Princípio 9, Seção 1); versionamento obrigatório (Seção 6); manter um **catálogo de eventos** — a tabela da Seção 5 é o embrião desse catálogo e deve ser tratada como fonte de verdade viva, não documentação estática, à medida que novos eventos surgirem nas próximas missões. |

---

## 18. Preparação para a Missão 0006 (Modelagem do Banco de Dados)

Esta arquitetura entrega à Missão 0006 exatamente o que ela precisa para não redefinir nenhum conceito de negócio:

- **Cada Bounded Context (Seção 2) tende a possuir sua própria fronteira de dado** — mesmo que fisicamente colocado num único banco no MVP, o desenho lógico já assume que cada contexto poderia migrar para um armazenamento próprio sem redesenho do modelo.
- **Os Agregados da Missão 0004 mapeiam diretamente para o núcleo de tabelas/coleções de cada contexto** — Pedido e Comanda pertencem a Vendas & Operação; Pagamento a Pagamentos; e assim por diante, seguindo exatamente a tabela da Seção 2.
- **Value Objects continuam embutidos, nunca viram tabela própria com chave estrangeira** — decisão herdada da Missão 0004, reforçada aqui pela regra de que nenhum contexto deve depender de JOIN cruzando fronteira de outro contexto.
- **Serviços Compartilhados (Seção 7) — Auditoria, Arquivos, Feature Flags — ganham sua própria fronteira de dado, consumida por todos e possuída por nenhum contexto de negócio.**
- **Isolamento multi-tenant (Seção 11) precisa virar decisão explícita e obrigatória de modelagem** em toda tabela de todo contexto — identificador de Empresa presente desde a primeira migração, nunca adicionado depois.
- **Eventos de Domínio (Seção 5/6) sugerem a necessidade de um mecanismo de registro de evento publicado**, distinto do Registro de Auditoria (Missão 0004) — decisão que a Missão 0006 precisa tornar explícita ao desenhar persistência.
- **A classificação de Cache (Seção 8) já indica quais dados NÃO precisam de modelagem transacional rígida** (Relatórios, Comparação Anônima) — podem tolerar reconstrução, ao contrário do núcleo de Vendas & Operação/Pagamentos.

A Missão 0006 nasce, portanto, diretamente desta arquitetura — não como uma etapa isolada de "agora vamos pensar em banco de dados", mas como a tradução física de fronteiras que já foram decididas aqui.

---

## 19. Princípios Arquiteturais Permanentes (a Constituição desta Arquitetura)

_Adicionado na Rodada 2, a pedido explícito da revisão._ Diferente dos "Princípios arquiteturais" da Seção 1 — que orientam como ler e aplicar este documento — os princípios abaixo são o subconjunto que deve **sobreviver a qualquer mudança futura de tecnologia, equipe ou fornecedor**. Uma mudança que viole um destes princípios não é uma evolução da arquitetura — é uma arquitetura diferente, e precisa ser tratada (e decidida) como tal, nunca como um ajuste incremental.

1. **Bounded Context é a fronteira de modelo e linguagem — nunca uma pasta de conveniência de código.** Se dois conceitos não compartilham linguagem, não pertencem ao mesmo contexto, independentemente de conveniência de implementação.
2. **Agregado é a única fronteira de consistência transacional forte que este sistema reconhece.** Nenhuma necessidade futura de "consistência mais forte entre dois contextos" deve ser resolvida com transação distribuída — deve ser resolvida repensando a fronteira do agregado ou aceitando consistência eventual.
3. **Um Evento é sempre um fato do passado; um Bounded Context nunca comanda outro através de evento.** Toda decisão pertence a exatamente um dono (Seção 2, Ownership) — o resto do sistema reage, nunca ordena de fora.
4. **A garantia de publicação de um evento nasce atômica à mudança de estado que o originou** (Seção 6) — nenhum evento relevante pode se perder silenciosamente entre "o fato aconteceu" e "o fato foi comunicado".
5. **Nenhum Bounded Context lê ou escreve o modelo interno de outro.** Toda travessia de fronteira é contrato explícito (síncrono) ou evento (assíncrono) — nunca acesso direto, em nenhuma circunstância, para nenhum ganho de performance de curto prazo.
6. **Sistema externo nunca molda o modelo interno.** Toda integração passa por Anti-Corruption Layer (Seção 2) — o SmartFood fala sua própria língua internamente, sempre.
7. **Isolamento por Empresa (multi-tenant) é absoluto e não-negociável** — nenhuma exceção de performance, conveniência de implementação ou prazo de entrega justifica dado transacional cruzando fronteira de Empresa.
8. **Multiplicar dono de decisão é sempre um bug de arquitetura.** Se duas partes do sistema podem decidir a mesma coisa de forma independente, a Seção 2 (Ownership) foi violada e precisa ser corrigida antes de qualquer outra coisa.

Estes oito princípios são o critério final de avaliação de qualquer proposta técnica nas próximas missões: se uma proposta de implementação exige violar um destes pontos, a proposta está errada — não este documento.

---

_Fim do documento — Missão 0005, ✅ CONGELADA. Ver [missao-0005-review-notes.md](../../engineering/review-notes/missao-0005-review-notes.md) para o histórico completo da revisão. Os 10 ADRs listados na Seção 16 estão escritos por completo em [docs/engineering/adr/](../../engineering/adr/README.md)._
