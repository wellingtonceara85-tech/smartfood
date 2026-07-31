# SmartFood — Taxa de entrega por bairro

Cole este arquivo como instrução pro Claude Code. É uma adição de feature ao MVP já existente — não mexe no deploy nem na infraestrutura (isso é tarefa separada).

## Objetivo

O cliente escolhe entre "Entrega" ou "Retirada" antes de montar o pedido. Se escolher entrega, seleciona o bairro numa lista cadastrada pelo lojista, e o valor da taxa aparece automaticamente e entra no total. Sem geolocalização, sem cálculo por distância — é uma tabela de consulta simples, mantida manualmente pelo dono da loja.

## O que fica fora de escopo

- Cálculo automático por distância ou geolocalização
- Área de entrega desenhada em mapa
- Tempo estimado de entrega dinâmico
- Integração com serviço de entrega terceirizado

## Modelo de dados

```
bairros_entrega
  id, loja_id, nome_bairro, valor_entrega, ativo (boolean)
```

## Painel do lojista

- Nova seção simples: lista de bairros cadastrados, com nome, valor e toggle ativo/inativo
- CRUD básico: adicionar, editar valor, excluir ou desativar um bairro
- Sem limite artificial de quantidade de bairros

## Página pública — `/:slug`

- Antes de montar o pedido (ou no resumo, antes de finalizar — o que for mais natural no fluxo já existente): pergunta "Como você quer receber o pedido?" com duas opções, `Entrega` e `Retirada`
- Se `Entrega`: mostra um select com os bairros ativos daquela loja; ao selecionar um, a taxa de entrega correspondente é somada automaticamente ao total do pedido
- Se `Retirada`: nenhuma taxa é somada
- Se a loja não tiver nenhum bairro cadastrado, a opção `Entrega` não aparece — só `Retirada`

## Mensagem do WhatsApp

Incluir a forma de recebimento escolhida e, se for entrega, o bairro e a taxa:

```
Forma de recebimento: Entrega — Bairro X (R$ Y,00)
```

ou

```
Forma de recebimento: Retirada no local
```

O total final já deve refletir a taxa somada, igual ao que aparece pro cliente na tela.

## Critério de aceite

- Lojista cadastra um bairro com valor, ativa, e ele aparece na página pública imediatamente
- Cliente escolhe entrega, seleciona o bairro, vê o total atualizado com a taxa somada
- Cliente escolhe retirada, total não sofre alteração
- Mensagem do WhatsApp reflete corretamente a escolha e o valor
