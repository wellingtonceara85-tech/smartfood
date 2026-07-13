export class EmpresaResponseDto {
  id!: string;
  nome!: string;
  cnpjCpf!: string;
  categoriaNegocio!: string;
  telefone!: string;
  chavePix!: string | null;
  criadaEm!: Date;
}
