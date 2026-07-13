# SmartFood — Arquitetura Técnica e Stack Tecnológica

**Missão 0007**
**Status:** ✅ CONGELADA — versão oficial (aprovada em 2026-07-12, após Rodada 2 de ajustes recomendados)
**Referências obrigatórias:** [Smart Platform Architecture v1.1.0](../../../Smart%20Platform/SMART_PLATFORM_ARCHITECTURE_v1.0.md) · [Proposta de Escopo aprovada](missao-0007-proposta-escopo.md) · Missões 0001-0006 (todas congeladas) · [ADRs 0001-0024](../../engineering/adr/README.md)
**Histórico de decisões:** [missao-0007-review-notes.md](../../engineering/review-notes/missao-0007-review-notes.md)

## Premissa Central

**Nenhuma tecnologia é escolhida porque é popular.** Toda escolha demonstra, de forma objetiva, que atende a uma decisão arquitetural já congelada. Toda decisão nesta missão responde às seis perguntas abaixo — de forma completa para decisões significativas, de forma resumida para decisões operacionais de baixo risco:

1. Qual requisito arquitetural ela atende?
2. Quais alternativas foram avaliadas?
3. Por que foi escolhida?
4. Quais limitações ela possui?
5. Essa escolha reforça ou enfraquece a Smart Platform como padrão do ecossistema?
6. Essa decisão continua fazendo sentido para um produto com horizonte de 10 anos?

**Classificação de impacto**, aplicada a toda tecnologia aprovada: 🟢 Estratégica (dificilmente substituída) · 🟡 Tática (revisável em médio prazo) · 🔵 Operacional (facilmente substituível) · 🔴 Experimental (adotada conscientemente com risco, sempre acompanhada de entrada em Dívida Tecnológica Deliberada).

**Regra de ADR:** reservado para decisões que alteram significativamente a arquitetura. Nesta missão: Arquitetura de Implantação, Framework de Backend, Banco de Dados, Barramento de Eventos, Comunicação entre Módulos, Multi-tenant Físico, Autenticação. As demais ficam documentadas na Matriz de Decisão de cada seção, sem ADR próprio.

---

## 1. Arquitetura de Implantação

| Decisão             | Alternativa A                                    | Alternativa B                                 | Alternativa C                                                                           | Critérios que pesaram                                            | Escolha              |
| ------------------- | ------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------- |
| Topologia de deploy | Microsserviço por Bounded Context desde o início | Monólito único, sem modularidade por contexto | **Monólito Modular** — um único deployável, organizado internamente por Bounded Context | Operabilidade, Reutilização na Smart Platform, teste dos 10 anos | **Monólito Modular** |

**Respostas às 6 perguntas:**

1. **Requisito atendido:** Missão 0005, Seção 1 — o sistema deve "nascer como unidade coesa e evoluir para contextos independentemente implantáveis, sem redesenho do modelo de domínio." Um monólito modular com fronteiras de Bounded Context aplicadas em código (não só em documento) entrega exatamente isso.
2. **Alternativas avaliadas:** (A) 10 microsserviços desde o dia um — rejeitada: exige maturidade operacional (observabilidade distribuída, orquestração) que uma equipe pequena sem usuário real em produção ainda não precisa; risco de sobre-engenharia já sinalizado na proposta aprovada da Missão 0007. (B) Monólito sem modularidade — rejeitada: contradiz tudo construído desde a Missão 0004/0005; separar depois viraria redesenho, não mudança de infraestrutura.
3. **Por que escolhida:** compatível com o tamanho de equipe observado nos projetos Smart, custo de operação mínimo, e — decisivo — as fronteiras de Bounded Context já são fisicamente corretas (ADR-0016: nunca FK física entre contextos), então dividir fisicamente depois é uma mudança de infraestrutura, não de modelo.
4. **Limitações:** um contexto com problema de performance não escala isoladamente ainda; uma falha grave no processo afeta, em tese, todos os contextos (mitigado por Circuit Breaker/Bulkhead lógico dentro do próprio processo, Missão 0005 Seção 15).
5. **Smart Platform:** reforça — vira o padrão recomendado de partida para qualquer novo produto Smart em estágio inicial (SmartNCM já opera de forma equivalente, sem múltiplos serviços).
6. **Horizonte de 10 anos:** sim, como ponto de partida com saída desenhada — a divisão futura em serviços é o próprio propósito da Seção 2 da Missão 0005, não uma mudança de arquitetura.

**Classificação:** 🟢 Estratégica. **ADR:** [ADR-0019](../../engineering/adr/ADR-0019-arquitetura-implantacao-monolito-modular.md).

---

## 2. Backend

| Decisão   | Alternativa A | Alternativa B                                    | Alternativa C | Critérios que pesaram                                           | Escolha    |
| --------- | ------------- | ------------------------------------------------ | ------------- | --------------------------------------------------------------- | ---------- |
| Framework | **NestJS**    | Express (default "MVP enxuto" da Smart Platform) | Fastify puro  | Reutilização, Manutenção 10 anos, Integração com Smart Platform | **NestJS** |

**Respostas às 6 perguntas:**

