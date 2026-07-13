# SmartFood — Proposta de Escopo da Missão 0007

**Status:** 🟢 Escopo aprovado (2026-07-11), com 6 refinamentos incorporados — **ainda não é a Missão 0007 em si**, é o documento que governa como ela será conduzida quando aberta oficialmente como Draft. Nenhuma tecnologia é escolhida aqui.
**Autor:** Claude, a pedido explícito do usuário ("sua tarefa é propor a Missão 0007").
**Referências:** [Smart Platform Architecture v1.1.0](../../../Smart%20Platform/SMART_PLATFORM_ARCHITECTURE_v1.0.md) · Missões 0001-0006 (todas congeladas) · [ADRs 0001-0018](../engineering/adr/README.md)

---

## 1. Objetivo da Missão

A Missão 0007 resolve o problema de **traduzir seis missões de arquitetura tecnologicamente neutra em uma stack real**, sem repetir o erro mais comum dessa transição: escolher "vamos usar X ou Y" antes de ter listado, com precisão, quais problemas a tecnologia precisa resolver. As Missões 0002-0006 já entregaram exatamente essa lista de problemas — Bounded Contexts, Barramento de Eventos, isolamento multi-tenant em três níveis, fronteiras de schema, Invariantes — a Missão 0007 escolhe _o que implementa_ isso, não _o que fazer_.

Ela também resolve um segundo problema, específico deste momento do projeto: a Smart Platform Architecture (documento compartilhado entre todos os produtos Smart) já declara um stack default (React+TS+Tailwind, Node.js com Express ou NestJS, PostgreSQL+Prisma, JWT, Docker, Vercel+Railway/Coolify). A Missão 0007 **não parte de uma folha em branco** — ela existe para **confirmar, refinar ou revisar conscientemente** esse stack já declarado, usando o SmartFood como o primeiro produto com arquitetura de solução e modelo de dado totalmente especificados para validá-lo de verdade contra requisito real, não hipotético. A Smart Platform funciona aqui como **contrato institucional**, não como referência opcional — e o SmartFood é a primeira validação prática desse contrato.

---

## 2. Escopo

### Entra

- Confirmação ou evolução do stack já declarado na Smart Platform Architecture, à luz dos requisitos concretos das Missões 0002-0006 — decisão explícita de "herdar como está" ou "desviar e justificar", nunca herança silenciosa.
- **Arquitetura de implantação**: como os 10 Bounded Contexts + 2 Capabilities (Missão 0005) mapeiam para unidades de deploy — monólito modular único, múltiplos serviços, ou topologia híbrida.
- Mecanismo real (tecnologia) para o **Barramento de Eventos** conceitual (Missão 0005, Seção 6) e para a **Garantia de Publicação** (ADR-0013).
- Mecanismo de **imposição automática de multi-tenant** nos três níveis já definidos (Empresa/Loja/Global — Missão 0006, Seção 5) na camada de acesso a dado.
- Tecnologia de **cache** para os contextos onde é permitido (Missão 0005, Seção 8).
- **Storage de arquivo** (já apontado como "S3 ou compatível" pela Smart Platform) — confirmar provedor.
- **Observabilidade real**: ferramenta de log estruturado, métricas por Bounded Context, tracing, health checks, alertas sobre os 5 Eventos Negativos (Missão 0004/0005).
- **CI/CD** e aplicação prática dos três ambientes já definidos (Smart Platform Architecture, Seção 2).
- **Estratégia de testes** (unitário, integração, contrato entre Bounded Contexts).
- **Versionamento de API e de schema de evento** (mecanismo real para o que a Missão 0005, Seção 9, já pediu conceitualmente).
- **Gestão de configuração e segredo** por ambiente.

### Fica deliberadamente fora

- Qualquer linha de código ou schema físico de banco — isso é Missão 0008 (Smart Starter Kit).
- Telas e fluxos de UX — já resolvidos na Missão 0003, não reabertos.
- Novo escopo de produto ou funcionalidade — Missões 0001/0002 permanecem congeladas.
- Escolha de provedor de nuvem além do que a Smart Platform já declarou (Vercel + Railway/Coolify), a menos que a análise desta missão encontre motivo técnico concreto para revisar essa escolha — reabrir por preferência não é motivo válido.
- Precificação, plano comercial, GTM — fora do escopo arquitetural (pertence a `docs/business/`, ainda não iniciado).

