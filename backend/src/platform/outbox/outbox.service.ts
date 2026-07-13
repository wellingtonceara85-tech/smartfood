import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface RegistrarEventoDados {
  tipo: string;
  agregadoOrigem: string;
  empresaId: string;
  payload: Prisma.InputJsonValue;
  correlationId?: string;
}

/**
 * Padrão Outbox (ADR-0023): grava o compromisso de publicar um evento na mesma transação
 * da mudança de estado que o originou. Recebe o client de transação explicitamente — quem
 * decide o escopo da transação é sempre o repositório do Agregado, nunca este serviço.
 *
 * Só a publicação (INSERT em eventos_publicados) está implementada nesta missão — o relay
 * in-process que lê e despacha para assinantes (ADR-0023) fica para quando existir o primeiro
 * assinante real.
 */
@Injectable()
export class OutboxService {
  async registrar(tx: Prisma.TransactionClient, dados: RegistrarEventoDados): Promise<void> {
    await tx.eventoPublicado.create({
      data: {
        tipo: dados.tipo,
        agregadoOrigem: dados.agregadoOrigem,
        empresaId: dados.empresaId,
        correlationId: dados.correlationId ?? crypto.randomUUID(),
        payload: dados.payload,
      },
    });
  }
}
