import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Ponto único de acesso ao PrismaClient (Missão 0007.5, Blueprint — infrastructure/ é o único
 * lugar que importa PrismaClient diretamente). Serviço de plataforma, não de um Bounded Context.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
