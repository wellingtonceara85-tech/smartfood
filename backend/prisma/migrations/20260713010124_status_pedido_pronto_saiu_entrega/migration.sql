-- ADR-0025: PRONTO e SAIU_PARA_ENTREGA são estados distintos (correção de ambiguidade de
-- notação entre Missão 0004 e Missão 0002, não mudança de regra de negócio). Sem dado real
-- em produção usando o valor antigo (verificado antes desta migration).

-- CreateEnum (novo, com os dois valores desmembrados)
CREATE TYPE "vendas_operacao"."StatusPedido_new" AS ENUM ('CRIADO', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_RECUSADO', 'RECEBIDO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO');

-- Migra as colunas para o novo tipo
ALTER TABLE "vendas_operacao"."pedidos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vendas_operacao"."pedidos" ALTER COLUMN "status" TYPE "vendas_operacao"."StatusPedido_new" USING ("status"::text::"vendas_operacao"."StatusPedido_new");
ALTER TABLE "vendas_operacao"."historico_status_pedido" ALTER COLUMN "status" TYPE "vendas_operacao"."StatusPedido_new" USING ("status"::text::"vendas_operacao"."StatusPedido_new");

-- Substitui o tipo antigo pelo novo
DROP TYPE "vendas_operacao"."StatusPedido";
ALTER TYPE "vendas_operacao"."StatusPedido_new" RENAME TO "StatusPedido";

-- Restaura o default
ALTER TABLE "vendas_operacao"."pedidos" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO_PAGAMENTO';
