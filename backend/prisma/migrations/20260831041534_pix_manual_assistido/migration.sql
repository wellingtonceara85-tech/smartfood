-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "pix_cidade" TEXT,
ADD COLUMN     "pix_tipo_chave" TEXT,
ADD COLUMN     "pix_titular" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "pagamento_confirmado_em" TIMESTAMP(3),
ADD COLUMN     "pagamento_informado_em" TIMESTAMP(3),
ADD COLUMN     "status_pagamento" TEXT;
