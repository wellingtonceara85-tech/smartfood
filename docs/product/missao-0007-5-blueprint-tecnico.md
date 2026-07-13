# SmartFood — Blueprint Técnico (Arquitetura Executável)

**Missão 0007.5**
**Status:** ✅ CONGELADA — versão oficial (aprovada em 2026-07-12, após Rodada 2 de refinamentos de engenharia). Última missão de arquitetura/documentação estrutural do SmartFood.
**Referências obrigatórias:** Missões 0001-0007 (todas congeladas) · [ADRs 0001-0024](../../engineering/adr/README.md)
**Histórico de decisões:** [missao-0007-5-review-notes.md](../../engineering/review-notes/missao-0007-5-review-notes.md)
**Papel assumido nesta missão:** Tech Lead da Smart Platform, não mais Arquiteto de Software. A pergunta deixou de ser "qual é a melhor arquitetura?" e passou a ser "como implementamos a arquitetura já aprovada da forma mais limpa possível?". **Nenhuma decisão arquitetural é reaberta aqui** — toda escolha deste documento é rastreável a uma Missão ou ADR já congelado (ver Seção 16). Toda decisão de implementação futura é governada pelo Princípio da Simplicidade (Seção 10).
**Restrições explícitas:** sem funcionalidade de negócio, sem tela, sem regra de domínio real, sem endpoint de produto, sem iniciar Catálogo/Pedidos/Clientes/Pagamentos. O módulo de exemplo usado neste documento (Seção 8) é **fictício e descartável**, existe só para demonstrar o padrão.

---

## 1. Visão Geral do Blueprint

Este documento é o "manual de construção" do SmartFood — depois dele, qualquer desenvolvedor deve conseguir criar um novo Bounded Context seguindo exatamente o mesmo padrão, sem precisar reler as sete missões arquiteturais. Ele não define nada novo: **traduz** o que já foi decidido (Missões 0004-0007) em estrutura de diretório, convenção de nome e fluxo de código concreto.

**Como usar:** ao criar um módulo novo, copiar a estrutura da Seção 8 (módulo de exemplo), renomear, e preencher com o domínio real — nunca começar um módulo do zero sem seguir este padrão.

---

## 2. Estrutura de Diretórios do Monólito Modular

Segue a estrutura já fixada pela Smart Platform Architecture (Seção 15) e o Monólito Modular (ADR-0019), com o backend detalhado por Bounded Context:

```
smartfood/
├── frontend/                        # Next.js (Missão 0007, Seção 3)
│   └── ...                          # detalhado na Missão 0008/0009+
│
├── backend/
│   ├── src/
│   │   ├── modules/                 # um diretório por Bounded Context (Missão 0005, Seção 2)
│   │   │   ├── vendas-operacao/
│   │   │   ├── catalogo/
│   │   │   ├── clientes/
│   │   │   ├── pagamentos/
│   │   │   ├── financeiro/
│   │   │   ├── comunicacao/
│   │   │   ├── identidade-empresa/
│   │   │   ├── marketing/
│   │   │   ├── estoque/
│   │   │   └── ecossistema/
│   │   │
│   │   ├── platform/                # Serviços Compartilhados (Missão 0005, Seção 7) — nunca lógica de negócio
│   │   │   ├── auth/                # dois fluxos de identidade (ADR-0024)
│   │   │   ├── files/
│   │   │   ├── audit/
│   │   │   ├── feature-flags/
│   │   │   ├── rate-limit/
│   │   │   ├── ai/                  # Acesso a IA (Smart AI Guide)
│   │   │   └── outbox/              # relay do Barramento de Eventos (ADR-0023)
│   │   │
│   │   ├── capabilities/            # Inteligência Artificial e Relatórios & Analytics (ADR-0011) — não são módulos de negócio
│   │   │   ├── inteligencia-artificial/
│   │   │   └── relatorios-analytics/
│   │   │
│   │   └── main.ts                  # bootstrap NestJS
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # um bloco `schema` por Bounded Context (Missão 0006, Seção 9)
│   │   └── migrations/
│   │
│   └── test/                        # testes ponta a ponta cruzando Bounded Context (Missão 0007, Seção 12)
│
└── docs/                            # já existente — este próprio conjunto de missões
```