1. **Requisito atendido:** a Smart Platform Architecture já deixa a escolha "por porte de projeto". O SmartFood tem 10 Bounded Contexts, 11 Agregados, Clean Architecture como mindset mandatório (Missão 0005, Princípio 7 — inversão de dependência) e Guards de permissão que precisam rodar antes de qualquer lógica de domínio (Missão 0005, Seção 12). NestJS entrega, nativamente: Módulos (mapeiam 1:1 a Bounded Context), Injeção de Dependência (SOLID/DIP sem reinventar), Guards (Papel×Permissão×Recurso antes da rota), Interceptors (Correlation ID de ponta a ponta, Missão 0005 Seção 6/13).
2. **Alternativas avaliadas:** Express — rejeitado para o SmartFood especificamente (não para outros produtos Smart menores, onde continua válido): exigiria reconstruir manualmente DI, fronteira de módulo e verificação de permissão pré-rota, com risco real de um desenvolvedor "furar" a fronteira de um Bounded Context sem que nada barre isso estruturalmente. Fastify puro — mesmo problema, ainda mais manual.
3. **Por que escolhida:** a estrutura do framework espelha a arquitetura já decidida (Bounded Context → Módulo NestJS) em vez de exigir disciplina manual para replicá-la.
4. **Limitações:** curva de aprendizado maior que Express para quem nunca usou; overhead de decorators/reflection um pouco maior em runtime (irrelevante na escala atual).
5. **Smart Platform:** reforça — confirma a decisão "por porte" já existente, e dá ao ecossistema um segundo exemplo real (além da já existente flexibilidade) de quando NestJS é a escolha certa: domínio complexo, múltiplos módulos, enforcement estrutural de permissão.
6. **Horizonte de 10 anos:** sim — a estrutura de módulos sobrevive à eventual divisão em serviços (Seção 1) quase sem alteração de código de domínio.

**Classificação:** 🟢 Estratégica. **ADR:** [ADR-0020](../../engineering/adr/ADR-0020-framework-backend-nestjs.md).

---

## 3. Frontend

| Decisão                                                                | Alternativa A | Alternativa B                                      | Alternativa C | Critérios que pesaram                                               | Escolha     |
| ---------------------------------------------------------------------- | ------------- | -------------------------------------------------- | ------------- | ------------------------------------------------------------------- | ----------- |
| Meta-framework sobre React+TS+Tailwind (já fixado pela Smart Platform) | **Next.js**   | Vite + React SPA puro (padrão já usado no SmartOS) | Remix         | Performance, Integração com Vercel (já escolhido), UX (Missão 0003) | **Next.js** |

**Respostas às 6 perguntas (resumidas — decisão tática, não ADR):**

1. **Requisito:** a Vitrine pública (Missão 0002/0003) precisa carregar rápido e ser compartilhável por link/QR Code — pede renderização no servidor. O Painel de Gestão e as telas operacionais (Missão 0003) são autenticadas, sem necessidade de SEO, mais próximas de SPA.
2. **Alternativas:** Vite+React SPA puro (como o SmartOS) — insuficiente para a Vitrine pública por SEO/performance de primeiro carregamento; Remix — capacidade equivalente, mas ecossistema/comunidade menor e sem a mesma sinergia direta com o Vercel já escolhido.
3. **Por que:** uma única aplicação Next.js atende a Vitrine (rotas com SSR/ISR) e o Painel/Operacional (rotas client-heavy) sem duplicar app/deploy.
4. **Limitações:** diverge do padrão Vite+React do SmartOS — decisão **consciente**, registrada como Padrão específico do SmartFood (não Padrão da Smart Platform ainda), já que SmartOS não será migrado (decisão anterior já registrada) e não há ainda evidência de qual dos dois padrões deve virar o default do ecossistema.
5. **Smart Platform:** neutro por ora — candidato a virar padrão se outro produto Smart tiver a mesma necessidade de página pública performática; não force a Smart Platform a escolher um dos dois ainda.
6. **10 anos:** sim, para o perfil de produto do SmartFood (site público + painel). Não necessariamente para todo produto Smart (ex: um produto 100% interno não precisaria de Next.js).

**Classificação:** 🟡 Tática. **ADR:** não (decisão de meta-framework sobre uma base já fixada, sem alterar arquitetura de domínio).

---

## 4. Banco de Dados

| Decisão | Alternativa A                           | Alternativa B | Alternativa C | Critérios que pesaram                                                           | Escolha        |
| ------- | --------------------------------------- | ------------- | ------------- | ------------------------------------------------------------------------------- | -------------- |
| SGBD    | **PostgreSQL** (default Smart Platform) | MySQL         | MongoDB/NoSQL | Maturidade, Aderência ao modelo relacional (Missão 0006), Integração com Prisma | **PostgreSQL** |

**Respostas às 6 perguntas:**

