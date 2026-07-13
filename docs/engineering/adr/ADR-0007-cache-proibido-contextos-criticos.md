# ADR-0007 — Cache Proibido em Contextos Transacionais Críticos

**Status:** Aceito
**Data:** 2026-07-11
**Missão relacionada:** [Missão 0005 — Arquitetura da Solução](../../product/missao-0005-arquitetura-solucao.md), Seção 8

## Contexto

Cache é uma técnica natural para reduzir custo de leitura em dado de alto volume e baixa volatilidade (ex: Catálogo público). Era preciso decidir explicitamente se essa técnica se aplicaria uniformemente a todo o sistema ou se haveria contextos excluídos por design.

## Decisão

**Vendas & Operação, Pagamentos, e Estoque (quando o controle de disponibilidade está ativo) nunca usam cache** para leitura do próprio estado transacional. Catálogo, Relatórios & Analytics e Identidade & Empresa/Configuração da Loja podem usar cache, invalidado pelo próprio contexto dono no momento da mudança (Missão 0005, Seção 8).

## Alternativas consideradas

- **Cache uniforme com TTL curto em todo contexto de leitura frequente:** rejeitado para os três contextos críticos — mesmo um TTL de poucos segundos cria uma janela real onde a cozinha pode ver um pedido já cancelado, ou o checkout pode vender um item já esgotado (overselling), ou o caixa pode operar sobre valor de pagamento desatualizado. O custo de um erro nesses contextos é desproporcional ao ganho de performance.
- **Cache com invalidação por evento em tempo real nos contextos críticos:** considerado, mas rejeitado por ora — mesmo com invalidação por evento, existe uma janela entre a mudança de estado e a propagação do evento de invalidação (natureza assíncrona, ADR-0006) que os três contextos críticos não podem tolerar.

## Consequências

- **Facilita:** decisão simples e sem ambiguidade sobre onde otimizar performance de leitura — nenhum desenvolvedor futuro precisa "decidir" se um dado é seguro para cache, a regra já responde por contexto.
- **Custa:** Vendas & Operação e Pagamentos, que são também os contextos de maior carga (Riscos, Seção 17), não podem usar a técnica mais simples de redução de carga — a resposta a isso é escalabilidade horizontal (Seção 14), não cache.
- **Impede:** qualquer otimização futura de performance nesses três contextos que dependa de servir leitura potencialmente desatualizada — qualquer ganho de performance ali precisa vir de outro mecanismo (índice, particionamento, escala horizontal — decisões de implementação, não desta missão).