**Regra:** nada em `modules/` importa diretamente de outro diretório dentro de `modules/` — só através do que está exportado pelo `*.module.ts` de cada um (ADR-0022). `platform/` e `capabilities/` nunca contêm regra de negócio de um Bounded Context específico (Missão 0005, Seção 7 / ADR-0011).

---

## 3. Convenções de Nomenclatura

| Elemento                             | Convenção                                                                            | Exemplo                      |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------- |
| Diretório de módulo                  | `kebab-case`, nome do Bounded Context (Missão 0005)                                  | `vendas-operacao/`           |
| Arquivo                              | `kebab-case.sufixo.ts` (padrão NestJS)                                               | `criar-lembrete.use-case.ts` |
| Classe                               | `PascalCase`                                                                         | `CriarLembreteUseCase`       |
| Interface de Repositório (Domain)    | `PascalCase` + `Repository`, sufixo `Port` opcional para reforçar Clean Architecture | `LembreteRepository`         |
| Implementação de Repositório (Infra) | `Prisma` + nome                                                                      | `PrismaLembreteRepository`   |
| Tabela (banco)                       | `snake_case`, plural (já fixado na Missão 0006)                                      | `lembretes`                  |
| Evento de Domínio                    | `SUBSTANTIVO_PARTICIPIO_PASSADO` (ADR-0006, nunca comando)                           | `LEMBRETE_CRIADO`            |
| DTO de entrada (API)                 | `PascalCase` + `Dto`, sufixo do verbo                                                | `CriarLembreteDto`           |
| Caso de Uso                          | `PascalCase` + `UseCase`, verbo no infinitivo + substantivo                          | `CriarLembreteUseCase`       |
| Teste                                | co-localizado, `*.spec.ts` (unitário/integração) ou em `test/` (ponta a ponta)       | `lembrete.entity.spec.ts`    |

---

## 4. Anatomia de um Bounded Context

Todo módulo tem exatamente esta estrutura interna, correspondendo às camadas de Clean Architecture já mandatadas (Missão 0005, Princípio 7):

```
modules/<bounded-context>/
├── domain/
│   ├── <agregado>.entity.ts          # Aggregate Root + Entidades internas
│   ├── <value-object>.vo.ts          # Value Objects (nunca com identidade)
│   ├── <agregado>.repository.ts      # Interface do repositório (porta) — Domain nunca conhece Prisma
│   ├── <agregado>.invariants.ts      # Invariantes (Missão 0004) — validação pura, sem I/O
│   └── events/
│       └── <evento>.domain-event.ts  # Evento de Domínio (definição, não a tabela outbox)
│
├── application/
│   ├── use-cases/
│   │   └── criar-<agregado>.use-case.ts
│   ├── dtos/
│   │   └── criar-<agregado>.command.ts   # Command interno — distinto do DTO de API (Seção 4.7)
│   └── ports/
│       └── <servico-externo>.port.ts     # interface para qualquer dependência externa ao domínio
│
├── infrastructure/
│   ├── prisma-<agregado>.repository.ts   # Implementação do repositório (Prisma) — único lugar que importa PrismaClient
│   ├── <agregado>.mapper.ts              # Domain Entity ⇄ Prisma Model
│   └── acl/                              # Anti-Corruption Layer (ADR-0012) — só se o módulo integra sistema externo
│       └── <parceiro>.adapter.ts
│
├── api/
│   ├── <bounded-context>.controller.ts
│   ├── dtos/
│   │   ├── criar-<agregado>.request.dto.ts   # validado com class-validator
│   │   └── <agregado>.response.dto.ts
│   └── guards/
│       └── (reaproveita platform/auth — só cria Guard próprio se a regra for específica do módulo)
│
├── events/
│   └── <evento>.handler.ts           # Assinante de evento de OUTRO módulo (ver Seção 6)
│
├── __tests__/
│   ├── domain/                       # unitário, sem infraestrutura
│   ├── application/                  # integração dentro do módulo
│   └── contract/                     # garante que nada aqui importa outro Bounded Context diretamente
│
├── <bounded-context>.module.ts       # wiring NestJS — só exporta a Application Service Interface (ADR-0022)
├── README.md                         # obrigatório — ver Seção 12 (Arquivos Obrigatórios)
└── CHANGELOG.md                      # obrigatório — ver Seção 12 (Arquivos Obrigatórios)
```