1. **Requisito atendido:** todo o vocabulário da Missão 0006 (tabela, schema, chave, integridade referencial dentro de agregado) é relacional por natureza. PostgreSQL tem `SCHEMA` nativo, mapeando 1:1 com o design de "schema por Bounded Context" (Missão 0006, Seção 9); suporte robusto a tipo composto/JSON para Value Objects embutidos (Missão 0006, Seção 4); Row-Level Security disponível como camada extra de defesa para o isolamento multi-tenant (Missão 0006, Seção 5).
2. **Alternativas avaliadas:** MySQL — rejeitado, suporte mais fraco a schema-per-contexto e a tipo composto/JSON nativo, sem vantagem real sobre Postgres para este caso. MongoDB/NoSQL — rejeitado com convicção: o domínio (Missão 0004) tem Invariantes que dependem de integridade transacional forte dentro de um Agregado, e o próprio vocabulário das Missões 0004-0006 (chave estrangeira, integridade referencial, transação) é relacional — forçar isso em um modelo de documento contrariaria o domínio, não serviria a ele.
3. **Por que escolhida:** já é o default da Smart Platform; o SmartFood valida esse default contra um domínio real e extenso, sem encontrar motivo para desviar.
4. **Limitações:** escalabilidade horizontal de escrita é mais trabalhosa que em alguns bancos distribuídos nativos — aceitável, dado que a carga real do MVP está longe desse limite, e a decomposição futura em serviços (Seção 1) já é a estratégia de escala principal, não sharding de banco.
5. **Smart Platform:** reforça diretamente — confirma o default institucional com o primeiro caso de uso real e complexo o suficiente para testá-lo de verdade.
6. **10 anos:** sim — PostgreSQL tem histórico de décadas, sem sinal de obsolescência.

**Classificação:** 🟢 Estratégica. **ADR:** [ADR-0021](../../engineering/adr/ADR-0021-banco-de-dados-postgresql.md).

---

## 5. ORM

| Decisão       | Alternativa A                                                      | Alternativa B          | Alternativa C | Critérios que pesaram                | Escolha                               |
| ------------- | ------------------------------------------------------------------ | ---------------------- | ------------- | ------------------------------------ | ------------------------------------- |
| Acesso a dado | **Prisma** (default Smart Platform), com convenção de uso restrita | Query builder (Kysely) | SQL puro      | Produtividade, Aderência ao ADR-0016 | **Prisma**, com convenção obrigatória |

**Respostas às 6 perguntas (resumidas):**

1. **Requisito:** produtividade de acesso a dado tipado, sem violar ADR-0016 (nunca FK física entre Bounded Contexts).
2. **Alternativas:** Kysely/SQL puro — mais controle, mas perdem produtividade e tipagem automática sem ganho real, dado que o Prisma já suporta a convenção necessária.
3. **Por que:** Prisma é o default já declarado; a única adaptação necessária é de **uso**, não de ferramenta — `@relation` (chave estrangeira física) só é usado dentro da fronteira de um mesmo Bounded Context (mesmo schema); referência entre contextos é sempre campo escalar simples, sem `@relation`, o que o Prisma já suporta sem gerar constraint física. Recomenda-se um Prisma Client/schema lógico por Bounded Context (mesmo dentro de um único banco físico), reforçando a fronteira na própria estrutura de código, não só por disciplina.
4. **Limitações:** consultas muito complexas que cruzam múltiplos contextos precisam ser compostas manualmente na camada de aplicação (já era a regra desde a Missão 0006, Seção 9 — não é limitação nova, é confirmação).
5. **Smart Platform:** reforça — confirma o default e adiciona uma convenção de uso reutilizável por qualquer produto Smart que também adote fronteira de Bounded Context.
6. **10 anos:** o ORM em si é 🟡 (trocável); a convenção de uso (sem FK cross-contexto) é 🟢 e sobrevive a qualquer troca de ferramenta futura.

**Classificação:** 🟡 Tática. **ADR:** não em separado — a convenção de uso está registrada dentro do [ADR-0022 (Comunicação entre Módulos)](../../engineering/adr/ADR-0022-comunicacao-entre-modulos.md).

---

## 6. Barramento de Eventos

| Decisão             | Alternativa A                     | Alternativa B                                         | Alternativa C                                                                                | Critérios que pesaram                       | Escolha                       |
| ------------------- | --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------- |
| Mecanismo de evento | Broker gerenciado (fila na nuvem) | Broker auto-hospedado (ex: fila própria em container) | **Outbox (`eventos_publicados`, já modelada na Missão 0006) + processo de relay in-process** | Operabilidade, Custo, aderência ao ADR-0013 | **Outbox + relay in-process** |

**Respostas às 6 perguntas:**

1. **Requisito atendido:** o Barramento de Eventos conceitual (Missão 0005, Seção 6) e a Garantia de Publicação atômica (ADR-0013) exigem que o compromisso de publicar nasça na mesma transação da mudança de estado. A tabela `eventos_publicados` (Missão 0006, Seção 7) já é o Outbox físico — falta só o mecanismo que lê e despacha.
2. **Alternativas avaliadas:** broker gerenciado na nuvem — rejeitado por ora: solução para entrega **entre processos/serviços**, que o SmartFood ainda não tem (Seção 1: monólito modular, um processo só) — adotá-lo agora seria pagar por um problema que ainda não existe (Custo, Operabilidade). Broker auto-hospedado — mesmo problema, com Operabilidade ainda pior (equipe pequena operando infraestrutura de mensageria sem necessidade real).
3. **Por que escolhida:** dentro de um único processo (monólito modular), despachar evento para um handler de outro módulo é uma chamada de função, não uma entrega de rede — o relay lê a tabela `eventos_publicados` não confirmados e invoca os handlers assinantes diretamente. Idempotência via ID único do evento; retry via nova tentativa de leitura; dead letter via a própria coluna de status já definida (Missão 0006, Seção 7); ordenação por agregado via ordenação da consulta; correlação via a coluna já definida.
4. **Limitações:** não sobrevive, como está, a uma futura divisão em múltiplos serviços — o passo de "despacho" precisará trocar de chamada in-process para publicação em um broker real. Migração prevista e projetada desde já: a tabela e o contrato de evento não mudam, só o mecanismo de entrega final.
5. **Smart Platform:** reforça fortemente — é um padrão de baixíssimo custo operacional, replicável por qualquer produto Smart que comece como monólito modular (a maioria, dado o padrão observado).
6. **10 anos:** o formato do evento e a tabela outbox são 🟢 (permanentes); o mecanismo de despacho é 🟡 (projetado para trocar quando a topologia mudar) — registrado como Dívida Tecnológica Deliberada (Seção 19).

