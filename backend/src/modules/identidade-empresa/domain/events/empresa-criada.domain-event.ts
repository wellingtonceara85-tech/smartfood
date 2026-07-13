/**
 * Evento de domínio disparado na criação de uma Empresa (Missão 0004, Seção 6).
 * Publicação real (Outbox/eventos_publicados, ADR-0023) fica para o Caso de Uso
 * CriarEmpresa — este arquivo só define o evento em si.
 */
export class EmpresaCriadaEvent {
  static readonly tipo = 'EMPRESA_CRIADA'; // particípio passado — ADR-0006

  constructor(
    public readonly empresaId: string,
    public readonly lojaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
