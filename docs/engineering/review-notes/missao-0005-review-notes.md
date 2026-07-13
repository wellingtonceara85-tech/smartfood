# SmartFood — Review Notes — Missão 0005 (Arquitetura da Solução)

## Rodada 1 (Draft)

**Data:** 2026-07-11
**Resultado:** Documento entregue com 18 seções — Bounded Contexts, arquitetura modular em tiers, comunicação entre módulos, eventos da plataforma, barramento de eventos, serviços compartilhados, cache, APIs, offline, multi-tenant, segurança, observabilidade, escalabilidade, resiliência, lista de ADRs, riscos arquiteturais e ponte para a Missão 0006.

## Rodada 2 (CTO Review)

**Data:** 2026-07-11
**Revisor:** Usuário (papel de CTO/Product Owner, explicitamente na perspectiva de arquitetura de longo prazo)
**Veredito:** 🟡 **Aprovada com ressalvas — não congelar ainda.** Arquitetura considerada consistente com as Missões 0001-0004, com boa aplicação de DDD, separação de responsabilidades e preocupação de evolução de longo prazo. A fusão de Comercial+Operacional em "Vendas & Operação" foi validada como correta e bem fundamentada.

**8 ajustes obrigatórios incorporados, com o porquê:**

1. **Ownership (quem decide, não só quem guarda o dado).**
   Por quê: a tabela original só tinha "dono do dado" — isso não deixava claro quem tem autoridade final sobre uma decisão de negócio quando o dado é consultado por mais de um contexto. Sem essa distinção, dois contextos poderiam implementar a mesma regra de forma divergente. Adicionada tabela de 8 decisões centrais mapeadas ao contexto dono.

2. **Anti-Corruption Layer (ACL).**
   Por quê: o documento original não deixava explícito como o domínio se protege de modelo externo (gateway de pagamento, marketplace) vazando para dentro. Adicionada seção explícita: parceiro se adapta ao SmartFood, nunca o contrário — tradução acontece uma única vez, na borda.

3. **Tiers como direção preferencial, não restrição absoluta.**
   Por quê: a redação original ("nunca chama sincronamente tier superior") lida como regra física sem exceção, o que é frágil na prática. Adicionada nota explícita permitindo exceção pontual, desde que documentada — nunca drift silencioso.

4. **Eventos representam fatos passados, nunca comandos.**
   Por quê: distinção fundamental de arquitetura orientada a evento que não estava explícita — um evento não tem "destinatário responsável por decidir", um comando tem. Formalizada como princípio na Seção 5, com a convenção de nomenclatura (particípio passado) elevada de prática implícita a regra.

5. **Garantia de publicação equivalente ao Outbox Pattern.**
   Por quê: a regra original ("publicação é posterior à transação") não cobria o caso de falha exatamente entre a mudança de estado e a publicação do evento — um jeito de perder evento silenciosamente. Adicionado o princípio de que o _compromisso_ de publicar nasce atômico à mudança de estado, mesmo que a entrega real aconteça depois.

6. **Business Metrics na Observabilidade.**
   Por quê: a Seção 13 original só cobria métricas técnicas (erro, latência). Métricas de negócio (conversão, ticket médio, taxa de cancelamento) são igualmente um requisito arquitetural — e, tecnicamente, derivam dos mesmos Eventos de Domínio já em uso, sem instrumentação paralela.

7. **Risco de proliferação de eventos.**
   Por quê: um barramento de eventos sem governança tende a acumular tipos de evento redundantes ou sem consumidor real ao longo do tempo. Adicionado como risco explícito na Seção 17, com mitigação via revisão obrigatória de novo evento, versionamento e catálogo vivo (a própria tabela da Seção 5).

8. **Seção "Princípios Arquiteturais Permanentes".**
   Por quê: pedido explícito de uma "constituição" — o subconjunto de decisões que deve sobreviver a qualquer mudança futura de tecnologia ou equipe, distinto da lista mais ampla de princípios de leitura da Seção 1. Criada como nova Seção 19, com 8 princípios permanentes.

**2 pontos tratados como discussão arquitetural (não correção obrigatória), com decisão documentada:**

9. **Inteligência Artificial e Relatórios & Analytics: Bounded Context ou Capability/Read Platform?**
   O revisor explicitamente marcou isso como tema de discussão, não correção obrigatória, e observou que equipes experientes em DDD modelam Analytics/IA como Bounded Context quando desenvolvem linguagem própria.
   **Decisão tomada:** reclassificados como Capabilities/Read Platform, não Bounded Contexts — nenhum dos dois possui hoje agregado próprio, escrita em outro contexto, ou linguagem ubíqua distinta (critério clássico de DDD para Bounded Context). Posição no mapa de dependência (Tier 4) não muda — só o rótulo e a implicação de que eles não são donos de decisão de negócio.
   **Gatilho de reclassificação futura documentado** (Seção 2): se um "Modelo de Recomendação" ou "Score de Comparação Anônima" desenvolver política de negócio própria que hoje não existe, cada um vira candidato real a Bounded Context.
   Registrado com nota de transparência de que é uma decisão de julgamento para o estágio atual, não uma verdade absoluta — exatamente como o revisor recomendou.

**Status ao final da Rodada 2:** 🟡 Ressalvas endereçadas. Aguardando confirmação final.

### Congelamento

**Data:** 2026-07-11
**Confirmado por:** usuário, explicitamente: "Status: 🟢 Aprovada. Congelar a Missão 0005."
**Status final:** ✅ CONGELADA — versão oficial. Os 10 ADRs listados na Seção 16 (ADR-0004 a ADR-0013) foram escritos por completo em `docs/engineering/adr/` na sequência desta confirmação. Nenhuma alteração retroativa sem nova rodada de revisão explícita.

---

## Como usar este documento

Ver [missao-0002-review-notes.md](missao-0002-review-notes.md) para o modelo completo de registro (decisão + porquê + trade-off).
