import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsuarioTokenClaims } from '../../../platform/auth/auth-token.service';
import { JwtAuthGuard } from '../../../platform/auth/jwt-auth.guard';
import { PapeisPermitidos } from '../../../platform/auth/papeis-permitidos.decorator';
import { PapelPermissaoGuard } from '../../../platform/auth/papel-permissao.guard';
import { AlternarDisponibilidadeProdutoUseCase } from '../application/use-cases/alternar-disponibilidade-produto.use-case';
import { AlternarDisponibilidadeVariacaoUseCase } from '../application/use-cases/alternar-disponibilidade-variacao.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/use-cases/buscar-produto-por-id.use-case';
import { CriarProdutoUseCase } from '../application/use-cases/criar-produto.use-case';
import { ListarProdutosUseCase } from '../application/use-cases/listar-produtos.use-case';
import { CriarProdutoRequestDto } from './dtos/criar-produto.request.dto';
import { CriarProdutoResponseDto } from './dtos/criar-produto.response.dto';
import { ProdutoResponseDto } from './dtos/produto.response.dto';

/**
 * Escrita exige Administrador ou Gerente; leitura exige só autenticação (Missão 0011, Seção 5).
 * `lojaId` nunca vem do cliente — sempre resolvido do chamador autenticado nos Casos de Uso.
 */
@ApiTags('produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PapelPermissaoGuard)
@Controller('produtos')
export class ProdutoController {
  constructor(
    private readonly criarProdutoUseCase: CriarProdutoUseCase,
    private readonly buscarProdutoPorIdUseCase: BuscarProdutoPorIdUseCase,
    private readonly listarProdutosUseCase: ListarProdutosUseCase,
    private readonly alternarDisponibilidadeProdutoUseCase: AlternarDisponibilidadeProdutoUseCase,
    private readonly alternarDisponibilidadeVariacaoUseCase: AlternarDisponibilidadeVariacaoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PapeisPermitidos('Administrador', 'Gerente')
  async criar(
    @Body() dto: CriarProdutoRequestDto,
    @Req() request: Request,
  ): Promise<CriarProdutoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.criarProdutoUseCase.execute({ empresaId: usuario.empresaId, ...dto });
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string, @Req() request: Request): Promise<ProdutoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    const produto = await this.buscarProdutoPorIdUseCase.execute(id, usuario.empresaId);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
    return produto;
  }

  @Get()
  async listar(@Req() request: Request): Promise<ProdutoResponseDto[]> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.listarProdutosUseCase.execute(usuario.empresaId);
  }

  @Patch(':id/disponibilidade')
  @PapeisPermitidos('Administrador', 'Gerente')
  async alternarDisponibilidade(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ProdutoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.alternarDisponibilidadeProdutoUseCase.execute(id, usuario.empresaId);
  }

  @Patch(':id/variacoes/:variacaoId/disponibilidade')
  @PapeisPermitidos('Administrador', 'Gerente')
  async alternarDisponibilidadeVariacao(
    @Param('id') id: string,
    @Param('variacaoId') variacaoId: string,
    @Req() request: Request,
  ): Promise<ProdutoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.alternarDisponibilidadeVariacaoUseCase.execute(id, variacaoId, usuario.empresaId);
  }
}
