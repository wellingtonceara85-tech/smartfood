# ADR-0024 — Autenticação: JWT + Refresh Token com Dois Fluxos de Identidade Separados

**Status:** Aceito
**Data:** 2026-07-12
**Missão relacionada:** [Missão 0007 — Arquitetura Técnica](../../product/missao-0007-arquitetura-tecnica.md), Seção 9 — implementa fisicamente ADR-0017 (Cliente é entidade global, Missão 0006) e a Missão 0005, Seção 12 (Identidade)

## Contexto

A Smart Platform Architecture já define JWT + Refresh Token como padrão de autenticação. A Missão 0004/0006 estabeleceu que Usuário (equipe interna) é sempre escopado por Empresa, enquanto Cliente (comprador final) é uma identidade global (ADR-0017) — dois modelos de identidade fundamentalmente diferentes que precisavam de uma decisão explícita de implementação para não serem tratados como a mesma coisa por engano.

## Decisão

Dois fluxos de autenticação completamente independentes, implementados via Passport.js sobre NestJS: **Autenticação de Usuário**, cujo JWT carrega `usuario_id` + `empresa_id` + `papel`; e **Autenticação de Cliente**, cujo JWT carrega apenas `cliente_id`, sem `empresa_id`. Nenhum dos dois fluxos compartilha mecanismo de sessão, middleware de verificação ou espaço de token.

## Alternativas consideradas

- **Plataforma de identidade gerenciada (Auth0, Clerk ou equivalente):** rejeitada — precificação por usuário/cliente ativo escala mal para um SaaS multi-tenant com muitas Empresas pequenas (critério de Custo); e a dualidade Usuário-escopado vs. Cliente-global é um requisito de domínio incomum o bastante para exigir contorno numa plataforma genérica de propósito geral, enquanto uma implementação própria expressa o Invariante 4 (Missão 0004) diretamente na estrutura do token, tornando impossível por construção emitir um token de Cliente com escopo de Empresa por engano.
- **Um único fluxo de autenticação para Usuário e Cliente, diferenciado só por um campo "tipo" no token:** rejeitada — mistura dois modelos de identidade com regras de negócio diferentes (RBAC por Empresa vs. identidade global) no mesmo mecanismo, criando risco real de um bug de autorização vazar entre os dois contextos.
- **Autenticação baseada em sessão de servidor (cookie), em vez de JWT:** rejeitada — a Smart Platform já fixou JWT como padrão institucional; nenhum requisito específico do SmartFood justifica desviar.

## Consequências

- **Facilita:** a própria estrutura do token impede, por construção, que a implementação viole o Invariante 4 (Cliente comprando em várias Empresas) — não depende de disciplina de código para não misturar os dois modelos.
- **Custa:** mantém a responsabilidade de hashing de senha, rotação e revogação de refresh token internamente, em vez de delegar a um provedor especializado — aceito, dado que o ecossistema Node/NestJS tem bibliotecas maduras para isso.
- **Impede:** login único (SSO) entre Usuário e Cliente do mesmo SmartFood — decisão consciente, coerente com a separação de identidade já definida na Missão 0004/0005; um eventual SSO entre produtos do ecossistema Smart, se vier a existir, é decisão de plataforma futura, não desta missão.
