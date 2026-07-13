import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { verificarMesmaEmpresa } from './verificar-mesma-empresa';

/**
 * Missão 0004, Invariante 6: "um Papel só concede permissão dentro da Empresa à qual
 * pertence — nunca há vazamento de permissão entre Empresas."
 */
describe('verificarMesmaEmpresa', () => {
  it('não lança quando o Usuário e o recurso pertencem à mesma Empresa', () => {
    expect(() => verificarMesmaEmpresa('empresa-1', 'empresa-1')).not.toThrow();
  });

  it('lança ForbiddenException quando o Usuário tenta acessar recurso de outra Empresa', () => {
    expect(() => verificarMesmaEmpresa('empresa-1', 'empresa-2')).toThrow(ForbiddenException);
  });
});
