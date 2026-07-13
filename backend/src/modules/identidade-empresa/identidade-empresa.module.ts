import { Module } from '@nestjs/common';
import { EmpresaController } from './api/empresa.controller';
import { BuscarEmpresaPorIdUseCase } from './application/use-cases/buscar-empresa-por-id.use-case';
import { BuscarLojaPorEmpresaUseCase } from './application/use-cases/buscar-loja-por-empresa.use-case';
import { CriarEmpresaUseCase } from './application/use-cases/criar-empresa.use-case';
import { EMPRESA_REPOSITORY } from './domain/empresa.repository';
import { LOJA_REPOSITORY } from './domain/loja.repository';
import { PrismaEmpresaRepository } from './infrastructure/prisma-empresa.repository';
import { PrismaLojaRepository } from './infrastructure/prisma-loja.repository';

/**
 * Bounded Context Identidade & Empresa (Missão 0009). Exporta só a Application Service
 * Interface (os Casos de Uso) — nunca o repositório, nunca uma Entidade de Domínio (ADR-0022).
 * `BuscarLojaPorEmpresaUseCase` (Missão 0011) existe para outros módulos resolverem a Loja do
 * chamador sem confiar em `lojaId` vindo do cliente.
 */
@Module({
  controllers: [EmpresaController],
  providers: [
    CriarEmpresaUseCase,
    BuscarEmpresaPorIdUseCase,
    BuscarLojaPorEmpresaUseCase,
    { provide: EMPRESA_REPOSITORY, useClass: PrismaEmpresaRepository },
    { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
  ],
  exports: [CriarEmpresaUseCase, BuscarEmpresaPorIdUseCase, BuscarLojaPorEmpresaUseCase],
})
export class IdentidadeEmpresaModule {}