**Classificação:** 🟡 Tática. **ADR:** [ADR-0023](../../engineering/adr/ADR-0023-barramento-eventos-outbox-relay.md).

---

## 7. Cache

| Decisão             | Alternativa A                     | Alternativa B                                                     | Alternativa C | Critérios que pesaram       | Escolha                          |
| ------------------- | --------------------------------- | ----------------------------------------------------------------- | ------------- | --------------------------- | -------------------------------- |
| Tecnologia de cache | Cache externo gerenciado desde já | **Cache em memória do processo**, atrás de interface substituível | Sem cache     | Operabilidade, Custo, YAGNI | **Cache em memória do processo** |

**Respostas às 6 perguntas (resumidas):**

1. **Requisito:** Missão 0005, Seção 8 — cache permitido só em Catálogo/Vitrine, Relatórios, Identidade&Empresa; nunca em Vendas & Operação/Pagamentos/Estoque controlado (ADR-0007).
2. **Alternativas:** cache externo gerenciado — rejeitado por ora, resolve um problema (múltiplas instâncias precisando de cache compartilhado) que só existe quando o monólito escalar horizontalmente (Seção 1 ainda é instância única no MVP).
3. **Por que:** com uma única instância do processo, cache em memória é trivialmente consistente — não há necessidade de invalidação distribuída ainda.
4. **Limitações:** deixa de ser suficiente no exato momento em que Vendas & Operação (ou Catálogo, no cenário Multiloja) precisar de mais de uma instância — condição já prevista e monitorável.
5. **Smart Platform:** neutro — decisão de estágio, não de padrão definitivo.
6. **10 anos:** não, deliberadamente — ver Dívida Tecnológica Deliberada (Seção 19).

**Classificação:** 🔴 Experimental — adotada conscientemente sabendo que será substituída. **ADR:** não.

---

## 8. Storage de Arquivo

| Decisão                | Alternativa A     | Alternativa B | Alternativa C | Critérios que pesaram               | Escolha           |
| ---------------------- | ----------------- | ------------- | ------------- | ----------------------------------- | ----------------- |
| Provedor S3-compatível | **Cloudflare R2** | AWS S3        | Vercel Blob   | Custo (sem taxa de egress), Lock-in | **Cloudflare R2** |

**Respostas às 6 perguntas (resumidas):**

1. **Requisito:** Smart Platform já define "S3 ou compatível" para o serviço compartilhado de Arquivos (Missão 0004/0005).
2. **Alternativas:** AWS S3 — rejeitado principalmente por custo de egress, relevante para um SaaS multi-tenant com muitas imagens de produto sendo lidas com frequência imprevisível. Vercel Blob — rejeitado por acoplar storage ao provedor de frontend, aumentando lock-in sem ganho real.
3. **Por que:** R2 é S3-compatível (troca de provedor não exige mudança de código, só de configuração, já que a Smart Development Guide exige acesso via serviço compartilhado, nunca SDK de vendor direto na lógica de negócio) e sem taxa de egress.
4. **Limitações:** ecossistema de ferramentas de terceiros ligeiramente menor que o do S3 "oficial" — irrelevante dado que a compatibilidade de API é o que importa.
5. **Smart Platform:** reforça — vira candidato natural a padrão institucional para qualquer produto Smart com upload de mídia frequente.
6. **10 anos:** sim, pela própria natureza de ser trocável sem esforço.

**Classificação:** 🔵 Operacional. **ADR:** não.

---

## 9. Autenticação e Autorização

| Decisão   | Alternativa A                                                           | Alternativa B                                     | Alternativa C                 | Critérios que pesaram                                                      | Escolha                         |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------- | ------------------------------- |
| Mecanismo | **JWT + Refresh Token, implementação própria via Passport.js (NestJS)** | Plataforma de identidade gerenciada (Auth0/Clerk) | Sessão via cookie de servidor | Custo por tenant, Aderência ao Invariante 4 (Cliente global), Reutilização | **JWT + Refresh Token próprio** |

**Respostas às 6 perguntas:**

