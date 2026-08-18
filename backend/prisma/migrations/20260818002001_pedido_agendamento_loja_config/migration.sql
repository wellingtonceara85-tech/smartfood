-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "aceita_agendamento" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "antecedencia_minima_minutos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "data_agendamento" TIMESTAMP(3),
ADD COLUMN     "tipo_pedido" TEXT NOT NULL DEFAULT 'imediato';
