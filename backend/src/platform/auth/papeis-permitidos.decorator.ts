import { SetMetadata } from '@nestjs/common';

export const PAPEIS_PERMITIDOS_KEY = 'papeisPermitidos';

/** Declara quais Papéis podem acessar a rota — usado junto com PapelPermissaoGuard. */
export const PapeisPermitidos = (...papeis: string[]) => SetMetadata(PAPEIS_PERMITIDOS_KEY, papeis);