---

## 3. Decisões que Deverão Ser Tomadas (lista, sem escolher)

| Camada                            | Decisão a tomar                                                                                   | Já há um default declarado na Smart Platform?                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Runtime/Linguagem                 | Confirmar Node.js + TypeScript                                                                    | Sim — Smart Platform Architecture, Seção 1                                                         |
| Framework de backend              | Express vs. NestJS vs. outro, para os 10 Bounded Contexts do SmartFood especificamente            | Sim, mas "por porte de projeto" — decisão explícita ainda não feita para o SmartFood               |
| Arquitetura de implantação        | Monólito modular único / múltiplos serviços / híbrido                                             | Não                                                                                                |
| SGBD                              | Produto relacional específico                                                                     | Não — só o paradigma (relacional) já está implícito no vocabulário da Missão 0006                  |
| ORM ou acesso direto              | Prisma (default) vs. alternativa vs. query builder                                                | Sim, mas a confirmar contra as restrições dos ADRs (ex: ADR-0016, nunca FK física entre contextos) |
| Estratégia de schema físico       | Schema único com discriminador / múltiplos schemas no mesmo banco / bancos separados por contexto | Não — Missão 0006, Seção 9, propôs schema-per-contexto conceitual, falta decisão física            |
| Barramento de Eventos             | Fila gerenciada / broker auto-hospedado / solução baseada no próprio banco (outbox + polling)     | Não                                                                                                |
| Cache                             | Tecnologia específica                                                                             | Não                                                                                                |
| Storage de arquivo                | Provedor específico                                                                               | Sim, categoria ("S3 ou compatível") — falta o provedor                                             |
| Autenticação/Autorização          | Biblioteca/estratégia de implementação de JWT+Refresh e de RBAC físico                            | Sim, categoria — falta implementação                                                               |
| Frontend                          | Meta-framework (se houver) sobre React+TS+Tailwind                                                | Sim, base — falta meta-framework                                                                   |
| Observabilidade                   | Ferramenta de log/métrica/tracing/alerta                                                          | Não                                                                                                |
| CI/CD                             | Pipeline concreto                                                                                 | Sim, categoria (Smart Platform Architecture, Seção 11) — falta ferramenta                          |
| Containers                        | Confirmar Docker; decidir orquestração se necessária                                              | Sim, base — falta decidir se orquestração é necessária neste estágio                               |
| Cloud/Hosting                     | Confirmar Vercel + Railway/Coolify para o perfil de carga do SmartFood                            | Sim — a confirmar, não a redecidir sem motivo                                                      |
| Testes                            | Framework e estratégia (unitário/integração/contrato)                                             | Não                                                                                                |
| Versionamento de API              | Mecanismo (URL, header, etc.)                                                                     | Não                                                                                                |
| Versionamento de schema de evento | Mecanismo real                                                                                    | Não                                                                                                |
| Segredo/configuração              | Estratégia de gestão por ambiente                                                                 | Não                                                                                                |

### 3.1 Matriz de Decisão Tecnológica (template obrigatório — Refinamento 1)

Cada uma das decisões acima, quando a Missão 0007 for aberta, **não recebe apenas uma escolha final** — recebe uma matriz de decisão registrada por escrito, seguindo este formato:

| Decisão      | Alternativa A | Alternativa B | Alternativa C        | Critérios avaliados (Seção 5)     | Escolha                                   | Classificação (3.2)                              | Horizonte (3.3)     |
| ------------ | ------------- | ------------- | -------------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------------ | ------------------- |
| _(ex: SGBD)_ | _(opção)_     | _(opção)_     | _(opção, se houver)_ | _(quais da Seção 5 pesaram mais)_ | _(a escolhida, com 1-2 frases de porquê)_ | _(Padrão Plataforma / Padrão Produto / Exceção)_ | _(1 / 3 / 10 anos)_ |

