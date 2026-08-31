import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Roda uma única vez, depois da migration que criou OnboardingLoja — marca
 * como 'concluido' toda loja que já existia antes desta feature, pra nenhuma
 * loja em operação ser jogada de volta pro wizard de implantação guiada.
 * Idempotente: só cria a linha pra quem ainda não tem (upsert por lojaId).
 */
async function main() {
  const lojas = await prisma.loja.findMany({ select: { id: true, criadoEm: true } });

  let criadas = 0;
  for (const loja of lojas) {
    const resultado = await prisma.onboardingLoja.upsert({
      where: { lojaId: loja.id },
      update: {},
      create: {
        lojaId: loja.id,
        status: 'concluido',
        iniciadoEm: loja.criadoEm,
        concluidoEm: loja.criadoEm,
      },
    });
    if (resultado.concluidoEm?.getTime() === loja.criadoEm.getTime()) criadas += 1;
  }

  console.log(`Backfill concluído. ${criadas} loja(s) verificada(s)/marcada(s) como onboarding concluído.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