### 4.1 Domain

Contém Aggregate Root, Entidades internas ao Agregado, Value Objects, Invariantes (Missão 0004) e a **interface** do repositório — nunca a implementação. Não importa NestJS, não importa Prisma, não faz I/O. É a camada mais protegida: se ela precisar mudar por causa de um framework, a Clean Architecture (Missão 0005, Princípio 7) falhou.

### 4.2 Application

Orquestra: recebe um Command, chama o Domain, usa a interface de Repositório (injetada, nunca instanciada aqui), decide se e qual Evento de Domínio disparar. Um Caso de Uso por classe (Seção 4.8). Não conhece detalhe de HTTP nem de Prisma.

### 4.3 Infrastructure

Implementa as interfaces definidas no Domain e na Application. É o único lugar do módulo que importa `PrismaClient` diretamente. Contém o Mapper (converte entre o modelo Prisma — linha de banco — e a Entidade de Domínio) e, quando aplicável, a Anti-Corruption Layer (ADR-0012) para tradução de sistema externo.

### 4.4 API Layer

Controllers NestJS, DTOs de entrada/saída validados (`class-validator`), Guards de permissão (Missão 0005, Seção 12 — rodam **antes** de qualquer lógica de domínio). Traduz HTTP para Command da Application — nunca chama Domain ou Infrastructure diretamente.

### 4.5 Events

Dois papéis distintos: (a) a **definição** do Evento de Domínio vive em `domain/events/`; (b) os **handlers que assinam evento de outro módulo** vivem em `events/` na raiz do módulo — um handler nunca acessa o repositório do módulo publisher, só reage ao payload do evento recebido via o relay (ADR-0023).

### 4.6 Repositories

Interface no Domain (`<agregado>.repository.ts`), implementação na Infrastructure (`prisma-<agregado>.repository.ts`). Nenhum outro módulo importa a implementação — só a interface, e mesmo assim só se for parte do próprio Agregado (nunca de outro Bounded Context, ADR-0016/0022).

### 4.7 DTOs

Dois níveis, propositalmente separados: **DTO de API** (`api/dtos/`) é o contrato HTTP, validado na borda; **Command/Query** (`application/dtos/`) é o objeto interno que o Caso de Uso recebe. O Controller traduz um para o outro — isso evita que uma mudança de contrato de API force mudança na Application, e vice-versa.

### 4.8 Casos de Uso

Um Caso de Uso é uma classe com um único método público (`execute`), fazendo uma coisa. Nunca um "Service" genérico com dez métodos não relacionados — cada operação de negócio relevante é um Caso de Uso nomeável (`CriarLembreteUseCase`, `CancelarLembreteUseCase`), o que torna o Blueprint auto-documentado: a lista de arquivos em `use-cases/` já é a lista de operações que o módulo suporta.

### 4.9 Testes

Três camadas (Missão 0007, Seção 12): **unitário** em `domain/` (Agregado e Invariantes, sem infraestrutura); **integração** em `application/` (Caso de Uso completo, com repositório real de teste); **contrato** garantindo que nada no módulo importa diretamente outro Bounded Context (idealmente com regra de lint automatizada, não só revisão manual).

### 4.10 Migrations

Uma migration por mudança de schema, sempre reversível (Missão 0007, Seção 14/Smart Platform Architecture). O bloco `schema` do Prisma correspondente ao Bounded Context nunca declara `@relation` para fora de si mesmo (Seção 5 da Missão 0007 / ADR-0022).

### 4.11 Módulo NestJS

O `*.module.ts` declara `providers` (Casos de Uso, Repositório, Mapper) e `exports` — **e só exporta a Application Service Interface**, nunca o repositório, nunca uma entidade de domínio, nunca o Prisma Client. É o ponto de imposição física da fronteira de Bounded Context (ADR-0022).

---

## 5. Fluxo Completo: HTTP → Aggregate Root

Usando o módulo de exemplo (Seção 8) para tornar concreto:

