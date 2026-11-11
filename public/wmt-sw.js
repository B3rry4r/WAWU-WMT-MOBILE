// The web build's picture cache (WEBAPP-12). The Hub signs every picture link anew each time it is asked (the time is in the
// link), so the browser sees a new address for the same picture on every visit and downloads it again. This worker answers a
// picture from the object's own address (the link without its signature) when it already holds it, and otherwise fetches the
// link it was given and keeps the picture under that address. It touches nothing else: only GET image requests to another
// site that carry an S3 signature. If keeping a picture fails for any reason the picture is fetched as it would have been.
const CACHE = 'wmt-pictures-v1';
const MAX_PICTURES = 120;
// A free piece's preview is the whole photo (about 4.7 MB), so a count alone could hold about 560 MB on someone's disk.
const MAX_BYTES = 60 * 1024 * 1024;
// Written by the page while a session is open (`OPEN_KEY` in src/lib/pictureCache.ts); with no marker nothing is kept.
const OPEN_KEY = 'https://wmt.invalid/session-open';
const BYTES_HEADER = 'x-wmt-bytes';

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
    // The size is written onto the held copy, so the bound below can add up what is held without reading any picture again.
    if (!(await cache.match(OPEN_KEY))) return;
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) return;
    const headers = new Headers(response.headers);
    headers.set(BYTES_HEADER, String(blob.size));
    await cache.put(key, new Response(blob, { status: response.status, headers }));
    // Oldest stored goes first (keys come back in the order they were put), until both bounds hold.
    const keys = (await cache.keys()).filter((k) => (k.url || k) !== OPEN_KEY);
    const sizes = [];
    let total = 0;
    for (const k of keys) {
      const held = await cache.match(k);
      const n = held ? Number(held.headers.get(BYTES_HEADER)) || 0 : 0;
      sizes.push(n);
      total += n;
    }
    let count = keys.length;
    for (let i = 0; i < keys.length - 1 && (count > MAX_PICTURES || total > MAX_BYTES); i += 1) {
      await cache.delete(keys[i]);
      total -= sizes[i];
      count -= 1;
    }
  } catch {
    // A full disk or a refused write leaves the picture uncached, and nothing else.
  }
}
