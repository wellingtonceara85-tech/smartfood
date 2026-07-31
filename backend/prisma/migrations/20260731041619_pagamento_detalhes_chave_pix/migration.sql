-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "chave_pix" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "precisa_troco" BOOLEAN,
ADD COLUMN     "tipo_cartao" TEXT,
ADD COLUMN     "troco_para" DECIMAL(10,2);
