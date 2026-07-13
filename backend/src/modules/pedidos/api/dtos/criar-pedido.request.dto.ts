import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CanalVenda } from '../../domain/canal-venda';

export class EnderecoEntregaRequestDto {
  @IsString()
  @IsNotEmpty()
  rua!: string;

  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsString()
  @IsNotEmpty()
  bairro!: string;

  @IsString()
  @IsNotEmpty()
  cidade!: string;

  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsOptional()
  @IsString()
  complemento?: string;
}

export class ItemPedidoRequestDto {
  @IsString()
  @IsNotEmpty()
  produtoId!: string;

  @IsString()
  @IsNotEmpty()
  variacaoId!: string;

  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class CriarPedidoRequestDto {
  @IsIn(Object.values(CanalVenda))
  canalVenda!: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoEntregaRequestDto)
  enderecoEntrega?: EnderecoEntregaRequestDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoRequestDto)
  itens!: ItemPedidoRequestDto[];
}
