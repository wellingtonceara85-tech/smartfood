import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ExtratorUsuarioOpcional } from '../../../platform/auth/extrator-usuario-opcional';
import { CriarUsuarioUseCase } from '../application/use-cases/criar-usuario.use-case';
import { CriarUsuarioRequestDto } from './dtos/criar-usuario.request.dto';
import { CriarUsuarioResponseDto } from './dtos/criar-usuario.response.dto';

/**
 * Sem Guard fixo aqui de propósito (Missão 0010, Seção 3): o bootstrap do primeiro Usuário de
 * uma Empresa precisa funcionar sem token. O Caso de Uso decide, olhando se já existe Usuário
 * na Empresa, se a chamada precisava ou não vir autenticada — ExtratorUsuarioOpcional só lê o
 * token se houver, sem exigir.
 */
@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly criarUsuarioUseCase: CriarUsuarioUseCase,
    private readonly extratorUsuarioOpcional: ExtratorUsuarioOpcional,
  ) {}

  @Post()
  async criar(
    @Body() dto: CriarUsuarioRequestDto,
    @Req() request: Request,
  ): Promise<CriarUsuarioResponseDto> {
    const chamador = this.extratorUsuarioOpcional.extrair(request);

    return this.criarUsuarioUseCase.execute({
      empresaId: dto.empresaId,
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      papel: dto.papel,
      chamador,
    });
  }
}
