-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "calcular_entrega_por_distancia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cliente_latitude" DOUBLE PRECISION,
ADD COLUMN     "cliente_longitude" DOUBLE PRECISION,
ADD COLUMN     "entrega_distancia_metros" INTEGER;

-- CreateTable
CREATE TABLE "faixas_entrega_distancia" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "distancia_max_metros" INTEGER NOT NULL,
    "valor_entrega" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faixas_entrega_distancia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "faixas_entrega_distancia" ADD CONSTRAINT "faixas_entrega_distancia_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
