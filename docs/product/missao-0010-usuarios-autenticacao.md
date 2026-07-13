# Missão 0010 — Usuários e Autenticação

**Status:** ✅ CONGELADA — versão oficial
**Data:** 2026-07-12
**Tipo:** Execução (segundo Bounded Context de negócio, mesmo schema físico `identidade_empresa` da Missão 0009)

Draft enxuto, mesmo formato da Missão 0009. Nenhuma decisão arquitetural nova — só recorta, dentro do que já está congelado, o que entra no primeiro incremento executável de Usuário + Autenticação. Estrutura de módulo vem de [Missão 0007.5 — Blueprint Técnico](missao-0007-5-blueprint-tecnico.md), fluxo JWT vem do [ADR-0024](../engineering/adr/ADR-0024-autenticacao-jwt-dois-fluxos.md) e do Smart Security Guide.

## 1. Objetivo

Implementar o Agregado **Usuário** (equipe interna, escopado por Empresa) e o fluxo de **Autenticação de Usuário** (um dos dois fluxos do ADR-0024 — o de Cliente fica para quando Vitrine/Checkout existirem). Ao final, é possível criar um Usuário dentro de uma Empresa, fazer login, e proteger um endpoint com Guard de autenticação + Papel.

## 2. Escopo

### Dentro desta missão

- Agregado **Usuário** (Missão 0004, Seção 4): `nome`, `email` (único por Empresa), `senhaHash`, `empresaId`, vinculado a exatamente **um** Papel nesta missão (a tabela de associação `usuario_papel` já nasce N:N, Missão 0006, mas o Caso de Uso só permite atribuir um na criação — múltiplos Papéis por Usuário fica para quando houver caso de uso real).
- Tabela **Papel**, seedada com os papéis internos do [Smart Security Guide](../../../Smart%20Platform/SMART_SECURITY_GUIDE_v1.0.md) que se aplicam a Usuário: **Administrador, Gerente, Supervisor, Operador, Financeiro**. _(Não Cliente/Visitante — esses dois mapeiam para o outro fluxo do ADR-0024 e para acesso público, nunca para uma linha em `papeis` de Usuário interno.)_
- Caso de uso **CriarUsuario** — cria um Usuário dentro de uma Empresa, com senha hasheada (bcrypt) e um Papel. Protegido por autenticação + RBAC (só Administrador da própria Empresa pode chamar) — **com uma exceção, ver Seção 3**.
- Caso de uso **Login** (`POST /auth/login`) — valida e-mail+senha, emite Access Token (JWT, claims `usuarioId`+`empresaId`+`papel`, expira em 30 min) e Refresh Token (JWT, expira em 7 dias).
- Caso de uso **RefreshToken** (`POST /auth/refresh`) — troca um Refresh Token válido por um novo Access Token.
- **Guard de autenticação** (`JwtAuthGuard`, Passport.js) + **Guard de Papel** (`PapelPermissaoGuard`, citado no Blueprint) aplicados a `GET /empresas/:id` (Missão 0009 deixou esse endpoint aberto de propósito, citando esta missão) e a `POST /usuarios`.

### Fora desta missão (explicitamente adiado)

- Autenticação de **Cliente** (o outro fluxo do ADR-0024) — só faz sentido quando existir Vitrine/Checkout.
- Múltiplos Papéis por Usuário — tabela suporta, caso de uso não expõe ainda.
- Revogação/rotação de Refresh Token com tabela própria de controle — nesta missão o Refresh Token é validado só por assinatura+expiração (stateless); revogação em lista (ex: logout que invalida token antes de expirar) fica para quando houver requisito real.
- Cookie `httpOnly` para o Refresh Token — o Security Guide pede isso "quando o cliente é web"; como não há frontend consumindo login ainda, o token volta no corpo da resposta HTTP por ora.
- Convite por e-mail, redefinição de senha, verificação de e-mail, bloqueio de conta por tentativas — tudo Gestão de Usuários "completa" (EPIC-008), não o mínimo de Autenticação.
- Gestão/CRUD de Papel (criar, editar, listar papéis customizados) — os 5 papéis desta missão nascem via seed, não endpoint.
- Qualquer módulo de negócio (Catálogo, Pedido, Pagamento, Cliente, Estoque, Fidelidade).

## 3. Problema do "primeiro Usuário" (precisa da sua confirmação)

`POST /empresas` (Missão 0009) cria uma Empresa sem nenhum Usuário — de propósito, para não reabrir aquela missão já congelada. Isso cria um problema real: se `CriarUsuario` exige um Administrador autenticado, **nenhuma Empresa nova consegue ter seu primeiro Usuário**, porque não existe ninguém para autenticar ainda.

**Solução proposta:** `POST /usuarios` aceita criar o primeiro Usuário de uma Empresa **sem autenticação, só se aquela Empresa ainda não tiver nenhum Usuário** — nesse caso único, o Papel é forçado a `Administrador` (ignora o Papel enviado no corpo, se houver). Assim que existir 1 Usuário na Empresa, toda chamada seguinte a `POST /usuarios` exige Guard (Administrador autenticado da mesma Empresa). É um padrão de bootstrap comum (não é uma falha de segurança se a regra "só funciona com zero Usuários" for reforçada no próprio Caso de Uso, não só na documentação).

