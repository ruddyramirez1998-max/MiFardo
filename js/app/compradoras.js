/* ============================================================
   MiFardo · Compradoras
   Compradoras agrupadas desde las ventas; editar y eliminar.
   ============================================================ */
'use strict';

const grupos = l => {
  const g = {};
  l.forEach(v => {
    const k = key(v.comprador);
    (g[k] = g[k] || []).push(v)
  });
  return Object.values(g)
};
R.compradoras = () => `<div class="card">${grupos(S.ventas).map(g=>{const k=esc(key(g[0].comprador)),pen=sum(g.filter(v=>!v.pagado),v=>v.precio),t=g[0].tel;return`<div class="ent"><div class="ent-h"><div><b>${esc(g[0].comprador)}</b><span class="mut">${g.length} ${g.length==1?'prenda':'prendas'} · ${fmt(sum(g,v=>v.precio))}${pen?' · debe '+fmt(pen):''}</span><span class="mut">${t?esc(t):'Sin número guardado'}</span></div></div><div class="ent-c">${t?`<a class="btn sm ok" target="_blank" rel="noopener" href="${wa(t,'Hola '+g[0].comprador)}">WhatsApp</a>`:''}<button class="btn sm alt" onclick="editComp('${k}')">Editar</button><button class="btn sm ghost" onclick="delComp('${k}')">${ic('x')}Eliminar</button></div></div>`}).join('')||'<p class="mut">Aún no hay compradoras. Se agregan solas con tu primera venta.</p>'}</div>`;

/* Corrige el nombre o el WhatsApp de una compradora en todas sus ventas. */

async function editComp(k) {
  const g = S.ventas.filter(v => key(v.comprador) == k);
  if (!g.length) return;
  const n = prompt('Nombre de la compradora:', g[0].comprador);
  if (n === null) return;
  if (!n.trim()) return toast('El nombre no puede quedar vacío');
  const t = prompt('WhatsApp (puede quedar vacío):', g[0].tel || '');
  if (t === null) return;
  for (const v of g) {
    v.comprador = n.trim();
    v.tel = t.trim();
    await put('ventas', v, 1)
  }
  await load();
  toast('Compradora actualizada');
  render()
}

/* Elimina a una compradora (por un error de registro): borra sus ventas y deja sus prendas otra vez disponibles. */

async function delComp(k) {
  const g = S.ventas.filter(v => key(v.comprador) == k);
  if (!g.length) return;
  const pg = g.filter(v => v.pagado).length;
  if (!confirm('¿Eliminar a ' + g[0].comprador + '? Se borrarán sus ' + g.length + ' ventas' + (pg ? ' (incluye ' + pg + ' pagadas)' : '') + ' y las prendas volverán a quedar disponibles.')) return;
  for (const v of g) {
    const p = S.prendas.find(x => x.id == v.prendaId);
    if (p) {
      p.estado = 'disponible';
      delete p.precioRemate;
      await put('prendas', p, 1)
    }
    await del('ventas', v.id)
  }
  toast('Compradora eliminada');
  render()
}
