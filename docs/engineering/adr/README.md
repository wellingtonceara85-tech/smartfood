# SmartFood — ADRs (Architecture Decision Records)

Prática adotada em 2026-07-11. Diferente das [Review Notes](../review-notes/) (histórico de revisão _por missão_), um ADR registra **uma decisão estrutural específica**, com contexto e consequências, pesquisável por assunto em vez de por missão — a resposta direta para "por que fizemos assim?" daqui a seis meses.

## Quando criar um ADR

Toda decisão estrutural relevante: que sobrevive a mais de uma missão, que teria custo real de reverter, ou que não é óbvia de re-derivar só lendo o código/documento final. Nem toda decisão vira ADR — decisão óbvia ou de baixo custo de reverter não precisa.

## Numeração

Sequencial pela ordem em que a decisão é de fato tomada (não pela ordem temática) — um ADR só existe quando a decisão já aconteceu, nunca como placeholder para uma decisão futura.

## Template

```markdown
# ADR-XXXX — Título da Decisão

**Status:** Proposto | Aceito | Substituído por ADR-YYYY | Obsoleto
**Data:** AAAA-MM-DD
**Missão relacionada:** (se houver)

## Contexto

O que motivou a decisão — o problema, não a solução.

## Decisão

O que foi decidido, de forma direta.

## Alternativas consideradas

O que mais foi avaliado e por que não foi escolhido.

## Consequências

O que essa decisão facilita, o que ela custa, o que ela impede.
```

## Índice

| ADR                                                                    | Título                                                                                                         | Status |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| [ADR-0001](ADR-0001-pedido-aggregate-root-central.md)                  | Pedido como Aggregate Root central do domínio                                                                  | Aceito |
| [ADR-0002](ADR-0002-multi-tenant-por-empresa.md)                       | Multi-tenant por Empresa (Empresa = Tenant, escopo SmartFood)                                                  | Aceito |
| [ADR-0003](ADR-0003-pedido-snapshot-completo.md)                       | Pedido como snapshot completo e imutável da venda                                                              | Aceito |
| [ADR-0004](ADR-0004-bounded-context-como-unidade-de-decomposicao.md)   | Bounded Context como unidade de decomposição                                                                   | Aceito |
| [ADR-0005](ADR-0005-fusao-comercial-operacional.md)                    | Fusão de Comercial e Operacional em "Vendas & Operação"                                                        | Aceito |
| [ADR-0006](ADR-0006-comunicacao-por-eventos.md)                        | Comunicação assíncrona por Evento de Domínio como padrão                                                       | Aceito |
| [ADR-0007](ADR-0007-cache-proibido-contextos-criticos.md)              | Cache proibido em contextos transacionais críticos                                                             | Aceito |
| [ADR-0008](ADR-0008-sem-estrategia-offline.md)                         | Nenhuma estratégia offline para contextos centrais                                                             | Aceito |
| [ADR-0009](ADR-0009-publicacao-evento-posterior-transacao.md)          | Publicação de evento sempre posterior à transação principal                                                    | Aceito |
| [ADR-0010](ADR-0010-comunicacao-bounded-context-nao-servico.md)        | "Comunicação" é Bounded Context, não serviço compartilhado                                                     | Aceito |
| [ADR-0011](ADR-0011-ia-relatorios-capabilities-nao-bounded-context.md) | IA e Relatórios & Analytics como Capabilities, não Bounded Context                                             | Aceito |
| [ADR-0012](ADR-0012-anti-corruption-layer-obrigatoria.md)              | Anti-Corruption Layer obrigatória em fronteira externa                                                         | Aceito |
| [ADR-0013](ADR-0013-garantia-publicacao-evento-atomica.md)             | Garantia de publicação de evento atômica à mudança de estado                                                   | Aceito |
| [ADR-0014](ADR-0014-multi-tenant-coluna-discriminadora.md)             | Multi-tenant por coluna discriminadora, não schema-por-tenant                                                  | Aceito |
| [ADR-0015](ADR-0015-eventos-publicados-tabela-propria.md)              | Eventos Publicados como tabela própria, distinta de Auditoria                                                  | Aceito |
| [ADR-0016](ADR-0016-sem-fk-fisica-entre-bounded-contexts.md)           | Nenhuma FK física nem JOIN cruza fronteira de Bounded Context                                                  | Aceito |
| [ADR-0017](ADR-0017-cliente-entidade-global.md)                        | Cliente é entidade global, não escopada por Empresa                                                            | Aceito |
| [ADR-0018](ADR-0018-produto-escopado-por-loja.md)                      | Produto escopado por Loja, não diretamente por Empresa                                                         | Aceito |
| [ADR-0019](ADR-0019-arquitetura-implantacao-monolito-modular.md)       | Arquitetura de Implantação: Monólito Modular                                                                   | Aceito |
| [ADR-0020](ADR-0020-framework-backend-nestjs.md)                       | Framework de Backend: NestJS                                                                                   | Aceito |
| [ADR-0021](ADR-0021-banco-de-dados-postgresql.md)                      | Banco de Dados: PostgreSQL                                                                                     | Aceito |
| [ADR-0022](ADR-0022-comunicacao-entre-modulos.md)                      | Comunicação entre Módulos (implementação física)                                                               | Aceito |
| [ADR-0023](ADR-0023-barramento-eventos-outbox-relay.md)                | Barramento de Eventos: Outbox + Relay In-Process                                                               | Aceito |
| [ADR-0024](ADR-0024-autenticacao-jwt-dois-fluxos.md)                   | Autenticação: JWT + Refresh Token, dois fluxos de identidade                                                   | Aceito |
| [ADR-0025](ADR-0025-pronto-saiu-para-entrega-estados-distintos.md)     | `Pronto` e `Saiu para Entrega` são estados distintos do Pedido (correção de ambiguidade, não mudança de regra) | Aceito |
