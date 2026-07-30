import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const loja = await prisma.loja.upsert({
    where: { slug: 'lanchonete-teste' },
    update: {},
    create: {
      nome: 'Lanchonete Teste',
      slug: 'lanchonete-teste',
      telefoneWhatsapp: '5585999999999',
      tagline: 'O melhor lanche da cidade',
      horarioAbertura: '18:00',
      horarioFechamento: '23:00',
    },
  });

  const senhaHash = await bcrypt.hash('123456', 10);
  await prisma.usuario.upsert({
    where: { email: 'dono@lanchonete-teste.com' },
    update: {},
    create: {
      nome: 'Dono da Lanchonete Teste',
      email: 'dono@lanchonete-teste.com',
      senhaHash,
      papel: 'dono_loja',
      lojaId: loja.id,
    },
  });

  let categoria = await prisma.categoria.findFirst({ where: { lojaId: loja.id, nome: 'Lanches' } });
  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: { lojaId: loja.id, nome: 'Lanches', ordem: 0 },
    });
  }

  const produtoExistente = await prisma.produto.findFirst({ where: { lojaId: loja.id, nome: 'X-Burguer' } });
  if (!produtoExistente) {
    await prisma.produto.create({
      data: {
        lojaId: loja.id,
        categoriaId: categoria.id,
        nome: 'X-Burguer',
        descricao: 'Pão, hambúrguer, queijo, alface e tomate',
        preco: 22.9,
        disponivel: true,
        opcoes: ['Ao ponto', 'Bem passado'],
      },
    });
  }

  console.log('Seed concluído. Login: dono@lanchonete-teste.com / 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