```
1. Requisição HTTP chega em LembretesController (api/)
2. Guard de autenticação/permissão valida (platform/auth) — ANTES de qualquer lógica (Missão 0005, Seção 12)
3. Pipe de validação valida o CriarLembreteRequestDto (class-validator)
4. Controller traduz o DTO de API em um CriarLembreteCommand (application/dtos/)
5. Controller chama CriarLembreteUseCase.execute(command) — injetado via DI
6. Caso de Uso chama o Domain: Lembrete.criar(titulo, descricao) — Invariantes validadas AQUI, dentro da Entidade
7. Caso de Uso chama LembreteRepository.salvar(lembrete) — interface, resolvida em runtime para PrismaLembreteRepository
8. PrismaLembreteRepository usa o Mapper para converter Entidade → modelo Prisma, grava na tabela `lembretes`
9. Na MESMA transação (passo 8), grava o registro correspondente em `eventos_publicados` (Outbox, ADR-0023)
10. Caso de Uso retorna; Controller mapeia o resultado para LembreteResponseDto e responde HTTP
```

Nenhum passo pula camada. O Controller nunca fala com o Repositório; o Domain nunca fala com o Prisma; a Infrastructure nunca decide regra de negócio.

---

## 6. Fluxo Completo: Publicação e Consumo de Evento

```
1. Evento LEMBRETE_CRIADO gravado em `eventos_publicados` na mesma transação da escrita do Agregado (passo 9 da Seção 5) — status "pendente"
2. O Relay (platform/outbox) consulta periodicamente eventos pendentes (ADR-0023)
3. Para cada evento pendente, o Relay identifica os módulos assinantes registrados para aquele tipo de evento
4. O Relay invoca o handler de cada assinante — uma chamada de função in-process (ex: FidelidadeEventHandler.aoLembreteCriado(payload))
5. Handler processa; se tiver sucesso, o Relay marca o evento como "entregue" para aquele assinante
6. Se falhar, retry com espaçamento crescente (Missão 0005, Seção 6); após esgotar tentativas, status "morto" (dead letter)
7. Idempotência: todo handler usa o ID único do evento para não processar duas vezes o mesmo evento reentregue
```

Um módulo assinante **nunca** consulta a tabela `eventos_publicados` diretamente nem acessa o repositório do módulo publisher — só recebe o payload já traduzido através do Relay.

---

## 7. Convenções Obrigatórias (checklist para novo desenvolvedor)

- [ ] Todo módulo novo segue exatamente a estrutura da Seção 4 — sem exceção "só desta vez".
- [ ] Domain nunca importa NestJS, Prisma, ou qualquer coisa de `infrastructure/`.
- [ ] Nenhum `@relation` do Prisma cruza Bounded Context (ADR-0022).
- [ ] Nenhum módulo importa arquivo de dentro de outro módulo — só o que o `*.module.ts` exporta.
- [ ] Toda escrita de Agregado que gera Evento de Domínio grava o registro em `eventos_publicados` na mesma transação (ADR-0023).
- [ ] Todo endpoint de escrita passa por Guard de permissão antes do Caso de Uso (Missão 0005, Seção 12).
- [ ] Toda tabela de negócio tem a coluna de escopo correta — `empresa_id`, `loja_id`, ou nenhuma se for identidade global de Cliente (ADR-0002/0017/0018 — **checar sempre**, foi a fonte dos 4 erros reais encontrados na Missão 0006).
- [ ] Evento nomeado no particípio passado, nunca imperativo (ADR-0006).
- [ ] Toda ação sensível gera Registro de Auditoria, síncrono à ação (Missão 0004/0005, Seção 12).
- [ ] Nenhuma tecnologia nova introduzida sem checar a Seção 16/17 da Missão 0007 (o que já foi escolhido e o que foi conscientemente descartado).

---

## 8. Módulo de Exemplo Completo — "Lembrete" (fictício, descartável)

**Aviso:** este módulo não é uma funcionalidade do SmartFood. É um domínio propositalmente trivial e sem relação com Catálogo/Pedidos/Clientes/Pagamentos, usado só para tornar o padrão concreto. Nasce e morre neste documento — não é criado como código real até que a Missão 0008 (Smart Starter Kit) o use como scaffold de referência, se decidido.

