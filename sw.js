const CACHE_NAME = 'train-calc-v4.2.1'; // 每次發版請遞增，舊快取會在 activate 時清除

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];
const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // 逐一快取，單一檔案失敗（例如離線時的字體）不會讓整個安裝失敗
    await Promise.all(
      [...LOCAL_ASSETS, FONT_CSS].map((u) =>
        cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
      )
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 頁面：network-first（有網路時一定拿到最新版），離線才用快取
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', res.clone()).catch(() => {});
        }
        return res;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
          new Response('離線中，且尚未快取頁面', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
      }
    })());
    return;
  }

  // 其他資源（圖示、字體）：先給快取，同時背景更新
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req);
    const net = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      })
      .catch(() => null);
    return hit || (await net) || new Response('', { status: 504 });
  })());
});
