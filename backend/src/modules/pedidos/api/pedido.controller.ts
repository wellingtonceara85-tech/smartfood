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
import { PapeisPermitidos } from '../../../platform/auth/papeis-permitidos.decorator';
import { PapelPermissaoGuard } from '../../../platform/auth/papel-permissao.guard';
import { BuscarPedidoPorIdUseCase } from '../application/use-cases/buscar-pedido-por-id.use-case';
import { CancelarPedidoUseCase } from '../application/use-cases/cancelar-pedido.use-case';
import { CriarPedidoUseCase } from '../application/use-cases/criar-pedido.use-case';
import { ListarPedidosUseCase } from '../application/use-cases/listar-pedidos.use-case';
import { CriarPedidoRequestDto } from './dtos/criar-pedido.request.dto';
import { CriarPedidoResponseDto } from './dtos/criar-pedido.response.dto';
import { PedidoResponseDto } from './dtos/pedido.response.dto';

/**
 * Escrita exige Administrador ou Gerente; leitura exige só autenticação (Missão 0012, Seção 6,
 * mesma matriz da Missão 0011). Só Usuário interno cria Pedido nesta missão (Missão 0012, Seção 2).
 */
@ApiTags('pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PapelPermissaoGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(
    private readonly criarPedidoUseCase: CriarPedidoUseCase,
    private readonly buscarPedidoPorIdUseCase: BuscarPedidoPorIdUseCase,
    private readonly listarPedidosUseCase: ListarPedidosUseCase,
    private readonly cancelarPedidoUseCase: CancelarPedidoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PapeisPermitidos('Administrador', 'Gerente')
  async criar(
    @Body() dto: CriarPedidoRequestDto,
    @Req() request: Request,
  ): Promise<CriarPedidoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.criarPedidoUseCase.execute({
      empresaId: usuario.empresaId,
      criadoPorUsuarioId: usuario.usuarioId,
      canalVenda: dto.canalVenda,
      clienteId: dto.clienteId,
      enderecoEntrega: dto.enderecoEntrega,
      itens: dto.itens,
    });
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string, @Req() request: Request): Promise<PedidoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    const pedido = await this.buscarPedidoPorIdUseCase.execute(id, usuario.empresaId);
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    return pedido;
  }

  @Get()
  async listar(@Req() request: Request): Promise<PedidoResponseDto[]> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.listarPedidosUseCase.execute(usuario.empresaId);
  }

  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @PapeisPermitidos('Administrador', 'Gerente')
  async cancelar(@Param('id') id: string, @Req() request: Request): Promise<PedidoResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    return this.cancelarPedidoUseCase.execute(id, usuario.empresaId);
  }
}
