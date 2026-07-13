# Missão 0009 — Identidade & Empresa

**Status:** ✅ CONGELADA — versão oficial
**Data:** 2026-07-12
**Tipo:** Execução (primeiro Bounded Context de negócio, pós Missão 0008 — Smart Starter Kit)

Este é um Draft **enxuto**, por decisão explícita do CTO/PO: nenhuma decisão arquitetural nova é tomada aqui — este documento só recorta, dentro do que já foi congelado, o que exatamente entra no primeiro incremento executável. Toda regra de estrutura de código (camadas, nomeação, checklist de criação de Bounded Context) vem de [Missão 0007.5 — Blueprint Técnico](missao-0007-5-blueprint-tecnico.md) e não é repetida aqui.

## 1. Objetivo

Implementar o núcleo do Bounded Context **Identidade & Empresa** — o suficiente para existir uma Empresa (Tenant) no banco, com sua Loja padrão, sem login e sem gestão de usuários. Este é o primeiro módulo de negócio do SmartFood: valida, na prática, se o Blueprint Técnico (Missão 0007.5) e o modelo físico (Missão 0006) se sustentam com código real.

## 2. Escopo

### Dentro desta missão

- Agregado **Empresa** (raiz — é o Tenant, [ADR-0002](../engineering/adr/ADR-0002-multi-tenant-por-empresa.md)): cadastro mínimo de onboarding.
- Criação automática da **Loja** padrão da Empresa (MVP: 1 Loja por Empresa — Missão 0006, Seção 2).
- Caso de uso **Criar Empresa** (onboarding mínimo — nome, categoria de negócio, telefone, CNPJ/CPF; Missão 0002, Seção 5/Jornada).
- Caso de uso **Buscar Empresa por Id**.
- Evento de domínio **EMPRESA_CRIADA** publicado (payload mínimo — Missão 0004, Seção 6), sem assinantes ainda (Central de Comunicação/Financeiro entram em missão própria).
- Schema Prisma `identidade_empresa` (Missão 0006, Seção 9) com as tabelas `empresas` e `lojas`.

### Fora desta missão (explicitamente adiado)

- **Usuário, Papel, Login/JWT** — Missão 0010 (Usuários e Autenticação), mesmo pertencendo ao mesmo schema físico `identidade_empresa` (Missão 0006). Empresa nasce sem nenhum Usuário vinculado ainda.
- **Configuração da Loja completa** (identidade visual, horário, entrega/retirada, domínio próprio) — EPIC-007, missão futura.
- **Dados fiscais completos / NFC-e** — Enterprise (Missão 0002, Seção 5).
- **Chave PIX** — coluna existe no modelo (Missão 0006, Seção 9), mas cadastro/edição fica para a missão de Configuração da Loja; nesta missão o campo só existe na tabela, nulo por padrão.
- Qualquer endpoint de autenticação, RBAC ou Guard de permissão — sem Usuário, não há o que guardar ainda.

## 3. Critérios de simplicidade

Esta missão existe apenas para validar, com código real, um caminho fino de ponta a ponta:

- Aggregate Root `Empresa` (com a invariante da Loja).
- Persistência via Prisma.
- Migration.
- Caso de Uso (`CriarEmpresa`, `BuscarEmpresaPorId`).
- Controller (`POST /empresas`, `GET /empresas/:id`).
- Evento publicado no Outbox (`EMPRESA_CRIADA`).

**Qualquer regra adicional é adiada para uma missão futura, sem exceção.** Exemplos que não entram aqui, mesmo que pareçam pequenos ou "já que estamos aqui": validação completa de CNPJ (dígito verificador, Receita Federal), upload de logo, cadastro de endereço, telefone internacional, múltiplas Lojas por Empresa, NFC-e, edição da Chave PIX. Se um desses aparecer durante a implementação, ele volta para o backlog — não vira acréscimo de escopo desta missão.

## 4. Modelagem (herdada, não decidida aqui)

Fonte: [Missão 0004, Seção 4](missao-0004-modelagem-dominio.md) e [Missão 0006, Seção 2 e 9](missao-0006-modelagem-banco-dados.md).