Se preferir outra solução (ex: `POST /empresas` da Missão 0010 em diante passar a exigir dados do primeiro Usuário — o que reabriria o contrato da Missão 0009), me avise antes de eu implementar.

## 4. Modelagem (herdada, não decidida aqui)

Fonte: Missão 0004 Seção 4, Missão 0006 Seção 9 (`schema identidade_empresa → ..., usuarios, papeis`), ADR-0024.

| Campo (Usuário) | Tipo     | Observação                                                                                        |
| --------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `id`            | UUID     | PK                                                                                                |
| `empresaId`     | UUID     | FK (mesmo Bounded Context — Missão 0006, Seção 4)                                                 |
| `nome`          | string   | obrigatório                                                                                       |
| `email`         | string   | único **por Empresa** (não globalmente — um mesmo e-mail pode ser Usuário em Empresas diferentes) |
| `senhaHash`     | string   | bcrypt, nunca texto plano, nunca logado (Security Guide)                                          |
| `criadoEm`      | datetime | `now()`                                                                                           |

| Campo (Papel) | Tipo   | Observação                      |
| ------------- | ------ | ------------------------------- |
| `id`          | UUID   | PK                              |
| `nome`        | string | um dos 5 papéis internos (seed) |

`usuario_papel`: tabela de associação N:N (Missão 0006), usada nesta missão sempre com exatamente 1 linha por Usuário.

**Invariante:** Papel só concede permissão dentro da Empresa à qual o Usuário pertence (Missão 0004, Invariante 6) — todo Guard de Papel checa `usuario.empresaId === recurso.empresaId`, nunca só o nome do Papel isoladamente.

## 5. Contrato de API (proposto)

| Método | Rota            | Caso de uso              | Auth                                                                                                                        |
| ------ | --------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/usuarios`     | Criar Usuário            | Aberto **só** se a Empresa ainda não tem Usuário (Seção 3); caso contrário exige Administrador autenticado da mesma Empresa |
| `POST` | `/auth/login`   | Login                    | Público                                                                                                                     |
| `POST` | `/auth/refresh` | Refresh Token            | Requer Refresh Token válido no corpo                                                                                        |
| `GET`  | `/empresas/:id` | (já existe, Missão 0009) | Passa a exigir autenticação — qualquer Papel, mesma Empresa do recurso                                                      |

## 6. Estrutura de módulo

Novo Bounded Context `modules/usuarios/` (domain/application/infrastructure/api/test — igual à Missão 0009) + um módulo de plataforma `platform/auth/` para o mecanismo JWT/Guards em si (compartilhável por qualquer módulo futuro que precise proteger rota, igual `platform/outbox` — não é lógica de negócio de Usuário, é mecanismo).

## 7. Critérios de simplicidade

Esta missão valida: Agregado Usuário, hashing de senha, emissão/validação de JWT (dois tokens), Guard de autenticação, Guard de Papel básico, seed de Papel. Qualquer regra adicional — multi-Papel, convite, redefinição de senha, verificação de e-mail, bloqueio por tentativa, revogação de Refresh Token — é adiada, sem exceção, mesmo que pareça pequena durante a implementação.

## 8. Definition of Done

- [ ] `POST /usuarios` cria o primeiro Usuário (Administrador) de uma Empresa sem auth; bloqueia chamada sem auth se já existir Usuário na Empresa.
- [ ] `POST /usuarios` autenticado exige Papel Administrador da mesma Empresa do corpo da requisição.
- [ ] `POST /auth/login` retorna 200 com Access+Refresh Token para credenciais corretas, 401 para credenciais erradas.
- [ ] `POST /auth/refresh` retorna novo Access Token para um Refresh Token válido, 401 para um expirado/inválido.
- [ ] `GET /empresas/:id` passa a exigir token válido (401 sem token, 200 com token válido da mesma Empresa).
- [ ] Senha nunca aparece em log, nem em resposta de qualquer endpoint (nem `senhaHash`).
- [ ] Migration Prisma para `identidade_empresa.usuarios`, `identidade_empresa.papeis`, `identidade_empresa.usuario_papel`; seed dos 5 papéis.
- [ ] Teste unitário de domínio (invariante: Papel só vale dentro da própria Empresa).
- [ ] Teste de integração de Login (senha certa/errada) e de CriarUsuario (bootstrap vs. bloqueado).
- [ ] Teste de contrato: módulo `usuarios` não importa de `identidade-empresa` além do que este exporta (e vice-versa).
- [ ] `pnpm lint` / `pnpm test` / `pnpm build` / `docker compose up` verdes.
- [ ] `POST /auth/login` responde em menos de 500ms local (mesmo critério informal da Missão 0009).
- [ ] Nenhuma linha de Cliente, Produto, Pedido, Pagamento, Catálogo, Estoque ou Fidelidade neste incremento.

## 9. Próximo passo

Aguardando sua revisão — em especial a Seção 3 (problema do primeiro Usuário), que é a única decisão de design real desta missão que não vem 100% pronta de uma missão anterior.
