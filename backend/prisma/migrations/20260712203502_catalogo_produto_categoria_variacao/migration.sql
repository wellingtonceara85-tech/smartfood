-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalogo";

-- CreateTable
CREATE TABLE "catalogo"."categorias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo"."produtos" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "controlaEstoque" BOOLEAN NOT NULL DEFAULT false,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo"."variacoes_produto" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "precoValor" DECIMAL(10,2) NOT NULL,
    "precoMoeda" TEXT NOT NULL DEFAULT 'BRL',
    "disponivel" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "variacoes_produto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catalogo"."produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "catalogo"."categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogo"."variacoes_produto" ADD CONSTRAINT "variacoes_produto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "catalogo"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
