import { useEffect, useRef, useState } from 'react';
import { Loading } from '../../components/ui/Loading';
import { api } from '../../lib/api';
import {
  indiceDoPasso,
  passoAnterior,
  passosDoFluxo,
  rotuloPasso,
  PassoOnboarding,
} from '../../lib/onboardingPassos';
import { HorariosFuncionamento, Loja, MetodoCardapio, OnboardingLoja } from '../../types';
import { CardapioArquivo } from './CardapioArquivo';
import { CardapioColarTexto } from './CardapioColarTexto';
import { CardapioGuiado } from './CardapioGuiado';
import { CardapioPlanilha } from './CardapioPlanilha';
import { EtapaConclusao } from './EtapaConclusao';
import { EtapaEscolhaCardapio } from './EtapaEscolhaCardapio';
import { EtapaFotos } from './EtapaFotos';
import { EtapaFuncionamento } from './EtapaFuncionamento';
import { EtapaIdentidade } from './EtapaIdentidade';
import { EtapaPrevia } from './EtapaPrevia';
import { EtapaSegmento } from './EtapaSegmento';
import { RevisaoRascunho } from './RevisaoRascunho';
import { WizardShell } from './WizardShell';

const PASSO_PADRAO: PassoOnboarding = 'segmento';

export function OnboardingWizard() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingLoja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const concluirDisparado = useRef(false);

  useEffect(() => {
    Promise.all([
      api<Loja>('/api/admin/loja', { autenticado: true }),
      api<OnboardingLoja>('/api/admin/onboarding', { autenticado: true }),
    ])
      .then(([lojaResp, onboardingResp]) => {
        setLoja(lojaResp);
        setOnboarding(onboardingResp);
      })
      .finally(() => setCarregando(false));
  }, []);

  const passoAtual = (onboarding?.etapaAtual as PassoOnboarding | undefined) ?? PASSO_PADRAO;
  const metodo = onboarding?.metodoCardapio ?? null;
  const passos = passosDoFluxo(metodo);
  const indiceAtual = indiceDoPasso(passos, passoAtual) + 1;

  async function salvarProgresso(patch: {
    etapaAtual?: PassoOnboarding;
    etapaConcluida?: PassoOnboarding;
    segmentoNegocio?: string;
    metodoCardapio?: MetodoCardapio;
  }) {
    const atualizado = await api<OnboardingLoja>('/api/admin/onboarding', {
      method: 'PUT',
      autenticado: true,
      body: patch,
    });
    setOnboarding(atualizado);
    return atualizado;
  }

  async function irPara(
    proximo: PassoOnboarding,
    extra?: { segmentoNegocio?: string; metodoCardapio?: MetodoCardapio },
  ) {
    setSalvando(true);
    try {
      await salvarProgresso({ etapaConcluida: passoAtual, etapaAtual: proximo, ...extra });
    } finally {
      setSalvando(false);
    }
  }

  function voltar() {
    const anterior = passoAnterior(passos, passoAtual);
    if (anterior) irPara(anterior);
  }

  async function atualizarLoja(dados: Partial<Loja>) {
    const atualizada = await api<Loja>('/api/admin/loja', {
      method: 'PUT',
      autenticado: true,
      body: dados,
    });
    setLoja(atualizada);
  }

  // Marca a implantação como concluída assim que o wizard chega na tela
  // final — idempotente (pode acontecer de novo sem efeito colateral), e
  // garante que o gate do PainelLayout pare de redirecionar pra cá.
  useEffect(() => {
    if (passoAtual === 'conclusao' && !concluirDisparado.current) {
      concluirDisparado.current = true;
      api('/api/admin/onboarding/concluir', { method: 'POST', autenticado: true });
    }
  }, [passoAtual]);

  if (carregando || !loja || !onboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  async function aoEscolherSegmento(segmento: string) {
    await irPara('identidade', { segmentoNegocio: segmento });
  }

  async function aoContinuarIdentidade(dados: {
    nome: string;
    logoUrl: string | null;
    capaUrl: string | null;
  }) {
    setSalvando(true);
    try {
      await atualizarLoja(dados);
      await salvarProgresso({ etapaConcluida: 'identidade', etapaAtual: 'funcionamento' });
    } finally {
      setSalvando(false);
    }
  }

  async function aoContinuarFuncionamento(dados: {
    telefoneWhatsapp: string;
    endereco: string | null;
    horariosFuncionamento: HorariosFuncionamento;
  }) {
    setSalvando(true);
    try {
      await atualizarLoja(dados);
      await salvarProgresso({ etapaConcluida: 'funcionamento', etapaAtual: 'cardapio' });
    } finally {
      setSalvando(false);
    }
  }

  async function aoEscolherMetodoCardapio(metodoEscolhido: MetodoCardapio) {
    // "Cadastrar manualmente" não tem tela própria — vai direto pro
    // gerenciador normal de categorias/produtos (ver PARTE 2, opção 5).
    const proximo = metodoEscolhido === 'manual' ? 'conclusao' : 'execucao';
    await irPara(proximo, { metodoCardapio: metodoEscolhido });
  }

  const titulos: Record<PassoOnboarding, { titulo: string; descricao?: string }> = {
    segmento: {
      titulo: 'O que você vende principalmente?',
      descricao: 'Vamos deixar sua loja pronta juntos.',
    },
    identidade: { titulo: 'Identidade da sua loja' },
    funcionamento: { titulo: 'Funcionamento' },
    cardapio: { titulo: 'Como você quer preparar seu cardápio?' },
    execucao: { titulo: rotuloPasso('execucao') },
    revisao: { titulo: 'Revise antes de publicar' },
    fotos: { titulo: 'Vamos revisar as fotos?' },
    previa: { titulo: 'Prévia do seu cardápio' },
    conclusao: { titulo: '' },
  };

  const { titulo, descricao } = titulos[passoAtual];
  const podeVoltar = passoAtual !== 'segmento' && passoAtual !== 'conclusao';

  return (
    <WizardShell
      titulo={titulo}
      descricao={descricao}
      etapaAtual={indiceAtual}
      totalEtapas={passos.length}
      aoVoltar={podeVoltar ? voltar : undefined}
    >
      {passoAtual === 'segmento' && (
        <EtapaSegmento
          segmentos={onboarding.segmentos ?? []}
          segmentoAtual={onboarding.segmentoNegocio}
          aoEscolher={aoEscolherSegmento}
        />
      )}

      {passoAtual === 'identidade' && (
        <EtapaIdentidade loja={loja} salvando={salvando} aoContinuar={aoContinuarIdentidade} />
      )}

      {passoAtual === 'funcionamento' && (
        <EtapaFuncionamento
          loja={loja}
          salvando={salvando}
          aoContinuar={aoContinuarFuncionamento}
        />
      )}

      {passoAtual === 'cardapio' && <EtapaEscolhaCardapio aoEscolher={aoEscolherMetodoCardapio} />}

      {passoAtual === 'execucao' && metodo === 'planilha' && (
        <CardapioPlanilha aoImportar={() => irPara('revisao')} />
      )}
      {passoAtual === 'execucao' && metodo === 'colar_texto' && (
        <CardapioColarTexto aoImportar={() => irPara('revisao')} />
      )}
      {passoAtual === 'execucao' && metodo === 'arquivo' && (
        <CardapioArquivo aoEnviar={() => irPara('conclusao')} />
      )}
      {passoAtual === 'execucao' && metodo === 'guiado' && (
        <CardapioGuiado
          segmentoNegocio={onboarding.segmentoNegocio}
          aoConcluir={() => irPara('conclusao')}
        />
      )}

      {passoAtual === 'revisao' && (
        <RevisaoRascunho
          aoFinalizarRevisao={() => irPara('fotos')}
          aoDescartar={() => irPara('cardapio')}
        />
      )}

      {passoAtual === 'fotos' && <EtapaFotos aoContinuar={() => irPara('previa')} />}

      {passoAtual === 'previa' && (
        <EtapaPrevia slug={loja.slug} aoContinuar={() => irPara('conclusao')} />
      )}

      {passoAtual === 'conclusao' && <EtapaConclusao slug={loja.slug} metodoCardapio={metodo} />}
    </WizardShell>
  );
}
