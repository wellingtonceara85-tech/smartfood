export interface ItemNovidade {
  icone: string;
  titulo: string;
  descricao: string;
}

export interface ConteudoNovidade {
  versao: string;
  titulo: string;
  texto: string;
  itens: ItemNovidade[];
  textoFinal: string;
  rodape: string;
  botao: string;
}

// Bump a `versao` (formato livre, ex: "2026.08.1") a cada nova novidade — é a
// única coisa que precisa mudar pra reexibir o aviso pra todo mundo. O
// conteúdo abaixo é só o da novidade mais recente; não há histórico.
export const NOVIDADE_ATUAL: ConteudoNovidade = {
  versao: '2026.08.1',
  titulo: 'Novidades no SmartFood 🎉',
  texto: 'Deixamos a organização do seu cardápio ainda mais fácil!',
  itens: [
    {
      icone: '✋',
      titulo: 'Organize do seu jeito',
      descricao:
        'Agora você pode arrastar categorias e produtos para mudar a ordem em que aparecem no cardápio.',
    },
    {
      icone: '📦',
      titulo: 'Mova vários produtos de uma vez',
      descricao: 'Selecione vários itens e altere a categoria de todos em poucos toques.',
    },
    {
      icone: '📋',
      titulo: 'Duplique produtos',
      descricao: 'Crie rapidamente um novo item a partir de outro já cadastrado.',
    },
    {
      icone: '✏️',
      titulo: 'Edição mais prática',
      descricao: 'Ao editar um produto, o SmartFood agora leva você diretamente ao formulário.',
    },
  ],
  textoFinal: 'Tudo pensado para facilitar a gestão do seu cardápio pelo celular. ❤️',
  rodape: 'Atualização de agosto/2026',
  botao: 'Entendi, vamos lá!',
};

/** Verdadeiro quando o usuário ainda não confirmou ter visto a versão atual do aviso. */
export function deveExibirNovidade(versaoVista: string | null, versaoAtual: string): boolean {
  return versaoVista !== versaoAtual;
}
