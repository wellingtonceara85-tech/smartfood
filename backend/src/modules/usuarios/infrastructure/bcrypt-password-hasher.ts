import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PasswordHasher } from '../application/ports/password-hasher.port';

const CUSTO_HASH = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(senha: string): Promise<string> {
    return bcrypt.hash(senha, CUSTO_HASH);
  }

  async comparar(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }
}
