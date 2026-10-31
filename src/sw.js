// Çevrimdışı çalışma: sayfalar önce ağdan (güncel kalsın), ağ yoksa önbellekten; görseller önce önbellekten.
// Cloudflare harita.html → /harita yönlendirir (308); yönlendirilmiş yanıt sayfa olarak sunulamadığı için yeniden paketlenir ve /harita için harita.html aranır.
// VERSION ve PRECACHE build sırasında dosyanın başına eklenir. /api/ istekleri hiç önbelleğe alınmaz.
const TILES='tiles-jp26';
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>Promise.all(PRECACHE.map(u=>fetch(u,u.startsWith('http')?{mode:'cors'}:{credentials:'same-origin'}).then(r=>{if(r.ok)return c.put(u,r.redirected?new Response(r.body,{status:200,headers:r.headers}):r)}).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jp26-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.pathname.startsWith('/api/'))return;
  // Arama dizininin adı sabit (özetli değil): önbellekten verilirse yeni eklenen ürünler aranamaz; önce ağ.
  if(url.pathname==='/search.json'){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put('search.json',copy))}return r}).catch(()=>caches.match('search.json')));
    return;
  }
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(url.pathname==='/'?'./':url.pathname.slice(1),copy))}return r}).catch(()=>caches.match(url.pathname==='/'?'./':url.pathname.slice(1)).then(r=>r||caches.match(url.pathname.slice(1)+'.html')).then(r=>r||caches.match('index.html'))));
    return;
  }
  // Harita parçaları ve Leaflet: sürümden bağımsız ayrı önbellek; bir kez açılan harita internetsiz de görünür.
  // shortcut: en fazla 1500 parça tutulur (en eskiler silinir); daha uzun gezide sınırı büyüt.
  if(url.hostname==='tile.openstreetmap.org'||url.hostname==='unpkg.com'){
    e.respondWith(caches.open(TILES).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){c.put(req,r.clone()).then(()=>c.keys()).then(k=>k.length>1500&&Promise.all(k.slice(0,200).map(x=>c.delete(x))))}return r}))));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&(url.origin===location.origin||url.hostname.endsWith('wikimedia.org'))){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return r})));
});
