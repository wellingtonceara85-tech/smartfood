import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrimeiraVariacaoRequestDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsNumber()
  @Min(0)
  precoValor!: number;

  @IsOptional()
  @IsString()
  precoMoeda?: string;
}

export class CriarProdutoRequestDto {
  @IsString()
  @IsNotEmpty()
  categoriaId!: string;

  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @IsOptional()
  @IsBoolean()
  controlaEstoque?: boolean;

  @ValidateNested()
  @Type(() => PrimeiraVariacaoRequestDto)
  primeiraVariacao!: PrimeiraVariacaoRequestDto;
}
