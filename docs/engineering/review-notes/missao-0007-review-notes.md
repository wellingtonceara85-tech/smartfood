# SmartFood — Review Notes — Missão 0007 (Arquitetura Técnica e Stack Tecnológica)

## Rodada 1 (Draft)

**Data:** 2026-07-11
**Resultado:** Documento entregue seguindo a ordem pedida (implantação, backend, frontend, banco, ORM, eventos, cache, storage, auth, observabilidade, CI/CD, testes, infraestrutura, ambientes, ferramentas), com Matriz de Decisão Tecnológica, respostas às 6 perguntas obrigatórias, classificação 🟢🟡🔵🔴, Dívida Tecnológica Deliberada e 6 ADRs (0019-0024, status Proposto). Primeira missão do SmartFood a escolher tecnologia real: Monólito Modular, NestJS, Next.js, PostgreSQL, Prisma (com convenção de uso), Outbox+relay in-process, cache em memória, Cloudflare R2, JWT com dois fluxos, Railway, GitHub Actions, Vitest, monorepo+pnpm.

## Rodada 2 (CTO Review)

**Data:** 2026-07-12
**Revisor:** Usuário, avaliando explicitamente como CTO
**Veredito:** 🟢 Aprovada para congelamento, com 3 ajustes recomendados (não obrigatórios, mas incorporados nesta rodada).

**Elogios registrados** (não geram ação, mas valem preservar o raciocínio): Monólito Modular considerado "a decisão mais importante da missão" — primeiro separar responsabilidades, depois separar processos; NestJS validado como decisão de encaixe estrutural, não de popularidade; Next.js elogiado por ter sido classificado como Padrão do Produto e não da Plataforma, evitando "contaminar" o ecossistema; convenção `@relation` só dentro do Bounded Context considerada "vale ouro"; Outbox+relay in-process considerado "a melhor decisão da missão" — questionou "existe mais de um processo?" antes de escolher tecnologia de mensageria; classificação Experimental do cache elogiada por impedir que a decisão vire permanente por omissão; Railway confirmado como certo para o estágio de validação de negócio, não de infraestrutura.

**3 ajustes recomendados incorporados, com o porquê:**

1. **Tabela de Gatilhos de Revisão** (nova Seção 18).
   Por quê: sem trigger objetivo por decisão, a pergunta "quando devemos mudar?" ficaria sem resposta documentada, dependendo de julgamento subjetivo no futuro. Aplicada a Monólito Modular, Relay in-process, Cache, Railway, PostgreSQL único, Next.js e vendor de observabilidade — não só aos 5 exemplos que o usuário deu, estendida para cobrir toda decisão relevante do documento.

2. **Seção "Arquitetura Não Escolhida"** (nova Seção 17).
   Por quê: registrar conscientemente por que Kafka/RabbitMQ/Redis/Kubernetes/Microsserviços/Event Sourcing não foram escolhidos evita a pergunta recorrente "por que vocês não usam X?" daqui a alguns anos, sem resposta documentada. Event Sourcing foi incluído mesmo não tendo sido discutido antes na missão, por ser uma alternativa real ao Outbox que merece registro explícito de rejeição consciente.

3. **Matriz consolidada Tecnologia × Categoria** (Seção 16 expandida).
   Por quê: a classificação de impacto (🟢🟡🔵🔴) já existia, mas não estava cruzada com a categoria de escopo institucional (Padrão da Plataforma / Padrão do Produto / Exceção Temporária / Experimental) definida na proposta de escopo aprovada. Consolidadas em uma única tabela, incluindo uma nota explícita sobre "candidatos a Padrão da Plataforma" (Monólito Modular, dois fluxos de JWT) que não viram padrão institucional automaticamente só por esta tabela — exigem proposta explícita de nova versão da Smart Platform Architecture.

**Status ao final da Rodada 2:** ✅ CONGELADA — versão oficial. ADR-0019 a ADR-0024 passaram de "Proposto" para "Aceito".

---

## Como usar este documento

Ver [missao-0002-review-notes.md](missao-0002-review-notes.md) para o modelo completo de registro (decisão + porquê + trade-off).