**Objetivo:** que "por que escolhemos X?" sempre tenha resposta objetiva e rastreável — nunca "porque parecia bom" — sem precisar reabrir a decisão para descobrir o motivo. Decisões de maior peso (ver Seção 7, Riscos) viram ADR completo além da linha na matriz; decisões menores ficam registradas só na matriz, dentro do documento consolidado da Missão 0007.

### 3.2 Classificação: Padrão da Plataforma vs. Padrão do Produto vs. Exceção (Refinamento 2)

Cada tecnologia escolhida recebe uma classificação, para que uma decisão tomada por necessidade local do SmartFood nunca seja mal-entendida como padrão institucional (ou vice-versa):

- **Padrão da Smart Platform** — a escolha vale (ou deveria valer) para qualquer produto Smart novo; diverge dela exige justificativa. Ex: se o SGBD escolhido aqui confirma o que a Smart Platform já declara, ele é Padrão da Plataforma.
- **Padrão específico do SmartFood** — faz sentido para as características deste produto (ex: alto volume transacional, necessidade de tempo real no Painel de Pedidos), mas não é prescrito a outros produtos Smart automaticamente.
- **Exceção temporária** — escolhida por restrição prática do momento (prazo, custo, equipe), com intenção explícita de revisão futura — sempre acompanhada de uma entrada na Seção 3.4 (Dívida Tecnológica Deliberada).

### 3.3 Horizonte de Decisão (Refinamento 4)

Toda decisão da matriz recebe também um horizonte esperado de validade, para orientar quando ela deve ser revisada no futuro:

- **Horizonte de 1 ano** — decisões operacionais, fáceis de trocar (ex: ferramenta específica de observabilidade).
- **Horizonte de 3 anos** — decisões de produtividade/processo, moderadamente custosas de trocar (ex: pipeline de CI/CD).
- **Horizonte de 10 anos** — decisões estruturais, caras de reverter (ex: containerização com Docker, escolha de SGBD, linguagem/runtime).

### 3.4 Dívida Tecnológica Deliberada (Refinamento 3 — nova seção conceitual)

Toda decisão tomada conscientemente para acelerar o MVP, sabendo que pode precisar mudar depois, é registrada aqui — nunca deixada só na cabeça de quem decidiu. Formato:

> _"Estamos usando [decisão] porque [motivo de aceleração/custo/prazo], sabendo que [condição de revisão] pode levar a migrar para [alternativa] em aproximadamente [horizonte]."_

Toda entrada de Dívida Tecnológica Deliberada é, por definição, uma decisão classificada como **Exceção Temporária** (Seção 3.2). O documento consolidado da Missão 0007 mantém essa lista viva — não é escrita uma vez e esquecida, é revisitada a cada marco relevante do produto (ex: primeira centena de Empresas ativas, primeira exigência de compliance).

---

## 4. Dependências — o Que Sustenta Cada Decisão

- **Smart Platform Architecture v1.1.0** — stack já declarado; ponto de partida obrigatório, não uma folha em branco. Qualquer desvio precisa virar proposta explícita de nova versão desse documento (mesma disciplina já usada quando o próprio padrão de backend foi corrigido de "sempre NestJS" para "Express ou NestJS por porte").
- **Missão 0005 (Arquitetura da Solução)** — Bounded Contexts, tiers, comunicação, Barramento de Eventos conceitual, cache, APIs, segurança, observabilidade, escalabilidade, resiliência: cada decisão técnica precisa satisfazer o que já está ali sem contradição.
- **Missão 0006 (Modelagem do Banco de Dados)** — schema lógico, multi-tenant de três níveis, fronteiras de schema: ponto de partida direto para SGBD e ORM.
- **Missão 0004 (Modelagem do Domínio)** — os 8 Invariantes e 11 Agregados são o critério de aceite: qualquer stack escolhida precisa conseguir expressá-los sem distorção.
- **Missão 0003 (UX e Jornadas)** — influencia decisão de frontend e de tempo real (ex: Painel de Pedidos e Fila da Cozinha, Kanban ao vivo, apontam para necessidade de atualização em tempo real, não só requisição sob demanda).
- **ADRs 0001-0018** — cada um é uma restrição real, não uma sugestão. Exemplos diretos: ADR-0016 (nunca FK física entre Bounded Contexts) restringe como o ORM pode ser usado entre schemas; ADR-0013 (garantia de publicação atômica) restringe como o mecanismo de evento precisa se integrar à transação de escrita.
- **Precedente real dentro do ecossistema Smart**: SmartNCM já roda em Node+Express+Prisma+PostgreSQL+Docker — sinal concreto do que já funciona, não teórico. SmartOS (Firebase) foi conscientemente excluído de migração — não é precedente a seguir, é a exceção já documentada.

