// SmartFood — seed dos Papéis internos (Missão 0010). Mantém sincronizado com
// backend/src/modules/usuarios/domain/papel.ts (PapelNome) — lista pequena e estável,
// duplicada aqui em JS puro (sem ts-node) para funcionar também na imagem de produção,
// que não carrega devDependencies.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PAPEIS_INTERNOS = ['Administrador', 'Gerente', 'Supervisor', 'Operador', 'Financeiro'];

async function main() {
  for (const nome of PAPEIS_INTERNOS) {
    await prisma.papel.upsert({ where: { nome }, update: {}, create: { nome } });
  }
  console.log(`Seed concluído: ${PAPEIS_INTERNOS.length} papéis internos.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