1. **Requisito atendido:** Smart Platform já fixa JWT+Refresh. Missão 0005 (Seção 12) exige um único ponto de verificação, sessão carregando identidade+Empresa, e **dois fluxos de identidade completamente separados** (Usuário vs. Cliente) — Usuário escopado por Empresa, Cliente global (ADR-0017).
2. **Alternativas avaliadas:** plataforma de identidade gerenciada — rejeitada: (a) precificação por usuário ativo escala mal para um SaaS multi-tenant com muitas Empresas pequenas (Custo); (b) a dualidade Usuário-escopado-por-Empresa vs. Cliente-global é um requisito de domínio incomum o bastante para exigir contorno numa plataforma genérica, enquanto uma implementação própria expressa o Invariante diretamente na estrutura do token. Sessão via cookie de servidor — rejeitada, a Smart Platform já fixou JWT, sem motivo do SmartFood para desviar.
3. **Por que escolhida:** dois módulos de autenticação (Usuário e Cliente) emitem JWTs com claims diferentes — o de Usuário carrega `empresa_id`+`papel`; o de Cliente carrega `cliente_id`, sem `empresa_id` — a própria estrutura do token impede, por construção, que a implementação viole o Invariante 4 da Missão 0004.
4. **Limitações:** exige manter a lógica de hashing (bcrypt/argon2), rotação de refresh token e revogação por conta própria, em vez de delegar a um provedor especializado — aceito, dado que Passport.js + as bibliotecas padrão de JWT do ecossistema Node cobrem isso de forma madura.
5. **Smart Platform:** reforça fortemente — a separação de dois fluxos de identidade é um padrão que qualquer produto Smart multi-tenant com cliente-final global deveria considerar adotar.
6. **10 anos:** sim — a decisão anterior de não migrar SmartOS para um provedor externo de identidade, e a preferência já demonstrada no ecossistema por controle direto sobre autenticação, sustentam essa escolha no longo prazo.

**Classificação:** 🟢 Estratégica. **ADR:** [ADR-0024](../../engineering/adr/ADR-0024-autenticacao-jwt-dois-fluxos.md).

---

## 10. Observabilidade

| Decisão                                                  | Alternativa A                                                     | Alternativa B                            | Alternativa C          | Critérios que pesaram                                                                                    | Escolha                    |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------- |
| Logging                                                  | **Pino** (JSON estruturado)                                       | Winston                                  | console.log            | Performance, Padrão Node/NestJS                                                                          | **Pino**                   |
| Tracing/Métricas                                         | **OpenTelemetry** (instrumentação vendor-neutra)                  | SDK proprietário de um vendor específico | Nenhuma instrumentação | Lock-in, Reutilização na Smart Platform                                                                  | **OpenTelemetry**          |
| Backend de observabilidade (armazenar/consultar/alertar) | A escolher na implementação, entre opções compatíveis com Railway | —                                        | —                      | Custo/Operabilidade no estágio atual — decisão de baixo risco por já estar atrás de padrão aberto (OTel) | Em aberto, deliberadamente |

**Respostas às 6 perguntas (resumidas):**

1. **Requisito:** Missão 0005, Seção 13 — logs correlacionados, métricas por Bounded Context, tracing, health checks, alertas sobre os 5 Eventos Negativos, e Business Metrics (Rodada 2 da Missão 0005).
2. **Alternativas:** instrumentação proprietária de um vendor específico — rejeitada, cria lock-in e nenhuma vantagem sobre um padrão aberto.
3. **Por que:** Pino é o logger estruturado mais leve do ecossistema Node/NestJS; OpenTelemetry é o padrão de instrumentação aberto que qualquer backend de observabilidade consegue consumir — a escolha do vendor que armazena/exibe os dados fica deliberadamente para a implementação (Missão 0007.5), já que trocar de vendor depois não exige reinstrumentar o código.
4. **Limitações:** decisão de vendor final adiada — aceitável porque não é uma decisão arquitetural, é operacional.
5. **Smart Platform:** reforça — OpenTelemetry como padrão de instrumentação é diretamente reutilizável por qualquer produto Smart, independente de qual vendor cada um escolher depois.
6. **10 anos:** sim para a camada de instrumentação (padrão aberto); a camada de vendor é, por design, descartável.

**Classificação:** Pino/OTel = 🟡 Tática. Vendor de observabilidade = 🔵 Operacional (a decidir na implementação). **ADR:** não.

---

## 11. CI/CD

| Decisão  | Alternativa A      | Alternativa B | Alternativa C | Critérios que pesaram                      | Escolha            |
| -------- | ------------------ | ------------- | ------------- | ------------------------------------------ | ------------------ |
| Pipeline | **GitHub Actions** | GitLab CI     | CircleCI      | Já estar no GitHub (Smart Platform), Custo | **GitHub Actions** |

**Resumo:** repositório já vive no GitHub (Smart Platform Architecture) — usar GitHub Actions evita introduzir um segundo vendor sem necessidade. Pipeline: lint + type-check + build + teste em todo PR; deploy automático em `staging` a partir de `develop`; promoção manual para `main`/produção (já definido na Smart Platform Architecture, Seção 2).

**Classificação:** 🔵 Operacional. **ADR:** não.

---

## 12. Estratégia de Testes

| Decisão            | Alternativa A | Alternativa B | Alternativa C | Critérios que pesaram               | Escolha    |
| ------------------ | ------------- | ------------- | ------------- | ----------------------------------- | ---------- |
| Framework de teste | **Vitest**    | Jest          | —             | Velocidade, suporte nativo a TS/ESM | **Vitest** |