**Domain — `domain/lembrete.entity.ts`**

```typescript
export class Lembrete {
  private constructor(
    private readonly id: string,
    private titulo: string,
    private descricao: string,
    private readonly criadoEm: Date,
  ) {}

  static criar(titulo: string, descricao: string): Lembrete {
    if (!titulo || titulo.trim().length === 0) {
      throw new TituloObrigatorioError(); // Invariante — Missão 0004
    }
    return new Lembrete(crypto.randomUUID(), titulo, descricao, new Date());
  }

  paraPersistencia() {
    return { id: this.id, titulo: this.titulo, descricao: this.descricao, criadoEm: this.criadoEm };
  }
}
```

**Domain — `domain/lembrete.repository.ts`**

```typescript
export interface LembreteRepository {
  salvar(lembrete: Lembrete): Promise<void>;
  buscarPorId(id: string): Promise<Lembrete | null>;
}
export const LEMBRETE_REPOSITORY = Symbol('LembreteRepository'); // token de injeção NestJS
```

**Domain — `domain/events/lembrete-criado.domain-event.ts`**

```typescript
export class LembreteCriadoEvent {
  constructor(
    public readonly lembreteId: string,
    public readonly empresaId: string,
    public readonly ocorridoEm: Date,
  ) {}
  static readonly tipo = 'LEMBRETE_CRIADO'; // particípio passado — ADR-0006
}
```

**Application — `application/use-cases/criar-lembrete.use-case.ts`**

```typescript
@Injectable()
export class CriarLembreteUseCase {
  constructor(
    @Inject(LEMBRETE_REPOSITORY) private readonly repo: LembreteRepository,
    private readonly outbox: OutboxService, // platform/outbox — ADR-0023
  ) {}

  async execute(command: CriarLembreteCommand): Promise<{ id: string }> {
    const lembrete = Lembrete.criar(command.titulo, command.descricao);
    await this.repo.salvar(lembrete); // Infrastructure grava Agregado + evento na MESMA transação
    await this.outbox.registrar(new LembreteCriadoEvent(/* ... */));
    return { id: lembrete.paraPersistencia().id };
  }
}
```

**Infrastructure — `infrastructure/prisma-lembrete.repository.ts`**

```typescript
@Injectable()
export class PrismaLembreteRepository implements LembreteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(lembrete: Lembrete): Promise<void> {
    const dado = LembreteMapper.paraPrisma(lembrete);
    await this.prisma.lembrete.upsert({ where: { id: dado.id }, create: dado, update: dado });
    // gravação do evento em eventos_publicados acontece na mesma transação — detalhe no OutboxService
  }

  async buscarPorId(id: string): Promise<Lembrete | null> {
    const registro = await this.prisma.lembrete.findUnique({ where: { id } });
    return registro ? LembreteMapper.paraDominio(registro) : null;
  }
}
```

**API — `api/lembretes.controller.ts`**

```typescript
@Controller('lembretes')
export class LembretesController {
  constructor(private readonly criarLembrete: CriarLembreteUseCase) {}

  @Post()
  @UseGuards(PapelPermissaoGuard) // platform/auth — Missão 0005, Seção 12
  async criar(@Body() dto: CriarLembreteRequestDto): Promise<LembreteResponseDto> {
    const resultado = await this.criarLembrete.execute({
      titulo: dto.titulo,
      descricao: dto.descricao,
    });
    return { id: resultado.id };
  }
}
```

**Módulo — `lembretes.module.ts`**

```typescript
@Module({
  controllers: [LembretesController],
  providers: [
    CriarLembreteUseCase,
    { provide: LEMBRETE_REPOSITORY, useClass: PrismaLembreteRepository },
  ],
  exports: [CriarLembreteUseCase], // só isso — nunca o Repository, nunca a Entity
})
export class LembretesModule {}
```

**README.md — obrigatório em todo módulo (ver Seção 12)**

```markdown
# Módulo: Lembretes (exemplo fictício)

## Objetivo

Demonstrar a anatomia de um Bounded Context — não é uma funcionalidade real do SmartFood.

## Agregado

Lembrete (id, titulo, descricao, criadoEm). Invariante: título não pode ser vazio.

## Eventos Publicados

- LEMBRETE_CRIADO — quando um Lembrete é criado com sucesso.

## Eventos Consumidos

- Nenhum (módulo de exemplo, sem dependência de outro contexto).

## Invariantes

- Título é obrigatório e não pode ser vazio (Lembrete.criar).
```

