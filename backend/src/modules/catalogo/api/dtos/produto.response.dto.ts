export class VariacaoResponseDto {
  id!: string;
  nome!: string;
  precoValor!: number;
  precoMoeda!: string;
  disponivel!: boolean;
}

export class ProdutoResponseDto {
  id!: string;
  lojaId!: string;
  categoriaId!: string;
  nome!: string;
  descricao!: string | null;
  imagemUrl!: string | null;
  controlaEstoque!: boolean;
  disponivel!: boolean;
  criadoEm!: Date;
  variacoes!: VariacaoResponseDto[];
}
