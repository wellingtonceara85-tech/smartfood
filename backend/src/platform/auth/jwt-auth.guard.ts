import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige Access Token válido (fluxo de Usuário, ADR-0024). Popula `request.user` com os claims. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
