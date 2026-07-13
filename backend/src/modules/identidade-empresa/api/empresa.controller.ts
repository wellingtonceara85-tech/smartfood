import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsuarioTokenClaims } from '../../../platform/auth/auth-token.service';
import { JwtAuthGuard } from '../../../platform/auth/jwt-auth.guard';
import { verificarMesmaEmpresa } from '../../../platform/auth/verificar-mesma-empresa';
import { BuscarEmpresaPorIdUseCase } from '../application/use-cases/buscar-empresa-por-id.use-case';
import { CriarEmpresaUseCase } from '../application/use-cases/criar-empresa.use-case';
import { CriarEmpresaRequestDto } from './dtos/criar-empresa.request.dto';
import { CriarEmpresaResponseDto } from './dtos/criar-empresa.response.dto';
import { EmpresaResponseDto } from './dtos/empresa.response.dto';

/**
 * `POST /empresas` continua público (Missão 0009) — é o onboarding, não existe Usuário
 * antes dele. `GET /empresas/:id` passa a exigir autenticação a partir da Missão 0010.
 */
@ApiTags('empresas')
@Controller('empresas')
export class EmpresaController {
  constructor(
    private readonly criarEmpresaUseCase: CriarEmpresaUseCase,
    private readonly buscarEmpresaPorIdUseCase: BuscarEmpresaPorIdUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dto: CriarEmpresaRequestDto): Promise<CriarEmpresaResponseDto> {
    return this.criarEmpresaUseCase.execute(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async buscarPorId(@Param('id') id: string, @Req() request: Request): Promise<EmpresaResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    verificarMesmaEmpresa(usuario.empresaId, id);

    const empresa = await this.buscarEmpresaPorIdUseCase.execute(id);
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada.');
    }
    return empresa;
  }
}
