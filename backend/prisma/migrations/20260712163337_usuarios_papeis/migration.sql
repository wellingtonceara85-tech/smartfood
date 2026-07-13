-- CreateTable
CREATE TABLE "identidade_empresa"."usuarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidade_empresa"."papeis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "papeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidade_empresa"."usuario_papel" (
    "usuarioId" TEXT NOT NULL,
    "papelId" TEXT NOT NULL,

    CONSTRAINT "usuario_papel_pkey" PRIMARY KEY ("usuarioId","papelId")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresaId_email_key" ON "identidade_empresa"."usuarios"("empresaId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "papeis_nome_key" ON "identidade_empresa"."papeis"("nome");

-- AddForeignKey
ALTER TABLE "identidade_empresa"."usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "identidade_empresa"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identidade_empresa"."usuario_papel" ADD CONSTRAINT "usuario_papel_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidade_empresa"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identidade_empresa"."usuario_papel" ADD CONSTRAINT "usuario_papel_papelId_fkey" FOREIGN KEY ("papelId") REFERENCES "identidade_empresa"."papeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
