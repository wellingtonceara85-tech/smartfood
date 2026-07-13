# Review Notes — Missão 0010 (Usuários e Autenticação)

**Rodada:** 1 (única — aprovado sem alterações)
**Data:** 2026-07-12
**Revisor:** Wellington (CTO/PO), dentro da conversa

## Veredito

Aprovado como está, sem nenhuma alteração de escopo, modelagem, contrato de API ou estrutura de módulo.

## Ponto de decisão específico desta missão

A Seção 3 do Draft (problema do "primeiro Usuário") era a única decisão de design real não herdada diretamente de missão anterior — como criar o primeiro Usuário de uma Empresa recém-criada (Missão 0009) sem exigir autenticação que ainda não pode existir. Proposta: `POST /usuarios` aceita criação sem autenticação **apenas quando a Empresa ainda não tem nenhum Usuário** (força Papel Administrador nesse caso), autobloqueando-se depois. **Aprovada sem ressalvas.**

## O que NÃO mudou (confirmado como já correto no Draft)

- Escopo: Agregado Usuário, 5 Papéis internos seedados (Administrador/Gerente/Supervisor/Operador/Financeiro), Login, Refresh, Guards em `POST /usuarios` e `GET /empresas/:id`.
- Todas as exclusões explícitas da Seção 2 (autenticação de Cliente, multi-Papel, revogação de refresh token com tabela própria, cookie httpOnly, convite/redefinição de senha/verificação de e-mail, CRUD de Papel).
- Definition of Done (Seção 8) na íntegra.

## Próximo passo

Documento consolidado e marcado como **CONGELADA — versão oficial**. Implementação segue em incrementos pequenos e validados, mesmo modelo das Missões 0008/0009.
