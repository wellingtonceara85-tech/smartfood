# Review Notes — Missão 0012 (Pedidos)

**Rodada:** 1 (única — aprovado com refinamentos)
**Data:** 2026-07-12
**Revisor:** Wellington (CTO/PO), dentro da conversa

## Veredito

Aprovado. Wellington classificou este como "o Draft mais maduro até agora" — a maior parte do conteúdo já vinha diretamente de decisões congeladas (Missão 0004/0006, ADR-0003), com pouco espaço de invenção. Nove refinamentos pontuais, nenhum deles reabrindo decisão arquitetural.

## O que mudou e por quê

1. **Pedido sem Cliente reenquadrado como característica do domínio, não limitação temporária.** Motivo: qualquer PDV real tem Pedidos sem cliente cadastrado (balcão, mesa, consumo interno, telefone) — `clienteId` opcional continuará opcional mesmo depois que o Bounded Context Clientes existir, não é um "provisório até Clientes nascer".
2. **Snapshot do Item do Pedido ganha `codigoInterno` (SKU) da Variação.** Motivo: facilita auditoria futura. Consequência: pequena adição aditiva a `catalogo.variacoes_produto` (Missão 0011) — mesmo padrão de placeholder de baixo custo já usado para `imagemUrl`/`controlaEstoque`.
3. **`canalVenda` aceita o enum inteiro desde já**, não só `MESA`/`BALCAO`. Motivo: é só validação de valor, sem custo — evita migration quando Totem/QR Code existirem de verdade.
4. **Invariante explícita de estado terminal**: `Concluído`/`Cancelado` nunca transitam para nenhum outro estado, nem entre si — `CancelarPedido` rejeita explicitamente os dois, não só implicitamente.
5. **Histórico de status nasce junto com o Pedido** (linha `Aguardando Pagamento` na própria criação) — nenhum Pedido existe sem histórico, não só a partir da primeira mudança.
6. **Outbox confirmado sem alteração** — só `PEDIDO_CRIADO`/`PEDIDO_CANCELADO`, elogiado explicitamente por não ter inventado `PEDIDO_CONFIRMADO`.
7. **`CriarPedido` também valida disponibilidade** (Produto e Variação) no Catálogo, não só existência/pertencimento à Empresa — item tornado **obrigatório** na DoD pela revisão.
8. **Preço confirmado como snapshot, nunca recalculado** — sem alteração.
9. **Novo Use Case exportado pelo Catálogo**: `BuscarProdutoParaPedidoUseCase`, devolvendo um DTO estreito (nome, descrição, SKU, preço, disponibilidade) em vez de Pedidos reaproveitar `BuscarProdutoPorIdUseCase` (representação interna completa de Produto). Sugestão marcada como não-obrigatória pelo revisor, mas adotada por ter custo baixo e reduzir acoplamento entre os dois Bounded Contexts.

## O que NÃO mudou (confirmado como já correto no Draft)

- Só Usuário interno cria Pedido nesta missão — fluxo de Cliente via Vitrine permanece adiado.
- Máquina de estados idêntica à Missão 0004, Seção 7 — só duas transições ganham código (`Criado→Aguardando Pagamento`, `qualquer→Cancelado`).
- Pedido escopado por Empresa (não Loja) — Missão 0006, Seção 5.
- Estrutura de módulo, RBAC (Administrador/Gerente escrevem), contrato de API.
- Todas as exclusões de escopo da Seção 4 (Pagamento, Cozinha, Entrega, Cupom, Comanda, edição).

## Próximo passo

Documento consolidado e marcado como **CONGELADA — versão oficial**. Implementação segue direto em incrementos pequenos e validados, mesmo modelo das Missões 0009/0010/0011.