**Resumo:** três camadas de teste, mapeadas à arquitetura já definida — (1) **unitário** sobre a camada de domínio (Agregados, Invariantes da Missão 0004), sem dependência de infraestrutura; (2) **contrato/integração** validando que nenhum módulo acessa repositório de outro Bounded Context diretamente (reforça ADR-0016/ADR-0022, idealmente com checagem semi-automatizada); (3) **ponta a ponta** nos fluxos críticos que cruzam contexto (checkout → pagamento → cumprimento do pedido). Vitest escolhido sobre Jest por velocidade e suporte nativo a TypeScript/ESM, sem perda de maturidade relevante para este caso.

**Classificação:** 🔵 Operacional. **ADR:** não.

---

## 13. Infraestrutura

| Decisão                  | Alternativa A                                            | Alternativa B | Alternativa C                                     | Critérios que pesaram                               | Escolha     |
| ------------------------ | -------------------------------------------------------- | ------------- | ------------------------------------------------- | --------------------------------------------------- | ----------- |
| Hospedagem backend/banco | **Railway**                                              | Coolify       | Render (fora do que a Smart Platform já declarou) | Operabilidade (equipe pequena, sem DevOps dedicado) | **Railway** |
| Hospedagem frontend      | **Vercel** (já fixado pela Smart Platform)               | —             | —                                                 | Sinergia com Next.js                                | **Vercel**  |
| Containers               | **Docker** (já fixado) para dev local e imagem de deploy | —             | —                                                 | Portabilidade                                       | **Docker**  |

**Respostas às 6 perguntas (resumidas — Railway vs. Coolify):**

1. **Requisito:** Smart Platform já restringe a escolha a Railway ou Coolify.
2. **Alternativas:** Coolify (self-hosted) — daria mais controle e menor custo por unidade de carga no longo prazo, mas exige operar a própria infraestrutura (VM, atualizações, backup).
3. **Por que Railway:** gerenciado, esforço operacional quase zero — adequado a uma equipe pequena sem DevOps dedicado, no estágio de MVP sem carga real ainda.
4. **Limitações:** custo por unidade de carga tende a ser maior que Coolify em escala — **registrado como Dívida Tecnológica Deliberada** (Seção 19).
5. **Smart Platform:** neutro entre as duas — a Smart Platform já aceita ambas: o SmartFood documenta qual escolheu e por quê, sem forçar os demais produtos a seguir.
6. **10 anos:** não necessariamente — decisão explicitamente revisável quando o volume justificar migrar para Coolify.

**Classificação:** Docker = 🟢 Estratégica. Vercel/Railway = 🟡 Tática. **ADR:** hospedagem tratada como subseção do [ADR-0019 (Arquitetura de Implantação)](../../engineering/adr/ADR-0019-arquitetura-implantacao-monolito-modular.md), sem ADR próprio.

---

## 14. Ambientes

Aplicação literal do que a Smart Platform Architecture já define (Seção 2): três ambientes — `dev`, `staging`, `production` — com banco de dados separado por ambiente, variável de ambiente nunca compartilhada nem versionada, deploy automático em `staging` a partir de `develop`, promoção manual para `production` a partir de `main`. Nenhuma decisão nova — apenas confirmação de aplicação ao SmartFood.

**Classificação:** 🟢 Estratégica (herdada). **ADR:** não (já coberta pela Smart Platform Architecture).

---

## 15. Ferramentas de Desenvolvimento

| Decisão                  | Alternativa A                                                                                               | Alternativa B                             | Alternativa C | Critérios que pesaram                                | Escolha      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------- | ---------------------------------------------------- | ------------ |
| Estrutura de repositório | **Monorepo** (`frontend/`, `backend/`, `docs/` — já é a estrutura da Smart Platform Architecture, Seção 15) | Polyrepo (repositório separado por parte) | —             | Produtividade, Reutilização                          | **Monorepo** |
| Gerenciador de pacote    | **pnpm** (com workspaces)                                                                                   | npm                                       | yarn          | Velocidade, eficiência de disco, suporte a workspace | **pnpm**     |
| Padronização             | ESLint + Prettier, TypeScript estrito                                                                       | —                                         | —             | Já mandatado pela Smart Platform                     | Confirmado   |

**Resumo:** monorepo com pnpm workspaces permite compartilhar tipos TypeScript entre `frontend/` e `backend/` (ex: contrato de API) sem publicar pacote separado — ganho direto de produtividade e um padrão diretamente reutilizável por qualquer produto Smart com a mesma necessidade de compartilhar tipo entre front e back.

**Classificação:** 🔵 Operacional. **ADR:** não.

---

## 16. Classificação Consolidada de Tecnologias

_Combina a classificação de impacto (🟢🟡🔵🔴) com a categoria de escopo institucional (Padrão da Smart Platform / Padrão do Produto / Exceção Temporária / Experimental) — Refinamento 3 da Rodada 2 de revisão._

