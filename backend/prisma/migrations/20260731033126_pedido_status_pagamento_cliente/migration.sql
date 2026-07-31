-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cliente_nome" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "forma_pagamento" TEXT NOT NULL DEFAULT 'nao_informado',
ADD COLUMN     "numero" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'recebido';
