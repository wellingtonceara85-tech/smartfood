# EPIC-002 — Pedidos

**Domínio:** Comercial + Operacional (Missão 0002, Seções 2.1/2.2) · **Agregado relacionado:** Pedido — o mais crítico do sistema (Missão 0004, Seção 8)
**Status:** Não iniciado

## Objetivo

Unificar carrinho, checkout, motor de pedidos e painel operacional em um único fluxo, independente do canal (site, QR Code de mesa, balcão).

## Escopo (módulos já mapeados)

| Item                                    | Fase |
| --------------------------------------- | ---- |
| Carrinho e Checkout                     | MVP  |
| Motor de Pedidos (unificação de canais) | MVP  |
| Painel de Pedidos (tempo real)          | MVP  |
| QR Code de Mesa                         | MVP  |
| Disponibilidade e Estoque Simples       | MVP  |
| Comandas                                | v2.0 |
| Assinatura/Recorrência de Produto       | v2.0 |
| Gestão de Entregadores                  | v2.0 |

## Atenção especial

Pedido é o agregado de maior acoplamento do domínio (Missão 0004, Seção 8) — qualquer refinamento técnico desta épica deve considerar isso desde o desenho inicial, não como otimização posterior.

## Referências

[Missão 0002, Seções 2.1/2.2](../docs/product/missao-0002-arquitetura-funcional.md) · [Missão 0004, Seções 4/7/8](../docs/product/missao-0004-modelagem-dominio.md) · [Missão 0003, Experiência de Pedidos](../docs/product/missao-0003-ux-jornadas.md)
