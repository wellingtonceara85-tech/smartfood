import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsuarioTokenClaims } from '../../../platform/auth/auth-token.service';
import { JwtAuthGuard } from '../../../platform/auth/jwt-auth.guard';
import { PapeisPermitidos } from '../../../platform/auth/papeis-permitidos.decorator';
import { PapelPermissaoGuard } from '../../../platform/auth/papel-permissao.guard';
import { AvancarPedidoParaEmPreparoUseCase } from '../../pedidos/application/use-cases/avancar-pedido-para-em-preparo.use-case';
import { AvancarPedidoParaProntoUseCase } from '../../pedidos/application/use-cases/avancar-pedido-para-pronto.use-case';
import { ListarPedidosPorStatusUseCase } from '../../pedidos/application/use-cases/listar-pedidos-por-status.use-case';
import { PedidoCozinhaResponseDto } from './dtos/pedido-cozinha.response.dto';

const PAPEIS_COZINHA = ['Administrador', 'Gerente', 'Supervisor', 'Operador'];

function paraDto(pedido: {
  id: string;
  empresaId: string;
  status: string;
  criadoEm: Date;
  itens: Array<{
    id: string;
    produtoId: string;
    variacaoId: string;
    nomeProduto: string;
    nomeVariacao: string;
    descricaoProduto: string | null;
    codigoInternoVariacao: string | null;
    precoValor: number;
    precoMoeda: string;
    quantidade: number;
  }>;
}): PedidoCozinhaResponseDto {
  return {
    id: pedido.id,
    empresaId: pedido.empresaId,
    status: pedido.status,
    criadoEm: pedido.criadoEm,
    itens: pedido.itens,
  };
}

/**
 * Módulo façade (Missão 0013) — sem Agregado próprio, sem repositório. Só orquestra os Use
 * Cases exportados por `PedidosModule` (ADR-0022). Cozinha é especialização do papel Operador
 * (Missão 0002, Seção 14), não um papel novo — primeira permissão de escrita do Operador.
 */
@ApiTags('cozinha')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PapelPermissaoGuard)
@Controller('cozinha/pedidos')
export class CozinhaController {
  constructor(
    private readonly listarPedidosPorStatus: ListarPedidosPorStatusUseCase,
    private readonly avancarParaEmPreparo: AvancarPedidoParaEmPreparoUseCase,
    private readonly avancarParaPronto: AvancarPedidoParaProntoUseCase,
  ) {}

  @Get()
  @PapeisPermitidos(...PAPEIS_COZINHA)
  async listarFila(@Req() request: Request): Promise<PedidoCozinhaResponseDto[]> {
    const usuario = request.user as UsuarioTokenClaims;
    const pedidos = await this.listarPedidosPorStatus.execute(usuario.empresaId, [
      'RECEBIDO',
      'EM_PREPARO',
    ]);
    return pedidos.map(paraDto);
  }

  @Post(':id/iniciar')
  @HttpCode(HttpStatus.OK)
  @PapeisPermitidos(...PAPEIS_COZINHA)
  async iniciar(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<PedidoCozinhaResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    const pedido = await this.avancarParaEmPreparo.execute(id, usuario.empresaId);
    return paraDto(pedido);
  }

  @Post(':id/finalizar')
  @HttpCode(HttpStatus.OK)
  @PapeisPermitidos(...PAPEIS_COZINHA)
  async finalizar(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<PedidoCozinhaResponseDto> {
    const usuario = request.user as UsuarioTokenClaims;
    const pedido = await this.avancarParaPronto.execute(id, usuario.empresaId);
    return paraDto(pedido);
  }
}