---

## 9. Checklist: Como Criar um Novo Bounded Context

1. Criar `modules/<nome-do-bounded-context>/` seguindo a estrutura da Seção 4.
2. Definir o(s) Aggregate(s) Root do domínio real (já decidido na Missão 0004 — não inventar agregado novo aqui).
3. Definir a interface de Repositório no Domain.
4. Escrever o(s) Caso(s) de Uso na Application.
5. Implementar o Repositório na Infrastructure, com Mapper.
6. Expor endpoint(s) mínimos necessários no Controller, com Guard e DTOs.
7. Adicionar bloco `schema` correspondente no `prisma/schema.prisma` (Missão 0006, Seção 9) — nunca `@relation` cruzando contexto.
8. Registrar Eventos de Domínio relevantes (já listados na Missão 0004/0005 — não inventar evento novo sem necessidade real).
9. Escrever teste unitário do Domain, teste de integração do Caso de Uso, teste de contrato de fronteira.
10. Registrar o módulo em `app.module.ts`, exportando só a Application Service Interface.
11. Checar o item correspondente na Seção 7 (Convenções Obrigatórias) e na Definition of Done (Seção 11) antes de considerar pronto.

---

## 10. Princípio da Simplicidade

_Refinamento 6 da Rodada 2 de revisão — talvez o princípio mais importante deste documento, por isso vem antes dos demais._

> **Sempre escolher a solução mais simples que respeite integralmente os ADRs e os Invariantes. Complexidade só pode ser introduzida quando resolver um problema real observado, nunca antecipado.**

Este princípio não é decoração — é a mesma lógica que já fundamentou a decisão do Monólito Modular (ADR-0019: nada de microsserviço antecipado), do Cache em memória (Seção 7 da Missão 0007: nada de cache distribuído antecipado) e do Outbox in-process (ADR-0023: nada de broker antecipado). Toda vez que uma decisão de implementação futura parecer "mais robusta" ou "mais preparada para o futuro", a pergunta correta não é "isso é melhor?" — é **"existe um problema real, já observado, que só essa complexidade resolve?"**. Se a resposta for não, a solução mais simples vence, mesmo que pareça menos impressionante.

Isso não é permissão para ignorar ADR ou Invariante — a simplicidade só é válida **dentro** do que já foi decidido, nunca como desculpa para pular Guard de permissão, pular teste, ou violar fronteira de Bounded Context.

---

## 11. Definition of Done

_Refinamento 1 da Rodada 2 de revisão — quando um módulo (ou uma alteração em um módulo) pode ser considerado pronto._

Um módulo, ou uma alteração de módulo, só é considerado concluído quando:

- [ ] Possui testes unitários mínimos (camada de Domain — Agregados e Invariantes).
- [ ] Possui teste de integração (camada de Application — Caso de Uso completo).
- [ ] Possui documentação da API (endpoints do Controller, ao menos no README do módulo).
- [ ] Possui eventos documentados — publicados e consumidos (README do módulo, Seção 8).
- [ ] Atinge a cobertura mínima definida para o projeto (valor exato a ser fixado na Missão 0008, junto com a ferramenta de teste).
- [ ] Passa lint sem exceção suprimida sem justificativa.
- [ ] Passa type-check sem uso de `any` não justificado.
- [ ] Passa build sem warning novo introduzido.
- [ ] Não possui dependência cíclica entre módulos nem dentro do próprio módulo.
- [ ] Não viola nenhum ADR (checagem manual até existir automação — ver Seção 15).

Nenhum módulo é mesclado à branch principal sem passar por todos os itens acima.

---

## 12. Arquivos Obrigatórios

_Refinamento 2 da Rodada 2 de revisão._

Todo módulo, sem exceção, contém exatamente:

```
<bounded-context>/
├── README.md          # objetivo, agregado, eventos publicados, eventos consumidos, invariantes
├── CHANGELOG.md        # histórico de mudanças relevantes do módulo, por versão/data
├── <bc>.module.ts
├── domain/
├── application/
├── infrastructure/
├── api/
└── __tests__/
```