---

## 5. Critérios de Escolha

O critério adicionado pelo usuário nesta missão muda a pergunta central:

> Não é "qual é a melhor stack para o SmartFood?" — é **"qual stack cria um padrão que poderá ser reutilizado por todos os produtos da Smart Platform nos próximos anos?"**

Isso eleva **Reutilização na Smart Platform** a critério de maior peso, não apenas mais um item da lista. Os demais critérios continuam relevantes, mas são avaliados também sob essa lente:

| Critério                                        | O que significa aplicado ao SmartFood                                                                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reutilização na Smart Platform** (peso maior) | A escolha vira o padrão de referência para SmartCRM/SmartTrans/futuros produtos, ou é uma decisão isolada do SmartFood? Uma tecnologia "ótima só para este caso" perde para uma "muito boa e replicável"                                               |
| Maturidade                                      | Ecossistema estável, documentação e tempo de mercado suficientes para um produto que se pretende viver 10 anos                                                                                                                                         |
| Custo                                           | Incluindo custo por tenant — relevante porque o SmartFood é SaaS multi-tenant com margem sensível a comissão (Missão 0001)                                                                                                                             |
| Lock-in                                         | O quanto prende a um fornecedor específico — tensiona diretamente com a promessa de portabilidade da Missão 0005 (Bounded Contexts migráveis)                                                                                                          |
| Performance                                     | Em especial para Vendas & Operação, já identificado como o Bounded Context de maior carga (Missão 0005, Seção 17)                                                                                                                                      |
| Comunidade/suporte de longo prazo               | Reduz risco de abandono da tecnologia antes do produto                                                                                                                                                                                                 |
| Curva de aprendizado                            | Relevante dado o padrão observado nos projetos Smart — times enxutos, decisão precisa ser operável por poucas pessoas                                                                                                                                  |
| Escalabilidade                                  | Horizontal, por Bounded Context — já um requisito arquitetural da Missão 0005, Seção 14                                                                                                                                                                |
| Produtividade de desenvolvimento                | Velocidade de entrega do MVP sem comprometer os Invariantes já congelados                                                                                                                                                                              |
| Manutenção de longo prazo                       | O teste dos "10 anos", já adotado como mindset desde a Missão 0005                                                                                                                                                                                     |
| Integração com a Smart Platform                 | Capacidade de consumir/servir Design System, Security Guide, AI Guide e Mission Workflow sem fricção                                                                                                                                                   |
| **Operabilidade** _(Refinamento 5)_             | Quanto esforço operacional a tecnologia exige de uma equipe pequena — distinto de produtividade: uma tecnologia pode ser ótima para desenvolver e difícil de operar (monitorar, atualizar, recuperar de falha). Peso alto para SaaS com equipe enxuta. |
| **Compatibilidade com IA** _(Refinamento 6)_    | Facilita ou dificulta o futuro já previsto da Smart Platform (Smart AI Guide, agentes, automações, MCP, ferramentas inteligentes)? Não precisa ser decisivo isoladamente, mas precisa ser avaliado em toda decisão relevante.                          |

---

## 6. Roadmap Interno Proposto

_Renomeado de "0007.1-0007.5" para "Etapa A-E" nesta revisão, para não colidir com a Missão 0007.5 (Arquitetura Executável) recomendada pelo usuário — ver nota ao final desta seção._

