// The web build's picture cache (WEBAPP-12). The Hub signs every picture link anew each time it is asked (the time is in the
// link), so the browser sees a new address for the same picture on every visit and downloads it again. This worker answers a
// picture from the object's own address (the link without its signature) when it already holds it, and otherwise fetches the
// link it was given and keeps the picture under that address. It touches nothing else: only GET image requests to another
// site that carry an S3 signature. If keeping a picture fails for any reason the picture is fetched as it would have been.
const CACHE = 'wmt-pictures-v1';
const MAX_PICTURES = 120;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.destination !== 'image') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin || !url.searchParams.has('X-Amz-Signature')) return;
  event.respondWith(answer(event, request, url));
});

async function answer(event, request, url) {
  const key = url.origin + url.pathname;
  try {
    const cache = await caches.open(CACHE);
    const held = await cache.match(key);
    if (held) return held;
    const response = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
    if (response.status === 200 && /^image\//.test(response.headers.get('content-type') || '')) {
      event.waitUntil(keep(cache, key, response.clone()));
    }
    return response;
  } catch {
    return fetch(request);
  }
}

async function keep(cache, key, response) {
  try {
    await cache.put(key, response);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_PICTURES; i += 1) await cache.delete(keys[i]);
  } catch {
    // A full disk or a refused write leaves the picture uncached, and nothing else.
  }
}
