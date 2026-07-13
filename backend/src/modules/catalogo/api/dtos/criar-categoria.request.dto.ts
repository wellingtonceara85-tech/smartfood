import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CriarCategoriaRequestDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
