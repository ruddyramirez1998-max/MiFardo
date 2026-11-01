/* ============================================================
   MiFardo · Núcleo
   Utilidades generales, base de datos local (IndexedDB), iconos y menú.
   ============================================================ */
'use strict';

const $ = s => document.querySelector(s), ST = ['fardos', 'prendas', 'ventas', 'gastos', 'config'];
let DB, S = {}, Q = { fv: '', fe: '', pg: 'todos', per: 'hoy' };
const fmt = n => 'Bs ' + (Math.round((+n || 0) * 100) / 100).toLocaleString('es-BO');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = d => new Date(d).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0), key = n => (n || '').trim().toLowerCase();
const sameDay = (a, b) => new Date(a).toDateString() == new Date(b).toDateString();

function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('on'), 1900)
}
const fa = () => S.fardos.find(f => f.id == localStorage.fa) || S.fardos[S.fardos.length - 1];
const wa = (t, m) => {
  t = (t || '').replace(/\D/g, '');
  if (t.length == 8) t = '591' + t;
  return `https://wa.me/${t}?text=${encodeURIComponent(m)}`
};
const opn = n => new Promise(r => {
  const q = indexedDB.open(n, 2);
  q.onupgradeneeded = () => ST.forEach(s => {
    if (!q.result.objectStoreNames.contains(s)) q.result.createObjectStore(s, { keyPath: 'id', autoIncrement: true })
  });
  q.onsuccess = () => {
    DB = q.result;
    r()
  }
});
const tx = (s, m, f) => new Promise(r => {
  const t = DB.transaction(s, m), o = f(t.objectStore(s));
  t.oncomplete = () => r(o && o.result)
});
const load = async () => {
  for (const s of ST) S[s] = await tx(s, 'readonly', o => o.getAll())
};
const put = async (s, o, nl) => {
  const id = await tx(s, 'readwrite', x => x.put(o));
  if (!nl) await load();
  return id
};
const del = async (s, id) => {
  await tx(s, 'readwrite', x => x.delete(id));
  await load()
};
const P = { home: '<path d="M4 11.5 12 4l8 7.5V20H4z"/>', live: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>', bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', shirt: '<path d="M9 4 3.5 6.5 5.5 11 8 10v10h8V10l2.5 1 2-4.5L15 4a3 3 0 0 1-6 0z"/>', box: '<path d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>', truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/>', percent: '<path d="M5 19 19 5"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>', wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12"/><path d="M16 13.5h2"/>', bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>', save: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', up: '<path d="M12 20V9M7 13l5-5 5 5M5 4h14"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="m5 12.5 5 5L19 7"/>', x: '<path d="m6 6 12 12M18 6 6 18"/>', print: '<path d="M7 9V3h10v6M6 17H4v-7h16v7h-2M7 14h10v7H7z"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/>', qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', gear: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>', share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', shield: '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/>' };
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const M = [['dash', 'Inicio', 'home'], ['live', 'Ventas en vivo', 'live'], ['ventas', 'Ventas', 'bag'], ['prendas', 'Prendas', 'shirt'], ['fardos', 'Fardos', 'box'], ['compradoras', 'Compradoras', 'user'], ['pagos', 'Pagos', 'card'], ['entregas', 'Entregas', 'truck'], ['etiquetas', 'Etiquetas', 'tag'], ['remate', 'Remate', 'percent'], ['finanzas', 'Finanzas', 'wallet'], ['reportes', 'Reportes', 'bars'], ['respaldo', 'Respaldo', 'save'], ['ajustes', 'Ajustes', 'gear']];
const empty = (t, r) => `<div class="blk empty"><p>${t}</p><a class="btn" href="#${r}">Crear fardo</a></div>`;
const pills = (k, opts) => `<div class="pills">${opts.map(([v,l])=>`<button class="btn sm ${Q[k]==v?'':'ghost'}" onclick="Q.${k}='${v}';render()">${l}</button>`).join('')}</div>`;
const vend = () => S.ventas.slice().sort((a, b) => b.fecha - a.fecha);
const fsel = k => `<select onchange="Q.${k}=this.value;render()"><option value="">Todos los fardos</option>${S.fardos.map(f=>`<option value="${f.id}" ${Q[k]==f.id?'selected':''}>${esc(f.nombre)}</option>`).join('')}</select>`;
const R = {};
