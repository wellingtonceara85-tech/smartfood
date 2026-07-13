import { ForbiddenException } from '@nestjs/common';

/**
 * Aplica a Missão 0004, Invariante 6: "um Papel só concede permissão dentro da Empresa à qual
 * pertence — nunca há vazamento de permissão entre Empresas". Chamado explicitamente por todo
 * Controller/Caso de Uso que expõe um recurso pertencente a uma Empresa.
 */
export function verificarMesmaEmpresa(usuarioEmpresaId: string, recursoEmpresaId: string): void {
  if (usuarioEmpresaId !== recursoEmpresaId) {
    throw new ForbiddenException('Papel não concede acesso a recursos de outra Empresa.');
  }
}
