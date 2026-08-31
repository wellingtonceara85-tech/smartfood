import { useState } from 'react';
import { AgendaHorarios } from '../../components/painel/AgendaHorarios';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { agendaInicialAPartirDoLegado } from '../../lib/horario';
import { HorariosFuncionamento, Loja } from '../../types';

interface Props {
  loja: Loja;
  salvando: boolean;
  aoContinuar: (dados: {
    telefoneWhatsapp: string;
    endereco: string | null;
    horariosFuncionamento: HorariosFuncionamento;
  }) => void;
}

export function EtapaFuncionamento({ loja, salvando, aoContinuar }: Props) {
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState(loja.telefoneWhatsapp);
  const [endereco, setEndereco] = useState(loja.endereco ?? '');
  const [horarios, setHorarios] = useState<HorariosFuncionamento>(
    loja.horariosFuncionamento ??
      agendaInicialAPartirDoLegado(loja.horarioAbertura, loja.horarioFechamento),
  );

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700">WhatsApp de atendimento/pedidos</label>
        <Input
          value={telefoneWhatsapp}
          onChange={(e) => setTelefoneWhatsapp(e.target.value)}
          placeholder="5585999999999"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">Com DDI + DDD, só números.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Endereço</label>
        <Input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Rua, número, bairro, cidade"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Útil pra quem for retirar o pedido no local. A taxa de entrega por bairro/distância você
          configura depois, em Entrega.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Dias e horários de funcionamento
        </label>
        <div className="mt-1">
          <AgendaHorarios valor={horarios} aoMudar={setHorarios} />
        </div>
      </div>

      <Button
        type="button"
        disabled={salvando}
        onClick={() =>
          aoContinuar({
            telefoneWhatsapp,
            endereco: endereco || null,
            horariosFuncionamento: horarios,
          })
        }
      >
        {salvando ? 'Salvando...' : 'Continuar'}
      </Button>
    </Card>
  );
}
