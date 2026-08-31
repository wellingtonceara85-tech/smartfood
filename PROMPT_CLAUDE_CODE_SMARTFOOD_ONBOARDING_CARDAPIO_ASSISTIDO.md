# SmartFood — Onboarding guiado + cardápio assistido

Este arquivo documenta a feature já implementada (missão "Onboarding guiado + cardápio assistido") — fluxo, estados, endpoints e limitações da V1, pra servir de referência em manutenções futuras.

## Objetivo

Depois de ativar a conta, o lojista é conduzido por um wizard mobile-first (`/painel/onboarding`) até deixar identidade, funcionamento e cardápio configurados — em vez de cair direto num painel vazio. Lojas que já existiam antes desta feature nunca são obrigadas a passar pelo wizard.

## Fluxo do wizard

Etapas fixas: `segmento` → `identidade` → `funcionamento` → `cardapio` (escolha do método) → `execucao` (tela específica do método escolhido).

A partir daí, dois caminhos:

- **Planilha ou colar texto** → gera um **rascunho** (nunca publica direto) → `revisao` (editar/excluir itens, ver resumo, publicar) → `fotos` → `previa` → `conclusao`.
- **Guiado, manual ou arquivo (PDF/imagem)** → vão direto pra `conclusao` (guiado cria categorias reais antes; manual só redireciona pro gerenciador normal; arquivo cria uma solicitação pra revisão humana).

Progresso é salvo a cada etapa (`OnboardingLoja.etapaAtual`/`etapasConcluidas`) — sair e voltar retoma exatamente de onde parou. `PainelLayout` redireciona pra `/painel/onboarding` sempre que `status !== 'concluido'`.

## Modelo de dados (Prisma)

- `OnboardingLoja` (1:1 `Loja`) — `status` (`nao_iniciado|em_andamento|concluido`), `segmentoNegocio`, `etapaAtual`, `etapasConcluidas` (Json), `metodoCardapio`.
- `RascunhoCardapio` → `RascunhoCategoria` → `RascunhoProduto` — rascunho de importação (planilha/texto colado). Publicação é **por item**: nome/preço inválidos bloqueiam só aquele produto (fica marcado `precisaRevisao`), os demais viram `Categoria`/`Produto` reais imediatamente.
- `SolicitacaoCardapioAssistido` — PDF/imagem enviado pelo lojista pra revisão humana. Arquivo fica em storage **privado** (`private-uploads/` local, ou Storage sem `makePublic()` no Cloud Functions) — só acessível via `GET /api/admin-master/cardapios-assistidos/:id/arquivo` autenticado, nunca por URL pública.
- `SugestaoLojista` — feedback simples (categoria + mensagem + status).

Lojas que já existiam antes desta feature foram marcadas `status='concluido'` por `backend/prisma/backfillOnboardingExistente.ts` (rodar uma vez após o deploy da migration; idempotente). Lojas novas (`POST /api/admin-master/lojas`) já nascem com `OnboardingLoja` em `nao_iniciado`.

## Endpoints principais

Dono da loja (`/api/admin/...`): `onboarding` (estado, sugestões de categoria, categorias guiadas), `rascunho-cardapio` (`/planilha`, `/colar-texto`, revisão, `/publicar`, `/descartar`), `cardapio-assistido/solicitacoes` (upload + lista própria), `sugestoes` (criar + lista própria).

Admin Master (`/api/admin-master/...`): `cardapios-assistidos` (lista, detalhe, arquivo, status), `sugestoes` (lista, status).

## Validações do rascunho

`utils/validacaoRascunho.ts` — duplicados (nome normalizado sem acento/caixa), sem descrição, sem foto, precisa revisão (nome ou preço inválido — **estes bloqueiam publicação do item**; os demais são só aviso). Parsers (`utils/parserPlanilhaCardapio.ts`, `utils/parserTextoCardapio.ts`, `utils/csvSimples.ts`, `utils/lerXlsx.ts`) nunca inventam preço/nome ausente.

## Limitações da V1 (por escolha de escopo)

- Parser de texto colado não detecta cabeçalhos de categoria — todo item cai em "Sem categoria".
- Upload de PDF/imagem não tem OCR/IA — vira fila de revisão humana no Admin Master.
- "Já vende no iFood?" é só um card visual "Em breve" — sem integração.
- Geração de foto por IA não implementada (só arquitetura/UX preparada pro botão "Adicionar foto").
- Sem testes de integração/rota automatizados (o repo não usa supertest) — regras de negócio ficam em `utils/*.ts` puros e testados; isolamento entre lojas e permissões do Admin Master foram verificados manualmente.

## Backlog registrado (não implementar sem pedido explícito)

Engajamento: cupons, cashback, compre-e-ganhe, fidelidade. Operação: gestão de entregadores, portal do entregador, impressão automática, "SmartFood Print". Automação: robô de WhatsApp, atendimento automatizado. Cardápio Inteligente V2: OCR de imagem/PDF, geração assistida de descrição, geração de foto por IA, integração oficial com iFood.
