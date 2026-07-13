import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PAPEIS_INTERNOS } from '../../domain/papel';

export class CriarUsuarioRequestDto {
  @IsString()
  @IsNotEmpty()
  empresaId!: string;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  senha!: string;

  @IsOptional()
  @IsIn(PAPEIS_INTERNOS as string[])
  papel?: string;
}