| Tecnologia                                               | Impacto         | Categoria                                               |
| -------------------------------------------------------- | --------------- | ------------------------------------------------------- |
| Docker                                                   | 🟢 Estratégica  | Padrão da Smart Platform                                |
| PostgreSQL                                               | 🟢 Estratégica  | Padrão da Smart Platform                                |
| Prisma                                                   | 🟡 Tática       | Padrão da Smart Platform                                |
| Vercel                                                   | 🟡 Tática       | Padrão da Smart Platform                                |
| JWT + Refresh Token (mecanismo base)                     | 🟢 Estratégica  | Padrão da Smart Platform                                |
| Ambientes (dev/staging/production)                       | 🟢 Estratégica  | Padrão da Smart Platform                                |
| GitHub Actions                                           | 🔵 Operacional  | Padrão da Smart Platform                                |
| Monólito Modular (topologia)                             | 🟢 Estratégica  | Padrão do Produto _(candidato a Plataforma — ver nota)_ |
| NestJS                                                   | 🟢 Estratégica  | Padrão do Produto                                       |
| Next.js                                                  | 🟡 Tática       | Padrão do Produto                                       |
| JWT com dois fluxos separados (Usuário/Cliente)          | 🟢 Estratégica  | Padrão do Produto _(candidato a Plataforma — ver nota)_ |
| Cloudflare R2                                            | 🔵 Operacional  | Padrão do Produto                                       |
| Vitest                                                   | 🔵 Operacional  | Padrão do Produto                                       |
| Monorepo / pnpm                                          | 🔵 Operacional  | Padrão do Produto                                       |
| Pino / OpenTelemetry                                     | 🟡 Tática       | Padrão do Produto                                       |
| Outbox (tabela `eventos_publicados`, contrato de evento) | 🟢 Estratégica  | Padrão do Produto                                       |
| Relay in-process (mecanismo de despacho)                 | 🟡 Tática       | **Exceção Temporária** — ver Dívida Tecnológica         |
| Railway                                                  | 🟡 Tática       | **Exceção Temporária** — ver Dívida Tecnológica         |
| Cache em memória de processo                             | 🔴 Experimental | **Experimental**                                        |
| Vendor final de observabilidade                          | 🔵 Operacional  | Em aberto (decisão de implementação)                    |

**Nota sobre "candidato a Plataforma":** Monólito Modular e a separação de dois fluxos de JWT (Usuário/Cliente) são, na prática, decisões boas o bastante para qualquer produto Smart multi-tenant nascer com elas — mas nenhuma vira "Padrão da Smart Platform" por decreto dentro de uma missão do SmartFood. Isso só acontece através de uma proposta explícita de nova versão da Smart Platform Architecture (mesma disciplina já usada antes), não por essa tabela.

---

## 17. Arquitetura Não Escolhida

_Refinamento 2 da Rodada 2 de revisão — para que "por que vocês não usam Kafka?" já tenha resposta documentada daqui a dois anos._

| Não escolhida                                                                                | Por que                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kafka / RabbitMQ / Redis Streams / NATS** (brokers de mensageria)                          | Resolvem entrega de evento **entre processos/serviços** — problema que o SmartFood não tem hoje, dado o Monólito Modular (Seção 1). Adotar agora seria pagar custo de operação e complexidade por um requisito inexistente (ver ADR-0023). Candidato natural quando o monólito for dividido — não descartado para sempre, adiado conscientemente.                                                                                                                                                                                       |
| **Redis (como cache)**                                                                       | Mesma lógica do Cache em memória (Seção 7): resolve invalidação distribuída entre múltiplas instâncias, que só existe quando o processo escalar horizontalmente. Hoje uma instância só torna cache em memória trivialmente consistente, sem necessidade de coordenação externa.                                                                                                                                                                                                                                                         |
| **Kubernetes**                                                                               | Orquestração resolve o problema de operar múltiplos serviços/instâncias em escala — o SmartFood roda um Monólito Modular em uma plataforma gerenciada (Railway), que já entrega deploy/restart/scaling básico sem exigir que a equipe opere um cluster. Introduzir Kubernetes agora seria complexidade operacional sem carga real que a justifique (Operabilidade).                                                                                                                                                                     |
| **Microsserviços desde o início**                                                            | Já tratado em detalhe no ADR-0019 — exige maturidade operacional que uma equipe pequena, sem usuário real em produção, não precisa pagar agora. As fronteiras de Bounded Context (Missão 0005) já deixam essa divisão possível **quando** fizer sentido, sem redesenho.                                                                                                                                                                                                                                                                 |
| **Event Sourcing** (estado derivado por replay de eventos, em vez de tabela de estado atual) | O modelo de domínio (Missão 0004) já usa Agregados com estado atual persistido diretamente, mais uma tabela de histórico específica onde a rastreabilidade importa de fato (`historico_status_pedido`, Missão 0006). Adotar Event Sourcing como modelo de persistência geral exigiria snapshotting, replay e consistência eventual de _toda_ leitura, não só onde há necessidade real de histórico — complexidade desproporcional ao problema. O Outbox (ADR-0023) já entrega a garantia de publicação de evento sem exigir esse salto. |

---

## 18. Gatilhos de Revisão

_Refinamento 1 da Rodada 2 de revisão — a pergunta "quando devemos mudar?" já responde antes de ser perguntada._

