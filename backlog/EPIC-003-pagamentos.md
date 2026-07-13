# EPIC-003 — Pagamentos

**Domínio:** Pagamentos (Missão 0002, Seção 2.3) · **Agregado relacionado:** Pagamento — separado de Pedido por design (Missão 0004, Seção 4)
**Status:** Não iniciado

## Objetivo

Processar cobrança do pedido e tudo que depende disso — tentativa, status, estorno.

## Escopo (módulos já mapeados)

| Item                                             | Fase       |
| ------------------------------------------------ | ---------- |
| Processamento de Pagamento (Pix/cartão/dinheiro) | MVP        |
| Status e Tentativas de Cobrança                  | MVP        |
| Estornos e Reembolsos                            | v2.0       |
| Carteiras Digitais                               | v2.0       |
| Split de Pagamento                               | Enterprise |

## Fora do escopo desta épica

- Fechamento de caixa, DRE, fluxo de caixa → EPIC-009 (Financeiro)

## Referências

[Missão 0002, Seção 2.3](../docs/product/missao-0002-arquitetura-funcional.md) · [Missão 0004, Invariante "Pagamento pertence a um único Pedido"](../docs/product/missao-0004-modelagem-dominio.md)
