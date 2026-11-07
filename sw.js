/* Service worker sederhana: game bisa dibuka tanpa internet.
   Ubah angka VERSI setiap kali Anda memperbarui index.html agar pengguna mendapat versi terbaru. */
const VERSI = 'abror-arqom-v1';
const INTI = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Audio/video tidak disimpan (besar dan memakai Range request) -> langsung ke jaringan
  if (r.headers.has('range') || /\.(mp3|ogg|mp4|webm)$/i.test(u.pathname) || u.hostname.includes('archive.org') || u.hostname.includes('islamic.app') || u.hostname.includes('youtube')) return;
  // Halaman: coba jaringan dulu, jika offline pakai cache
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSI).then(ch => ch.put('./index.html', c)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  // File lain (ikon, font Google): pakai cache dulu, perbarui di belakang layar
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(VERSI).then(ch => ch.put(r, c)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