| Etapa | Conteúdo                                                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Confirmação ou revisão do stack já declarado (frontend, backend, banco, ORM, auth, deploy) — decisão "herdar ou desviar", com justificativa individual por item, já usando a Matriz de Decisão (Seção 3.1) |
| **B** | Arquitetura de implantação — mapeamento de Bounded Context para unidade de deploy                                                                                                                          |
| **C** | Mensageria/Barramento de Eventos real, cache, storage                                                                                                                                                      |
| **D** | Observabilidade, CI/CD, testes, versionamento de API/evento                                                                                                                                                |
| **E** | Consolidação — documento único de Arquitetura Técnica + ADRs correspondentes + lista de Dívida Tecnológica Deliberada, seguindo o Smart Mission Workflow normalmente a partir daqui                        |

Etapas internas não substituem o ciclo Draft → Review CTO/PO do Smart Mission Workflow — são a organização interna do conteúdo de um único Draft, ou, se o volume justificar, sub-missões formais a critério da revisão quando a Missão 0007 for de fato aberta.

**Nota — Missão 0007.5 "Arquitetura Executável" (recomendação do usuário, registrada para depois da 0007, não incluída no escopo desta proposta):** consolidar todas as decisões tecnológicas aprovadas em um "Blueprint Técnico"/manual de arquitetura para quem for desenvolver — estrutura oficial do repositório, organização de Bounded Context em código, padrão de nomenclatura, como criar um novo contexto, como publicar um evento, como escrever teste, como versionar API, como configurar ambiente, como rodar localmente, como funciona o deploy. Objetivo: reduzir interpretação divergente entre desenvolvedores e acelerar onboarding. Fica como próximo passo natural após a Missão 0007 congelar, antes da Missão 0008 (Smart Starter Kit) — a confirmar formalmente quando chegar a hora.

---

## 7. Riscos

| Risco                                                                                  | Categoria                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escolha de SGBD                                                                        | **Praticamente irreversível** — migração de motor de banco com dado real em produção é uma das operações mais caras que existem                                                                                                                                                             |
| Arquitetura de implantação (monólito vs. múltiplos serviços)                           | **Alto custo de reverter** — uma vez que times, deploy e monitoramento se organizam em torno da topologia escolhida                                                                                                                                                                         |
| Linguagem/runtime                                                                      | Já herdado da Smart Platform, não decidido nesta missão — risco de reabertura desnecessária                                                                                                                                                                                                 |
| ORM específico                                                                         | **Reversível com esforço moderado** — mais fácil de trocar que o banco em si, desde que os Bounded Contexts continuem sem FK física entre si (ADR-0016)                                                                                                                                     |
| Ferramenta de observabilidade / provedor de cache / pipeline de CI/CD                  | **Reversível com baixo custo** — trocável sem afetar o modelo de domínio                                                                                                                                                                                                                    |
| **Decidir sem escopo definido**                                                        | Risco de processo, não de tecnologia — exatamente o que esta proposta existe para evitar                                                                                                                                                                                                    |
| **Sobre-engenharia**                                                                   | Dado o mindset dos "10 anos", há risco real de a Missão 0007 especificar infraestrutura madura demais (ex: orquestração complexa) para um MVP sem usuário real ainda — tensão a ser gerenciada explicitamente na Missão 0007, não resolvida aqui                                            |
| **Divergência silenciosa da Smart Platform**                                           | Se a Missão 0007 escolher algo diferente do que a Smart Platform Architecture já declara, isso precisa virar uma proposta explícita de nova versão desse documento — nunca uma divergência não registrada entre "o que o SmartFood faz" e "o que a Smart Platform diz que todo produto faz" |
| **Dívida Tecnológica Deliberada não revisitada** _(novo, decorrente do Refinamento 3)_ | Uma "Exceção Temporária" registrada e nunca mais revisitada vira, na prática, uma decisão permanente por omissão.                                                                                                                                                                           | Mitigação: a lista de Dívida Tecnológica (Seção 3.4) precisa ser revisitada em marcos definidos, não apenas escrita uma vez. |

---

_Fim da proposta — 🟢 escopo aprovado com os 6 refinamentos acima incorporados. Pronta para a Missão 0007 ser aberta oficialmente como Draft, seguindo o Smart Mission Workflow._