| Campo (Empresa)    | Tipo             | Observação                                     |
| ------------------ | ---------------- | ---------------------------------------------- |
| `id`               | UUID (surrogate) | PK, gerado pelo sistema (Missão 0006, Seção 4) |
| `nome`             | string           | obrigatório                                    |
| `cnpjCpf`          | string           | `UNIQUE`, não é PK (Missão 0006, Seção 4)      |
| `categoriaNegocio` | string           | obrigatório (Missão 0002, Seção 5)             |
| `telefone`         | string           | obrigatório                                    |
| `chavePix`         | string, opcional | nulo na criação — fora de escopo editar aqui   |
| `criadaEm`         | datetime         | `now()`                                        |

| Campo (Loja) | Tipo             | Observação                                                                                                                            |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | UUID (surrogate) | PK                                                                                                                                    |
| `empresaId`  | UUID             | FK física dentro do mesmo Agregado (Missão 0006, Seção 4 — permitido só porque Loja é filha de Empresa, nunca entre Bounded Contexts) |
| `nome`       | string           | criada com o mesmo nome da Empresa no onboarding (pode ser editado depois, fora de escopo)                                            |
| `criadaEm`   | datetime         | `now()`                                                                                                                               |

**Invariante:** toda Empresa nasce com exatamente uma Loja, criada na mesma transação do Caso de Uso `CriarEmpresa` (Missão 0006, Seção 2: "cada Empresa tem exatamente uma Loja, criada automaticamente no Onboarding").

## 5. Contrato de API (proposto)

| Método | Rota            | Caso de uso           | Observação                                                                                                                                    |
| ------ | --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/empresas`     | Criar Empresa         | Cria Empresa + Loja padrão na mesma transação; dispara `EMPRESA_CRIADA`                                                                       |
| `GET`  | `/empresas/:id` | Buscar Empresa por Id | Sem RBAC ainda (Missão 0010) — endpoint tecnicamente aberto nesta missão, aceito conscientemente porque não há Usuário para autenticar contra |

Nenhum outro verbo (update/delete) nesta missão — edição de Empresa fica para quando existir Usuário/Papel para autorizar a ação (Missão 0010+).

## 6. Estrutura de módulo

Segue exatamente a anatomia definida na Missão 0007.5, Seção 4 — sem nenhuma variação:

```
backend/src/modules/identidade-empresa/
├── domain/
│   ├── empresa.entity.ts
│   ├── loja.entity.ts
│   ├── empresa.repository.ts
│   └── events/empresa-criada.domain-event.ts
├── application/
│   ├── use-cases/criar-empresa.use-case.ts
│   ├── use-cases/buscar-empresa-por-id.use-case.ts
│   └── dtos/criar-empresa.command.ts
├── infrastructure/
│   └── prisma-empresa.repository.ts
├── api/
│   ├── empresa.controller.ts
│   └── dtos/criar-empresa.dto.ts
├── test/
│   ├── domain/
│   ├── application/
│   └── contract/
└── identidade-empresa.module.ts
```

`identidade-empresa.module.ts` exporta só a Application Service Interface (ADR-0022) — nenhum outro módulo futuro importa o repositório ou as entidades diretamente.

## 7. Definition of Done

- [ ] `POST /empresas` cria Empresa + Loja em transação única, retorna 201 com o Empresa criado.
- [ ] `GET /empresas/:id` retorna 200 com a Empresa, 404 se não existir.
- [ ] Evento `EMPRESA_CRIADA` publicado na tabela `eventos_publicados` (Missão 0006, Seção 7) — sem assinante ainda, só a publicação.
- [ ] Migration Prisma para `identidade_empresa.empresas` e `identidade_empresa.lojas`.
- [ ] Teste unitário de domínio (invariante: Empresa sempre nasce com uma Loja).
- [ ] Teste de integração do Caso de Uso `CriarEmpresa` (com repositório real de teste).
- [ ] Teste de contrato: módulo não importa nada de outro Bounded Context.
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `docker compose up` verdes, mesmo checklist de validação usado na Missão 0008.
- [ ] Nenhuma linha de Usuário, Cliente, Produto, Pedido, Pagamento, Catálogo, Estoque ou Fidelidade neste incremento.
- [ ] `POST /empresas` responde em menos de 500ms em ambiente local (medição informal, não é gate automatizado nesta missão — início de uma cultura de atenção a performance, não uma exigência de SLA formal ainda).

## 8. Próximo passo

Após aprovação deste Draft (Review CTO/PO), implementação em incrementos pequenos e validados — mesmo modelo de trabalho da Missão 0008 (um incremento por vez, cada um validado com testes/build antes do próximo), sem esperar um Review Notes formal por incremento de código.
