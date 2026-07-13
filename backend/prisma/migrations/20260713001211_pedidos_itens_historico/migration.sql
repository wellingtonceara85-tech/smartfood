-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "vendas_operacao";

-- CreateEnum
CREATE TYPE "vendas_operacao"."StatusPedido" AS ENUM ('CRIADO', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_RECUSADO', 'RECEBIDO', 'EM_PREPARO', 'PRONTO_SAIU_PARA_ENTREGA', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "vendas_operacao"."CanalVenda" AS ENUM ('SITE', 'QR_CODE', 'MESA', 'BALCAO', 'AUTOATENDIMENTO', 'MARKETPLACE', 'API');

-- CreateTable
CREATE TABLE "vendas_operacao"."pedidos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "criadoPorUsuarioId" TEXT NOT NULL,
    "canalVenda" "vendas_operacao"."CanalVenda" NOT NULL,
    "status" "vendas_operacao"."StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "enderecoRua" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCidade" TEXT,
    "enderecoCep" TEXT,
    "enderecoComplemento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_operacao"."itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "variacaoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "nomeVariacao" TEXT NOT NULL,
    "descricaoProduto" TEXT,
    "codigoInternoVariacao" TEXT,
    "precoValor" DECIMAL(10,2) NOT NULL,
    "precoMoeda" TEXT NOT NULL DEFAULT 'BRL',
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_operacao"."historico_status_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "status" "vendas_operacao"."StatusPedido" NOT NULL,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_pedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendas_operacao"."itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "vendas_operacao"."pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_operacao"."historico_status_pedido" ADD CONSTRAINT "historico_status_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "vendas_operacao"."pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
