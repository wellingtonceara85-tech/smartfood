import { IsNotEmpty, IsString } from 'class-validator';

export class CriarEmpresaRequestDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  cnpjCpf!: string;

  @IsString()
  @IsNotEmpty()
  categoriaNegocio!: string;

  @IsString()
  @IsNotEmpty()
  telefone!: string;
}
