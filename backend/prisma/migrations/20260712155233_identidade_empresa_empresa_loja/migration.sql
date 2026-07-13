-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identidade_empresa";

-- CreateTable
CREATE TABLE "identidade_empresa"."empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "categoriaNegocio" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "chavePix" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidade_empresa"."lojas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpjCpf_key" ON "identidade_empresa"."empresas"("cnpjCpf");

-- AddForeignKey
ALTER TABLE "identidade_empresa"."lojas" ADD CONSTRAINT "lojas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "identidade_empresa"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
