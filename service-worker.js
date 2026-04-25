// ═══════════════════════════════════════════
//  YallaMart Service Worker
//  Notifikasi muncul meski app ditutup
// ═══════════════════════════════════════════

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Terima push dari OneSignal ──────────────
self.addEventListener('push', event => {
  let payload = {};
  if (event.data) {
    try { payload = event.data.json(); }
    catch(e) { payload = { contents: { id: event.data.text() } }; }
  }

  const title  = payload.headings?.id || payload.headings?.en || 'YallaMart';
  const body   = payload.contents?.id || payload.contents?.en || 'Kamu mendapat pesan baru.';
  const chatId = payload.data?.chatId || '';

  const options = {
    body,
    icon    : 'https://res.cloudinary.com/dsy4hjc7a/image/upload/w_192,h_192,c_fill,f_png/v1777071286/file_00000000061071f4a2bf027d7ff5df98_gaknb3.png',
    badge   : 'https://res.cloudinary.com/dsy4hjc7a/image/upload/w_72,h_72,c_fill,f_png/v1777071286/file_00000000061071f4a2bf027d7ff5df98_gaknb3.png',
    vibrate : [200, 100, 200],
    tag     : chatId ? 'chat-' + chatId : 'yallamart',
    renotify: true,
    data    : { chatId, url: chatId ? '/?chatId=' + chatId : '/' },
    actions : [
      { action: 'open',    title: '💬 Buka Chat' },
      { action: 'dismiss', title: '✕ Tutup' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Klik notif → buka/fokus app ─────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const chatId = event.notification.data?.chatId || '';
  const url    = event.notification.data?.url    || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const c of list) {
          try {
            if (new URL(c.url).origin === self.location.origin) {
              if (chatId) c.postMessage({ type: 'OPEN_CHAT', chatId });
              return c.focus();
            }
          } catch(e) {}
        }
        return clients.openWindow(self.location.origin + url);
      })
  );
});