O `README.md` de cada módulo responde, no mínimo: objetivo do módulo, Agregado(s) que possui, Eventos que publica, Eventos que consome, Invariantes que aplica — ver o exemplo completo na Seção 8. O `CHANGELOG.md` evita que a única forma de saber "o que mudou neste módulo e por quê" seja vasculhar histórico de commit — decisão que se paga sozinha em poucos meses de projeto ativo.

---

## 13. Code Smells (o que nunca fazer)

_Refinamento 3 da Rodada 2 de revisão — para que o projeto não "apodreça" conforme cresce._

| Nunca fazer                                                                                    | Fazer em vez disso                                                                                              |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `if (tipo === X) ... if (tipo === Y) ... if (tipo === Z)` encadeado para decidir comportamento | Extrair um padrão Strategy (uma implementação por tipo, resolvida por injeção/lookup)                           |
| Um "Service" ou "Use Case" de centenas de linhas fazendo várias coisas não relacionadas        | Quebrar em Casos de Uso menores, um por operação de negócio (Seção 4.8)                                         |
| Repositório contendo regra de negócio (ex: decidir se algo pode ser salvo)                     | Regra de negócio vive no Domain (Entidade/Invariante); Repositório só persiste                                  |
| Controller chamando `PrismaClient` diretamente                                                 | Controller → Caso de Uso → Repositório (interface) → implementação Prisma (Infrastructure) — nunca pular camada |
| Entidade de Domínio importando `@nestjs/*` ou qualquer coisa de `infrastructure/`              | Domain é framework-agnostic, sempre (Seção 4.1)                                                                 |
| DTO de API reutilizado como Entidade de Domínio (ou vice-versa)                                | DTO de API e Entidade são objetos diferentes, sempre traduzidos por um Mapper/Controller (Seção 4.7)            |

Encontrar qualquer item desta tabela em revisão de código é motivo de bloqueio da PR (Seção 15), não sugestão opcional.

---

## 14. Padrão de Pull Request

_Refinamento 4 da Rodada 2 de revisão._

Toda Pull Request, sem exceção, responde no seu texto de abertura:

```
Qual problema resolve?
Quais ADRs impacta (se algum)?
Publica evento(s)? Quais?
Consome evento(s) de outro módulo? Quais?
Tem migration? É reversível?
Tem rollback definido, se aplicável?
Tem teste cobrindo a mudança?
```

Uma PR sem essas respostas não deve ser considerada pronta para revisão — o objetivo não é burocracia, é garantir que quem revisa (Seção 15) tenha o contexto sem precisar perguntar no chat.

---

## 15. Guia de Revisão de Código

_Refinamento 5 da Rodada 2 de revisão._

Todo revisor de Pull Request verifica, nesta ordem:

- [ ] **DDD** — o Agregado/Entidade/Value Object usados são os já definidos na Missão 0004? Nenhum conceito novo foi inventado sem necessidade.
- [ ] **Invariantes** — toda regra de "isso nunca pode acontecer" (Missão 0004, Seção 11) está sendo validada dentro do Domain, não na API nem na Infrastructure.
- [ ] **Fronteira do Contexto** — nenhum `@relation` cross-contexto, nenhum import direto de outro módulo, nenhum acesso a repositório alheio (ADR-0016/0022).
- [ ] **Performance** — nenhuma consulta óbvia N+1, nenhum `SELECT *` desnecessário, nenhum cache introduzido fora do permitido (ADR-0007).
- [ ] **Segurança** — Guard de permissão presente em toda escrita; nenhum segredo hardcoded; validação de entrada em toda rota.
- [ ] **Eventos** — nomeados corretamente (particípio passado, ADR-0006); publicados na mesma transação da mudança de estado (ADR-0013/0023).
- [ ] **Tratamento de erro** — erro de domínio (Invariante violado) tratado de forma diferente de erro de infraestrutura (falha de rede/banco).
- [ ] **Logs** — estruturados, sem dado sensível, com Correlation ID propagado (Missão 0005, Seção 13).
- [ ] **Testes** — presentes nas três camadas esperadas (Seção 11, Definition of Done) para a mudança em questão.

