-- CreateEnum
CREATE TYPE "StatusLoja" AS ENUM ('ativa', 'suspensa');

-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "status" "StatusLoja" NOT NULL DEFAULT 'ativa',
ADD COLUMN     "suspensa_em" TIMESTAMP(3),
ADD COLUMN     "trial_fim_em" TIMESTAMP(3),
ADD COLUMN     "trial_inicio_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ativado_em" TIMESTAMP(3),
ADD COLUMN     "ultimo_login_em" TIMESTAMP(3);
