-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "bairro_entrega_id" TEXT,
ADD COLUMN     "bairro_entrega_nome" TEXT,
ADD COLUMN     "forma_recebimento" TEXT NOT NULL DEFAULT 'retirada',
ADD COLUMN     "valor_entrega" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "bairros_entrega" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "nome_bairro" TEXT NOT NULL,
    "valor_entrega" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bairros_entrega_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bairros_entrega" ADD CONSTRAINT "bairros_entrega_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
