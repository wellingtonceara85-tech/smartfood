import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsuarioTokenClaims } from '../../../platform/auth/auth-token.service';
import { JwtAuthGuard } from '../../../platform/auth/jwt-auth.guard';
import { PapeisPermitidos } from '../../../platform/auth/papeis-permitidos.decorator';
import { PapelPermissaoGuard } from '../../../platform/auth/papel-permissao.guard';
import { CriarCategoriaUseCase } from '../application/use-cases/criar-categoria.use-case';
import { ListarCategoriasUseCase } from '../application/use-cases/listar-categorias.use-case';
import { CategoriaResponseDto } from './dtos/categoria.response.dto';
import { CriarCategoriaRequestDto } from './dtos/criar-categoria.request.dto';
import { CriarCategoriaResponseDto } from './dtos/criar-categoria.response.dto';

/**
 * Escrita exige Administrador ou Gerente; leitura exige só autenticação (Missão 0011, Seção 5).
 */
@ApiTags('categorias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PapelPermissaoGuard)
@Controller('categorias')
export class CategoriaController {
  constructor(
    private readonly criarCategoriaUseCase: CriarCategoriaUseCase,
    private readonly listarCategoriasUseCase: ListarCategoriasUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PapeisPermitidos('Administrador', 'Gerente')
  async criar(
    @Body() dto: CriarCategoriaRequestDto,
    @Req() request: Request,
  ): Promise<CriarCategoriaResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.criarCategoriaUseCase.execute({ empresaId: usuario.empresaId, ...dto });
  }

  @Get()
  async listar(@Req() request: Request): Promise<CategoriaResponseDto[]> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.listarCategoriasUseCase.execute(usuario.empresaId);
  }
}
