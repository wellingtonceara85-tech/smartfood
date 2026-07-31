# SmartFood — Migração de deploy para Firebase + Neon (sem tocar na lógica de negócio)

Cole este arquivo como instrução pro Claude Code. É uma tarefa de infraestrutura/deploy — não mexe em produto, tela ou regra de negócio.

## Contexto

O Railway cobra um mínimo de US$ 5/mês mesmo sem uso, porque ainda não há cliente pagante. Firebase (plano Blaze, já em uso na Ágil Tech sem custo) e Neon (Postgres gratuito permanente) ficam em US$ 0 no volume atual. Esta é a configuração de deploy da fase de demonstração para clientes — quando fechar a primeira venda, a migração de volta pra um provedor always-on é só trocar variáveis de ambiente, sem tocar em código de produto.

## O que NÃO muda

- Nenhuma rota, controller, service ou regra de negócio do backend Express
- Nenhuma tabela, relação ou query do schema Prisma
- Nenhuma tela ou componente do frontend React
- Este prompt é só sobre onde e como o mesmo código roda

## O que muda

### Banco de dados: Postgres local/Railway → Neon

- Criar um projeto gratuito em neon.tech, sem cartão
- Usar a **connection string com pooler** do Neon (não a direta) no `DATABASE_URL` — Cloud Functions escala instâncias sob demanda, e conexões diretas ao Postgres esgotam rápido sem um pooler na frente
- Rodar `prisma migrate deploy` contra o Neon antes do primeiro deploy
- Nenhuma alteração em `schema.prisma` ou nas queries existentes

### Backend: container Express → Firebase Cloud Functions (2ª geração)

- Envolver o app Express já existente numa Cloud Function `onRequest`, sem alterar nenhuma rota:
  ```ts
  import { onRequest } from 'firebase-functions/v2/https';
  import app from './app'; // o Express app já existente, sem mudanças
  export const api = onRequest(app);
  ```
- Configurar `DATABASE_URL`, `JWT_SECRET` e `JWT_REFRESH_SECRET` como secrets da function (`firebase functions:secrets:set`)
- Middleware de CORS já existente deve liberar o domínio do Firebase Hosting

### Upload de fotos: disco local → Firebase Storage

- Trocar a função que hoje grava em `backend/uploads/` para usar o Firebase Admin SDK (`getStorage().bucket().file(...).save(...)`)
- A URL retornada pro frontend continua sendo uma URL pública de imagem — nenhuma mudança de contrato de API
- Usa o bucket padrão do projeto Firebase, já no plano Blaze

### Frontend: build estático → Firebase Hosting

- `firebase.json` apontando pra pasta de build do Vite (`frontend/dist`)
- Variável de ambiente do frontend (`VITE_API_URL`) apontando pra URL da Cloud Function

### Deploy automático via GitHub

- Workflow do GitHub Actions dispara o deploy a cada push na branch `main`:
  - Hosting: action oficial `FirebaseExtended/action-hosting-deploy`
  - Functions: `firebase deploy --only functions` como step de CI
- Objetivo: nenhum deploy manual — o mesmo fluxo automático que o Railway já oferecia

## Critério de aceite

- App funcionando de ponta a ponta nos domínios do Firebase Hosting, com o mesmo comportamento já validado localmente: cliente monta pedido → finaliza no WhatsApp; lojista loga → altera disponibilidade de um produto → reflexo instantâneo na página pública
- Nenhuma regressão de funcionalidade — é troca de infraestrutura, não de produto
- Custo mensal esperado: US$ 0 no volume atual — confirmar no painel de billing do Firebase e do Neon depois do primeiro deploy

## Observação para o futuro

Esta configuração é da fase de demonstração, sem clientes pagantes ainda. Ao fechar a primeira venda, migrar pra um provedor com always-on garantido é uma troca de variáveis de ambiente e redirecionamento de deploy — a lógica de negócio, o schema e as telas não mudam.