Hoje, com o projeto ainda sem uma linha de código de produto, este checklist pode parecer excessivo. Ele existe para não precisar ser inventado sob pressão quando o primeiro bug de produção acontecer.

---

## 16. Rastreabilidade

| Decisão deste Blueprint                                                                            | Missão/ADR de origem                                                                                                              |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Diretório por Bounded Context                                                                      | Missão 0005, Seção 2 · ADR-0004                                                                                                   |
| Domain nunca importa Infrastructure                                                                | Missão 0005, Princípio 7 (DIP)                                                                                                    |
| Interface de Repositório no Domain, implementação na Infrastructure                                | Missão 0005, Princípio 7 · ADR-0022                                                                                               |
| Nenhum `@relation` cruzando Bounded Context                                                        | Missão 0006, Seção 3 · ADR-0016 · ADR-0022                                                                                        |
| Módulo só exporta Application Service Interface                                                    | ADR-0022                                                                                                                          |
| Outbox na mesma transação da escrita do Agregado                                                   | ADR-0013 · ADR-0023                                                                                                               |
| Evento no particípio passado                                                                       | ADR-0006                                                                                                                          |
| Guard de permissão antes do Caso de Uso                                                            | Missão 0005, Seção 12                                                                                                             |
| Coluna de escopo (`empresa_id`/`loja_id`/nenhuma) por tabela                                       | ADR-0002 · ADR-0014 · ADR-0017 · ADR-0018                                                                                         |
| Três camadas de teste                                                                              | Missão 0007, Seção 12                                                                                                             |
| Registro de Auditoria síncrono                                                                     | Missão 0004/0005, Seção 12                                                                                                        |
| Princípio da Simplicidade _(Rodada 2)_                                                             | Consequência direta de ADR-0019 (Monólito Modular), Seção 7/ADR-0023 (Cache/Outbox sem antecipação)                               |
| Definition of Done, Arquivos Obrigatórios, Code Smells, Padrão de PR, Guia de Revisão _(Rodada 2)_ | Boas práticas de engenharia aplicadas à arquitetura já congelada — não alteram nenhuma decisão, formalizam disciplina de execução |

Nenhuma linha desta tabela foi decidida nesta missão — todas são tradução direta de algo já congelado, ou disciplina de engenharia aplicada sobre o que já estava congelado.

---

## 17. O Que Fica Fora (reforço das restrições)

Sem funcionalidade de negócio real, sem tela, sem regra de domínio do SmartFood além do módulo fictício de exemplo, sem endpoint de produto, sem iniciar Catálogo/Pedidos/Clientes/Pagamentos. Sem repositório Git real, sem CI/CD configurado, sem Docker Compose funcional — isso é escopo explícito da Missão 0008 (Smart Starter Kit), que usa este Blueprint como especificação, não o substitui.

---

## 18. Preparação para a Missão 0008 (Smart Starter Kit)

A Missão 0008 recebe deste Blueprint: a estrutura de diretórios (Seção 2) pronta para virar repositório real; a anatomia de módulo (Seção 4) pronta para virar template/gerador de scaffold; o checklist de criação de módulo (Seção 9) pronto para virar script ou documentação de onboarding; as convenções obrigatórias (Seção 7) e a Definition of Done (Seção 11) prontas para virar regra de lint/CI automatizada onde possível; o Padrão de Pull Request (Seção 14) pronto para virar template de PR do repositório. A Missão 0008 constrói o repositório, o CI/CD, o Docker, a configuração inicial — usando exatamente esta estrutura, sem redecidir nada. Sequência recomendada pelo usuário para a Missão 0008: repositório real → `docker compose up` funcionando localmente → login funcionando → health check → primeiro endpoint (`GET /health`) → primeiro módulo real (Identidade & Empresa) → só então Catálogo e Pedidos.

---

_Fim do documento — Missão 0007.5, ✅ CONGELADA. Ver [missao-0007-5-review-notes.md](../../engineering/review-notes/missao-0007-5-review-notes.md) para o histórico da revisão. Esta é a última missão de arquitetura/documentação estrutural do SmartFood — a partir da Missão 0008, toda missão entrega software executável._
