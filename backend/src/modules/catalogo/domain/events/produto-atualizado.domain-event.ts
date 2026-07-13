/**
 * Evento de domínio disparado na criação de um Produto e na troca de disponibilidade
 * (Missão 0004, Seção 6). Publicação real (Outbox, ADR-0023) fica a cargo do repositório.
 */
export class ProdutoAtualizadoEvent {
  static readonly tipo = 'PRODUTO_ATUALIZADO'; // particípio passado — ADR-0006

  constructor(
    public readonly produtoId: string,
    public readonly lojaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
