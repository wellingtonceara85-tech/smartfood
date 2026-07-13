# Review Notes — Missão 0009 (Identidade & Empresa)

**Rodada:** 1 (única — aprovado com dois ajustes pontuais)
**Data:** 2026-07-12
**Revisor:** Wellington (CTO/PO), dentro da conversa

## Veredito

Aprovado, com dois acréscimos pontuais. Nenhuma mudança de escopo, modelagem, contrato de API ou estrutura de módulo — o Draft original foi validado como está em todos esses pontos.

## O que mudou e por quê

1. **Adicionada Seção 3 — Critérios de Simplicidade.** O Draft original já deixava escopo claro (Seção 2), mas o CTO/PO pediu uma seção explícita listando o que esta missão valida (Aggregate Root, persistência Prisma, migration, caso de uso, controller, evento Outbox) e uma lista nomeada de exemplos que não entram (validação completa de CNPJ, upload de logo, endereço, telefone internacional, múltiplas Lojas, NFC-e, edição de Chave PIX). **Motivo declarado:** evitar scope creep incremental do tipo "já que estamos aqui" durante a implementação — tornar a lista de exclusões explícita e citável, não apenas implícita na Seção 2 original.
2. **Adicionado item de performance na Definition of Done** (Seção 7): `POST /empresas` deve responder em menos de 500ms em ambiente local. **Motivo declarado:** não é uma exigência técnica desta missão especificamente, mas uma decisão consciente de começar a cultivar atenção a performance desde o primeiro módulo de negócio. Registrado explicitamente como medição informal, não gate automatizado — para não confundir com um SLA formal que ainda não foi decidido em nenhuma missão de arquitetura.

## O que NÃO mudou (confirmado como já correto no Draft)

- Separação Empresa / Usuário em missões diferentes (0009 vs. 0010) — elogiada explicitamente como decisão que evita o antipadrão de um único `POST /register` monolítico.
- Loja criada automaticamente junto com Empresa (invariante, não `if` condicional em runtime).
- `GET /empresas/:id` sem Guard/RBAC nesta missão — aceito conscientemente, já que não existe Usuário para autenticar contra ainda; Missão 0010 muda isso.
- Estrutura de módulo (Seção 6) e contrato de API (Seção 5) aprovados sem nenhuma alteração.

## Trade-offs aceitos conscientemente

- O item de performance na DoD é deliberadamente não-bloqueante e sem instrumentação automatizada nesta missão — decisão consciente de não introduzir ferramental de medição (APM, benchmark automatizado) só para isso agora. Se a cultura de performance precisar de gate automatizado no futuro, é decisão de uma missão técnica própria, não uma extensão silenciosa desta.

## Próximo passo

Documento consolidado e marcado como **CONGELADA — versão oficial**. Implementação segue em incrementos pequenos e validados (mesmo modelo da Missão 0008), sem exigir novo Review Notes por incremento de código — só se o escopo desta missão precisar mudar.
