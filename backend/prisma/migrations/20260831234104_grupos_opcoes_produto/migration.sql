-- CreateTable
CREATE TABLE "grupos_opcoes" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "min_escolhas" INTEGER NOT NULL DEFAULT 0,
    "max_escolhas" INTEGER NOT NULL DEFAULT 1,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_opcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_grupo" (
    "id" TEXT NOT NULL,
    "grupo_opcoes_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco_adicional" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opcoes_grupo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "grupos_opcoes" ADD CONSTRAINT "grupos_opcoes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_grupo" ADD CONSTRAINT "opcoes_grupo_grupo_opcoes_id_fkey" FOREIGN KEY ("grupo_opcoes_id") REFERENCES "grupos_opcoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
