# SmartFood — Cardápio digital (MVP) — prompt para Claude Code

Cole este arquivo inteiro como instrução inicial pro Claude Code. Ele substitui o escopo antigo do SmartFood (arquitetura DDD/multi-tenant/event-driven) por um MVP enxuto, no padrão de stack que a Ágil Tech já usa nos outros projetos.

## Contexto

O SmartFood original cresceu demais: 7 missões de arquitetura antes de qualquer tela funcionar, 26 ADRs, DDD com módulos separados, multi-schema por empresa, padrão outbox de eventos. Zero telas usáveis depois de dias de trabalho. Este prompt é o reset: construir primeiro um cardápio digital público por loja, inspirado no whatsmenu.com.br mas com diferenciais próprios, e nada além disso por enquanto.

## Objetivo do MVP

Um cardápio digital público, acessível por link único por loja (`/nome-da-loja`), onde o cliente monta um pedido e finaliza direto no WhatsApp do estabelecimento — sem checkout online, sem pagamento integrado, sem app pra instalar. E um painel simples pro dono da loja cadastrar produtos e controlar disponibilidade em tempo real.

## Fora de escopo agora — não implementar

- Arquitetura DDD, bounded contexts, camadas `domain/application/infrastructure/api` separadas por módulo
- ADRs, "missões" de documentação, ou qualquer processo de design formal antes de escrever código
- Multi-tenant com schema separado por empresa — usar `loja_id` como chave estrangeira simples numa única base
- Event sourcing, padrão outbox, filas ou mensageria
- Pagamento online, split de conta, rastreamento de entregador
- App mobile nativo — só web responsivo
- Multi-idioma
- Tela "Meus pedidos" com histórico completo (fica pra fase 2 — no MVP só o atalho "pedir de novo")

Se em algum momento a tentação for criar uma pasta `docs/missões` ou um ADR novo antes de codar uma tela: não faça. Escreva a tela.

## Stack (padrão Ágil Tech)

- Frontend: React (Vite) + TypeScript + Tailwind
- Backend: Node.js + Express — não NestJS
- Banco: PostgreSQL, schema único, tabelas simples
- ORM: Prisma ou Knex, à escolha — sem multi-schema
- Auth: JWT com refresh token, RBAC simples (papéis: `dono_loja`, `admin_master`)
- Deploy: Docker + Railway

## Modelo de dados mínimo

```
lojas
  id, nome, slug, telefone_whatsapp, logo_url, tagline,
  horario_abertura, horario_fechamento, aberto_manual (boolean)

categorias
  id, loja_id, nome, ordem

produtos
  id, loja_id, categoria_id, nome, descricao, preco,
  foto_url, disponivel (boolean), opcoes (jsonb, nullable — array de strings)

pedidos
  id, loja_id, cliente_telefone, itens (jsonb), total, criado_em
```

`pedidos` aqui é só log/histórico — não é uma transação financeira, é o que possibilita o "pedir de novo".

## Telas do MVP

### Pública — cliente, sem login — `/:slug`

- Cabeçalho: logo circular, nome da loja, tagline, badge "aberto"/"fechado" — calculado pelo horário cadastrado, com override manual do dono (`aberto_manual`)
- Busca por nome ou descrição de produto
- Categorias em abas horizontais
- Card de produto: foto, nome, descrição curta, preço, seletor de opção quando o produto tiver `opcoes`, contador de quantidade
- Produto com `disponivel = false` aparece acinzentado, sem controle de quantidade — reflexo imediato, sem cache
- Resumo do pedido com total, sempre visível na parte de baixo da tela em mobile
- Se o cliente informar telefone e já houver pedido anterior daquele telefone naquela loja: mostrar chip "pedir de novo" com o último pedido
- Botão "Finalizar no WhatsApp": monta o texto formatado do pedido (loja, itens com opção escolhida e subtotal, total) e abre `https://wa.me/<telefone_loja>?text=<mensagem>` — grava o pedido em `pedidos` como log, não bloqueia nem espera confirmação de pagamento

### Painel do lojista — autenticado

- Login simples via JWT
- Lista de produtos com toggle de disponível/indisponível — efeito imediato na página pública
- CRUD de produto: nome, descrição, preço, foto, categoria, opções
- Configuração da loja: nome, logo, tagline, telefone do WhatsApp, horário de funcionamento
- Sem dashboard analítico nesta fase — só operação

## Regras de negócio

- Disponibilidade do produto reflete em tempo real na página pública, sem cache que atrase isso
- Opções de produto (ex: ponto da carne) ficam como array de strings no campo `opcoes`; cliente escolhe uma por item
- Total é calculado no frontend pra preview, e revalidado no backend contra o preço cadastrado antes de gravar o pedido — evita manipulação de preço via devtools
- Mensagem do WhatsApp: nome da loja, lista de itens com opção e subtotal, total no fim, sem emoji em excesso

## Critério de aceite do MVP

- O dono consegue: logar, cadastrar a loja, cadastrar categoria e produto com foto e preço, marcar um item como indisponível e ver isso refletido na hora na página pública
- O cliente consegue: abrir o link da loja no celular, navegar por categoria, buscar produto, montar um pedido com opção de preparo, ver o total, finalizar e cair no WhatsApp com a mensagem pronta
- O sistema sobe local via `docker-compose up` e também no Railway, sem configuração além das variáveis de ambiente

## Convenções

- Commits pequenos e objetivos — decisão de implementação não precisa de ADR
- Sem pasta de backlog formal nem numeração de "missões" — usar issues simples se precisar rastrear algo
- Estrutura de pastas: `frontend/` e `backend/` como dois projetos simples — sem monorepo com workspace manager obrigatório

## Referência visual

Inspirado no whatsmenu.com.br, com os diferenciais acima somados: banner e logo circular no topo, nome e tagline centralizados, badge de status no canto, busca por produto, abas de categoria, cards com imagem, descrição e preço em destaque, rodapé com nome, telefone e endereço da loja.
