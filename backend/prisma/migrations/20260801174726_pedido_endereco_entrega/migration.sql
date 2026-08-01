-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "entrega_cep" TEXT,
ADD COLUMN     "entrega_cidade" TEXT,
ADD COLUMN     "entrega_complemento" TEXT,
ADD COLUMN     "entrega_estado" TEXT,
ADD COLUMN     "entrega_logradouro" TEXT,
ADD COLUMN     "entrega_numero" TEXT,
ADD COLUMN     "entrega_referencia" TEXT;
