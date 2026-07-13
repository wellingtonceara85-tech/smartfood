-- CreateTable
CREATE TABLE "eventos_publicados" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "versaoSchema" INTEGER NOT NULL DEFAULT 1,
    "agregadoOrigem" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusEntrega" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_publicados_pkey" PRIMARY KEY ("id")
);