| Decisão                                               | Trigger objetivo para revisão                                                                                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monólito Modular                                      | Mais de ~20 desenvolvedores simultâneos no mesmo repositório, OU necessidade real de deploy independente de um Bounded Context específico                                           |
| Relay in-process (Barramento de Eventos)              | Monólito ser dividido em mais de um processo/serviço (Seção 1 reaberta), OU volume de eventos por minuto degradar a latência da própria aplicação processando-os                    |
| Cache em memória                                      | Segunda instância do processo em produção (qualquer necessidade de escalar horizontalmente Catálogo/Vitrine ou Relatórios)                                                          |
| Railway                                               | Necessidade de infraestrutura dedicada/customizada que a plataforma gerenciada não ofereça, ou custo por unidade de carga superar significativamente o de operar Coolify            |
| PostgreSQL único (schema-per-contexto no mesmo banco) | Necessidade real de isolamento físico por Bounded Context (ex: exigência regulatória específica de um contexto, como Financeiro)                                                    |
| Next.js                                               | Um segundo produto Smart tiver a mesma necessidade de página pública performática — nesse ponto, avaliar elevar a Padrão da Smart Platform em vez de repetir a decisão isoladamente |
| Vendor de observabilidade                             | No momento em que for escolhido (Missão 0007.5) — revisão natural se o custo ou os limites do plano gratuito/inicial pararem de comportar o volume real                             |

---

## 19. Dívida Tecnológica Deliberada

| Entrada                                                                                                                                                                                                                                                                                           | Horizonte de revisão                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Estamos usando cache em memória de processo porque simplifica a operação com instância única, sabendo que a primeira necessidade real de escalar Catálogo/Relatórios horizontalmente vai exigir migrar para um cache compartilhado externo."                                                     | 1-2 anos, ou no primeiro momento em que Vendas & Operação/Catálogo precisar de mais de uma instância |
| "Estamos usando Railway (gerenciado) em vez de Coolify (self-hosted) porque reduz esforço operacional agora, sabendo que o custo por unidade de carga é maior — pode migrar para Coolify quando o volume justificar operar infraestrutura própria."                                               | 1-3 anos, revisitar a cada dobra relevante de carga                                                  |
| "Estamos usando um relay in-process para o Barramento de Eventos porque o monólito modular ainda roda em um processo só, sabendo que a divisão futura em serviços (Missão 0005) vai exigir trocar o mecanismo de despacho por um broker real — a tabela outbox e o contrato de evento não mudam." | Revisitar no momento em que a Seção 1 desta missão for reaberta (decisão de dividir o monólito)      |

Cada entrada é, por definição, classificada como 🔴 Experimental ou parte de uma decisão 🟡 Tática com prazo de revisão — nunca uma exceção silenciosa.

---

## 20. ADRs

Escritos por completo em [docs/engineering/adr/](../../engineering/adr/README.md) na consolidação desta missão:

- **ADR-0019** — Arquitetura de Implantação: Monólito Modular
- **ADR-0020** — Framework de Backend: NestJS
- **ADR-0021** — Banco de Dados: PostgreSQL
- **ADR-0022** — Comunicação entre Módulos (chamada direta in-process via contrato, nunca acesso a repositório alheio; convenção de uso do Prisma sem FK cross-contexto)
- **ADR-0023** — Barramento de Eventos: Outbox + Relay In-Process
- **ADR-0024** — Autenticação: JWT + Refresh Token, dois fluxos de identidade separados

_(Multi-tenant físico foi avaliado como não exigindo ADR novo — a decisão de enforcement automático via camada de acesso a dado é detalhe de implementação do que a Missão 0006, Seção 5, e o ADR-0014 já decidiram; será tratado na Missão 0007.5/Blueprint Técnico como padrão de código, não como nova decisão arquitetural.)_

---

## 21. Riscos

| Risco                                                                                                                                          | Categoria                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Divisão futura do monólito em serviços exigir retrabalho maior que o previsto se a disciplina de módulo (NestJS) não for mantida rigorosamente | Risco de execução, não de arquitetura — mitigado por teste de contrato entre módulos (Seção 12)                             |
| Cache em memória (🔴 Experimental) ser esquecido como dívida e nunca revisitado                                                                | Mitigado por entrada explícita na Seção 19 e pelo gatilho objetivo da Seção 18, a ser conferido a cada marco de crescimento |
| Vendor de observabilidade final escolhido na implementação sem revisão arquitetural                                                            | Baixo risco — protegido pelo padrão aberto (OpenTelemetry) já fixado aqui                                                   |
| Divergência entre o padrão frontend do SmartFood (Next.js) e do SmartOS (Vite) confundir futuros desenvolvedores do ecossistema                | Mitigado por classificação explícita como "Padrão específico do Produto", não "Padrão da Smart Platform" (Seção 3)          |

---

## 22. Preparação para a Missão 0007.5 (Blueprint Técnico)

Esta missão entrega à Missão 0007.5 exatamente o que ela precisa para virar manual prático: framework e topologia definidos (Seção 1/2) → estrutura de pastas por Bounded Context dentro do monólito modular; convenção de comunicação entre módulos (ADR-0022) → "como criar um novo Bounded Context" e "como um módulo chama outro"; Barramento de Eventos (ADR-0023) → "como publicar e assinar um evento"; estratégia de testes (Seção 12) → "como escrever teste para cada camada"; ambientes e infraestrutura (Seções 13-14) → "como rodar localmente" e "como funciona o deploy".

---

_Fim do documento — Missão 0007, ✅ CONGELADA. Ver [missao-0007-review-notes.md](../../engineering/review-notes/missao-0007-review-notes.md) para o histórico completo da revisão (2 rodadas). Os 6 ADRs da Seção 20 estão com status Aceito em [docs/engineering/adr/](../../engineering/adr/README.md)._
