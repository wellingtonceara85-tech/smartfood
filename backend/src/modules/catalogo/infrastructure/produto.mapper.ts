import type { Produto as ProdutoPrisma, VariacaoProduto as VariacaoPrisma } from '@prisma/client';
import { Produto } from '../domain/produto.entity';

type ProdutoComVariacoes = ProdutoPrisma & { variacoes: VariacaoPrisma[] };

export class ProdutoMapper {
  static paraDominio(registro: ProdutoComVariacoes): Produto {
    return Produto.reconstituir({
      id: registro.id,
      lojaId: registro.lojaId,
      categoriaId: registro.categoriaId,
      nome: registro.nome,
      descricao: registro.descricao,
      imagemUrl: registro.imagemUrl,
      controlaEstoque: registro.controlaEstoque,
      disponivel: registro.disponivel,
      criadoEm: registro.criadoEm,
      variacoes: registro.variacoes.map((v) => ({
        id: v.id,
        produtoId: v.produtoId,
        nome: v.nome,
        precoValor: Number(v.precoValor),
        precoMoeda: v.precoMoeda,
        codigoInterno: v.codigoInterno,
        disponivel: v.disponivel,
      })),
    });
  }
}
