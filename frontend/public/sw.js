// Service worker mínimo — existe só pra o navegador considerar o SmartFood
// instalável (critério do Chrome/Android exige um service worker com
// handler de fetch pra oferecer "Adicionar à tela inicial" em modo app).
//
// Não faz cache de nada, de propósito: disponibilidade de produto e preço
// precisam refletir em tempo real no cardápio público (ver CLAUDE.md) — um
// service worker com estratégia de cache poderia servir uma resposta antiga
// no lugar da atual. Aqui é sempre passthrough direto pra rede.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
