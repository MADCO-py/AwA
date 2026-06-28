// AwA Service Worker
// Intercepts NFC URLs so they open in the existing tab, not a new one

const CACHE = 'awa-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // NFC drink action — route to existing client instead of new tab
  if(url.searchParams.get('action') === 'drink'){
    e.respondWith(
      self.clients.matchAll({type:'window', includeUncontrolled:true}).then(clients => {
        // Focus existing window and send message
        if(clients.length > 0){
          const client = clients[0];
          client.focus();
          client.postMessage({
            type: 'NFC_DRINK',
            bottle: url.searchParams.get('bottle') || '1'
          });
          // Return a blank redirect response so no new page loads
          return Response.redirect(url.origin + url.pathname, 302);
        }
        // No existing window — open normally
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
