const CACHE_NAME = 'train-calc-v4.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap'
];

// 安裝並快取核心檔案
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 啟用並清理舊快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求：優先使用快取 (Cache First)，適合純前端工具
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        // 如果真的找不到且沒網路，這裡可以選擇性回傳自訂的離線頁面
      });
    })
  );
});a
