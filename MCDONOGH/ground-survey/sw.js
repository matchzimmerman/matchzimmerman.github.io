/* McDonogh Ground Survey: offline support. After one online visit every file the survey needs is stored on this device. */
const VERSION = 'gs-2026-11-11a';
const PRECACHE = ["./", "data/reference.json", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "lib/three/LICENSE", "lib/three/three.module.js", "lib/three/addons/controls/MapControls.js", "lib/three/addons/controls/OrbitControls.js", "lib/three/addons/controls/TransformControls.js", "lib/three/addons/loaders/ColladaLoader.js", "lib/three/addons/loaders/GLTFLoader.js", "lib/three/addons/loaders/OBJLoader.js", "lib/three/addons/loaders/STLLoader.js", "lib/three/addons/loaders/TGALoader.js", "lib/three/addons/utils/BufferGeometryUtils.js", "data/assets.json", "data/candidates.json", "data/estate_plan.jpg", "data/meta.json", "data/ov.webp", "data/ovi.jpg", "data/s0.webp", "data/s1.webp", "data/s2.webp", "data/i/0_0.jpg", "data/i/0_1.jpg", "data/i/0_2.jpg", "data/i/0_3.jpg", "data/i/0_4.jpg", "data/i/0_5.jpg", "data/i/1_0.jpg", "data/i/1_1.jpg", "data/i/1_2.jpg", "data/i/1_3.jpg", "data/i/1_4.jpg", "data/i/1_5.jpg", "data/i/2_0.jpg", "data/i/2_1.jpg", "data/i/2_2.jpg", "data/i/2_3.jpg", "data/i/2_4.jpg", "data/i/2_5.jpg", "data/i/3_0.jpg", "data/i/3_1.jpg", "data/i/3_2.jpg", "data/i/3_3.jpg", "data/i/3_4.jpg", "data/i/3_5.jpg", "data/i/4_0.jpg", "data/i/4_1.jpg", "data/i/4_2.jpg", "data/i/4_3.jpg", "data/i/4_4.jpg", "data/i/4_5.jpg", "data/t/0_0.webp", "data/t/0_1.webp", "data/t/0_2.webp", "data/t/0_3.webp", "data/t/0_4.webp", "data/t/0_5.webp", "data/t/1_0.webp", "data/t/1_1.webp", "data/t/1_2.webp", "data/t/1_3.webp", "data/t/1_4.webp", "data/t/1_5.webp", "data/t/2_0.webp", "data/t/2_1.webp", "data/t/2_2.webp", "data/t/2_3.webp", "data/t/2_4.webp", "data/t/2_5.webp", "data/t/3_0.webp", "data/t/3_1.webp", "data/t/3_2.webp", "data/t/3_3.webp", "data/t/3_4.webp", "data/t/3_5.webp", "data/t/4_0.webp", "data/t/4_1.webp", "data/t/4_2.webp", "data/t/4_3.webp", "data/t/4_4.webp", "data/t/4_5.webp", "data/models/mcdonogh-station.glb", "data/models/mcdonogh-water-tower-r2.glb", "data/sources/fox-estate.jpg", "data/sources/fox-estate_th.jpg", "data/sources/fox-front.jpg", "data/sources/fox-front_th.jpg", "data/sources/fox-memorial.jpg", "data/sources/fox-memorial_th.jpg", "data/sources/fox-placement.jpg", "data/sources/fox-placement_th.jpg", "data/sources/fox-plan.jpg", "data/sources/fox-plan_th.jpg", "data/sources/prospect-hill-1856.jpg", "data/sources/prospect-hill-1856_th.jpg", "data/sources/station-1940s-cadets.jpg", "data/sources/station-1940s-cadets_th.jpg", "data/sources/station-cyanotype.jpg", "data/sources/station-cyanotype_th.jpg", "data/sources/station-ink-drawing.jpg", "data/sources/station-ink-drawing_th.jpg", "data/sources/station-old-station-bridge.jpg", "data/sources/station-old-station-bridge_th.jpg", "data/sources/tower-1969-parade.jpg", "data/sources/tower-1969-parade_th.jpg", "data/sources/tower-1971.jpg", "data/sources/tower-1971_th.jpg", "../foxleigh/reconstruction/foxleigh_reconstruction_002.glb"];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil((async () => {
  const c = await caches.open(VERSION); let done = 0;
  const report = async msg => { for (const cl of await self.clients.matchAll({includeUncontrolled:true})) cl.postMessage(msg); };
  for (let i = 0; i < PRECACHE.length; i += 6) {
    await Promise.all(PRECACHE.slice(i, i + 6).map(async u => { try { const r = await fetch(u, {cache:'reload'}); if (r.ok) await c.put(u, r); } catch (_) {} done++; }));
    report({type:'gs-cache', done, total: PRECACHE.length});
  }
  report({type:'gs-cache', done: PRECACHE.length, total: PRECACHE.length, complete: true});
})()); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('gs-')) await caches.delete(k);
  await self.clients.claim();
})()));
const fresh = req => /\/$|\.html$|\.json$|\.webmanifest$/.test(new URL(req.url).pathname);
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    if (req.mode === 'navigate' || fresh(req)) {       // network first (3 s), then the stored copy
      try { const r = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3000))]);
            if (r && r.ok) { c.put(req.mode === 'navigate' ? './' : req, r.clone()); return r; } } catch (_) {}
      return (await c.match(req, {ignoreSearch:true})) || (await c.match('./')) || fetch(req);
    }
    const hit = await c.match(req, {ignoreSearch:true}); if (hit) return hit;   // everything else: stored copy first
    const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r;
  })());
});
