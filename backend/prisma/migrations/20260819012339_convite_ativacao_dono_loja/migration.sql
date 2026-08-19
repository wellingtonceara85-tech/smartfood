-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "senha_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "convites_ativacao" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "revogado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_ativacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convites_ativacao_token_hash_key" ON "convites_ativacao"("token_hash");

-- AddForeignKey
ALTER TABLE "convites_ativacao" ADD CONSTRAINT "convites_ativacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
