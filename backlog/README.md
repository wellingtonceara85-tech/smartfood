# SmartFood — Backlog de Produto

Separado da documentação de arquitetura (`docs/`) de propósito: aqui vive **o que precisa ser construído**, lá vive **por que e como pensamos o produto**. Quando o SmartFood chegar na fase de implementação (Missão 0007/0008), o trabalho é implementar as épicas abaixo mantendo alinhamento com `docs/product/` — não inventar escopo novo na hora de codificar.

Cada épica mapeia 1:1 a um domínio funcional já definido e congelado na [Missão 0002](../docs/product/missao-0002-arquitetura-funcional.md) e refinado na [Missão 0004](../docs/product/missao-0004-modelagem-dominio.md) — nenhuma épica aqui introduz módulo novo; isso seria decisão de produto, não de backlog.

**Nível de detalhe atual:** cada épica lista os módulos/funcionalidades já mapeados nas missões de produto, com a Fase (MVP/v2.0/v3.0/Enterprise) herdada da Missão 0002. **Ainda não há user stories nem critério de aceite** — isso é refinado a partir da Missão 0007 (Smart Starter Kit) em diante, depois que Bounded Contexts (próxima missão) e telas (Missão 0003, já congelada) puderem informar o detalhe técnico de cada item, evitando refinar backlog duas vezes.

## Épicas

| Épica                                                                | Domínio (Missão 0002/0004)                 | Fase predominante |
| -------------------------------------------------------------------- | ------------------------------------------ | ----------------- |
| [EPIC-001 — Catálogo](EPIC-001-catalogo.md)                          | Comercial (catálogo/vitrine)               | MVP               |
| [EPIC-002 — Pedidos](EPIC-002-pedidos.md)                            | Comercial + Operacional (Motor de Pedidos) | MVP               |
| [EPIC-003 — Pagamentos](EPIC-003-pagamentos.md)                      | Pagamentos                                 | MVP → v2.0        |
| [EPIC-004 — Entrega e Retirada](EPIC-004-entrega.md)                 | Operacional (entrega, motoboy)             | MVP → v2.0        |
| [EPIC-005 — Experiência do Cliente](EPIC-005-experiencia-cliente.md) | Experiência do Cliente                     | MVP → v2.0        |
| [EPIC-006 — Central de Comunicação](EPIC-006-comunicacao.md)         | Central de Comunicação                     | MVP → v2.0        |
| [EPIC-007 — Configuração da Loja](EPIC-007-configuracao-loja.md)     | Configuração da Loja                       | MVP → v2.0        |
| [EPIC-008 — Administração](EPIC-008-administracao.md)                | Administração                              | MVP → v3.0        |
| [EPIC-009 — Financeiro](EPIC-009-financeiro.md)                      | Financeiro                                 | v2.0 → Enterprise |
| [EPIC-010 — Marketing](EPIC-010-marketing.md)                        | Marketing                                  | v2.0 → v3.0       |
| [EPIC-011 — Relatórios](EPIC-011-relatorios.md)                      | Relatórios                                 | MVP → v3.0        |
| [EPIC-012 — Inteligência Artificial](EPIC-012-ia.md)                 | Inteligência Artificial                    | v2.0 → Enterprise |
| [EPIC-013 — Ecossistema](EPIC-013-ecossistema.md)                    | Ecossistema                                | v3.0 → Enterprise |

Módulos transversais (Arquivos, Auditoria, Lixeira) não viram épica própria — são pré-requisito técnico de praticamente toda épica acima, tratados na próxima missão técnica, não como item de backlog isolado.

## Convenção de status (a partir do refinamento futuro)

`Não iniciado` → `Refinado` (com user story/critério de aceite) → `Em desenvolvimento` → `Concluído` — todas as épicas nascem `Não iniciado`.
