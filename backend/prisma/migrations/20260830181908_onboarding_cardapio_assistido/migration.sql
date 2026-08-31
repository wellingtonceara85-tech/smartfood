-- CreateEnum
CREATE TYPE "StatusOnboarding" AS ENUM ('nao_iniciado', 'em_andamento', 'concluido');

-- CreateEnum
CREATE TYPE "OrigemRascunho" AS ENUM ('planilha', 'colar_texto');

-- CreateEnum
CREATE TYPE "StatusRascunho" AS ENUM ('rascunho', 'publicado', 'descartado');

-- CreateEnum
CREATE TYPE "OrigemSolicitacaoCardapio" AS ENUM ('pdf', 'imagem');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoCardapio" AS ENUM ('recebido', 'em_revisao', 'aguardando_lojista', 'aprovado', 'concluido');

-- CreateEnum
CREATE TYPE "CategoriaSugestao" AS ENUM ('cardapio', 'pedidos', 'financeiro', 'entregas', 'relatorios', 'outro');

-- CreateEnum
CREATE TYPE "StatusSugestao" AS ENUM ('nova', 'em_analise', 'planejada', 'implementada', 'nao_planejada');

-- CreateTable
CREATE TABLE "onboarding_lojas" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "status" "StatusOnboarding" NOT NULL DEFAULT 'nao_iniciado',
    "segmento_negocio" TEXT,
    "etapa_atual" TEXT,
    "etapas_concluidas" JSONB,
    "metodo_cardapio" TEXT,
    "iniciado_em" TIMESTAMP(3),
    "concluido_em" TIMESTAMP(3),
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rascunhos_cardapio" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "origem" "OrigemRascunho" NOT NULL,
    "status" "StatusRascunho" NOT NULL DEFAULT 'rascunho',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicado_em" TIMESTAMP(3),

    CONSTRAINT "rascunhos_cardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rascunho_categorias" (
    "id" TEXT NOT NULL,
    "rascunho_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rascunho_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rascunho_produtos" (
    "id" TEXT NOT NULL,
    "rascunho_id" TEXT NOT NULL,
    "rascunho_categoria_id" TEXT,
    "nome" TEXT,
    "descricao" TEXT,
    "preco_texto" TEXT,
    "preco" DECIMAL(10,2),
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "foto_url" TEXT,
    "precisa_revisao" BOOLEAN NOT NULL DEFAULT false,
    "motivos_revisao" JSONB,
    "possivel_duplicado" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "produto_real_id" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rascunho_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_cardapio_assistido" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "origem" "OrigemSolicitacaoCardapio" NOT NULL,
    "arquivo_storage_key" TEXT NOT NULL,
    "nome_arquivo_original" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "status" "StatusSolicitacaoCardapio" NOT NULL DEFAULT 'recebido',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_cardapio_assistido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sugestoes_lojistas" (
    "id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "categoria" "CategoriaSugestao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "StatusSugestao" NOT NULL DEFAULT 'nova',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sugestoes_lojistas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_lojas_loja_id_key" ON "onboarding_lojas"("loja_id");

-- AddForeignKey
ALTER TABLE "onboarding_lojas" ADD CONSTRAINT "onboarding_lojas_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunhos_cardapio" ADD CONSTRAINT "rascunhos_cardapio_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunho_categorias" ADD CONSTRAINT "rascunho_categorias_rascunho_id_fkey" FOREIGN KEY ("rascunho_id") REFERENCES "rascunhos_cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunho_produtos" ADD CONSTRAINT "rascunho_produtos_rascunho_id_fkey" FOREIGN KEY ("rascunho_id") REFERENCES "rascunhos_cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rascunho_produtos" ADD CONSTRAINT "rascunho_produtos_rascunho_categoria_id_fkey" FOREIGN KEY ("rascunho_categoria_id") REFERENCES "rascunho_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_cardapio_assistido" ADD CONSTRAINT "solicitacoes_cardapio_assistido_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sugestoes_lojistas" ADD CONSTRAINT "sugestoes_lojistas_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
