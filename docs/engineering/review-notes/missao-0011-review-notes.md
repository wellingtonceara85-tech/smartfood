# Review Notes — Missão 0011 (Catálogo)

**Rodada:** 1 (única — aprovado com refinamentos)
**Data:** 2026-07-12
**Revisor:** Wellington (CTO/PO), dentro da conversa

## Veredito

Aprovado, com uma adição de escopo real (Invariante 2) e três esclarecimentos de campo. Todo o resto do Draft original — Agregados, RBAC básico, exclusões (Vitrine, edição/exclusão, imagem, estoque) — confirmado sem alteração.

## O que mudou e por quê

1. **Nova Invariante 2**: "um Produto não pode estar disponível se todas as suas Variações estiverem indisponíveis." **Motivo declarado**: evita inconsistência na futura vitrine (um Produto "disponível" sem nada vendável dentro). Consequência prática: adicionado o Caso de Uso/endpoint `AlternarDisponibilidadeVariacao` (`PATCH /produtos/:id/variacoes/:variacaoId/disponibilidade`), que não existia no Draft original — sem ele, a Invariante 2 seria inalcançável/intestável, já que a única forma de "zerar as Variações disponíveis" é desligando-as individualmente. Regra é unidirecional por decisão consciente: ligar uma Variação não reativa o Produto automaticamente (evita ambiguidade entre "desligado manualmente" vs. "desligado pela regra").
2. **Campo `imagemUrl`** (nullable) adicionado ao Produto — sem mecanismo de upload nesta missão, só a coluna, para não exigir migration quando o Gerenciamento de Arquivos existir.
3. **Campo `controlaEstoque`** (Boolean, default `false`) adicionado ao Produto — sem nenhuma movimentação, mesma lógica: evita migration futura sem implementar nada de Estoque agora.
4. **Matriz de RBAC documentada com framing de expansão futura**: a matriz em si não mudou (Administrador/Gerente escrevem, qualquer Usuário autenticado lê), mas o documento agora registra explicitamente que Supervisor/Operador/Financeiro leem hoje (mesma regra de "qualquer autenticado") e podem ganhar escrita no futuro (quando Estoque/Pedidos existirem) sem mudança estrutural — não é uma mudança de comportamento, é documentação de intenção para não reabrir essa decisão desnecessariamente depois.

## O que NÃO mudou (confirmado como já correto no Draft)

- Produto escopado por Loja (`lojaId`), Categoria escopada por Empresa (`empresaId`) — ADR-0018 aplicado exatamente como proposto.
- Invariante 1 (Produto sempre nasce com ao menos uma Variação, via comando de criação único) — elogiada explicitamente como o mesmo padrão estrutural de Empresa/Loja (Missão 0009).
- Vitrine pública fora de escopo — confirmado, mesma justificativa (depende de Pedido/Checkout/Horário/Entrega que ainda não existem).
- Sem DELETE — só ativo/inativo, disponível/indisponível, para preservar histórico e não quebrar referências futuras de Pedido.
- Upload de imagem e Controle de Estoque fora de escopo funcional — confirmado, só os campos placeholder (ver acima).

## Próximo passo

Documento consolidado e marcado como **CONGELADA — versão oficial**. Wellington dispensou explicitamente uma nova rodada de revisão ("madura o suficiente para ser desenvolvida sem necessidade de um novo refinamento antes do código") — implementação segue direto em incrementos pequenos e validados.
