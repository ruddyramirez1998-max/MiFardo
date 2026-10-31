const C='mifardo-v2',F=['./','index.html','style.css','app.js','manifest.json','icons/logo.png','js/config.js','js/auth.js','js/admin.js','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!='GET')return;
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c)).catch(()=>{})}return r})
.catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode=='navigate'?caches.match('index.html'):undefined))))});
