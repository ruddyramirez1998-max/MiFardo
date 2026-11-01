/* ============================================================
   MiFardo · Pantalla de inicio
   Resumen del día, fardo actual y ventas recientes.
   ============================================================ */
'use strict';

R.dash = () => {
  const hoy = S.ventas.filter(v => sameDay(v.fecha, Date.now())), pend = S.ventas.filter(v => !v.pagado), f = fa();
  const pf = f ? S.prendas.filter(p => p.fardoId == f.id) : [], vn = pf.filter(p => p.estado == 'vendida').length;
  if (!S.fardos.length) return onb();
  return `<h1 class="hello">Hola, vamos a vender.</h1><p class="sub">Tu Live, mejor organizado.</p>
<section class="figure"><div><span class="mut">Vendido hoy</span><b class="num">${fmt(sum(hoy,v=>v.precio))}</b></div>
<dl><div><dt>Prendas hoy</dt><dd>${hoy.length}</dd></div><div><dt>Por cobrar</dt><dd>${fmt(sum(pend,v=>v.precio))}</dd><small class="mut">${new Set(pend.map(v=>key(v.comprador))).size} compradoras</small></div></dl></section>
<a class="btn big" href="#live">${ic('plus')}Registrar venta</a>
<section class="blk"><h2>Tu fardo actual</h2>${f?`<div class="fh"><b>${esc(f.nombre)}</b><span class="mut">${vn} de ${pf.length} vendidas</span></div><div class="bar"><i style="transform:scaleX(${pf.length?vn/pf.length:0})"></i></div><p class="mut">${pf.length-vn} disponibles</p>`:'<p class="mut">Aún no tienes fardos. <a href="#fardos">Crea el primero</a>.</p>'}</section>
<section class="blk"><h2>Ventas recientes</h2><div class="card">${vend().slice(0,6).map(vrow).join('')||'<p class="mut">Aún no hay ventas. Cuando empiece tu Live, aparecerán aquí.</p>'}</div></section>`
};
const vrow = v => `<div class="row">${thumb(v)}<div><b>${esc(v.comprador)}</b><span class="mut">${esc(v.desc)} #${esc(v.codigo)} · ${hm(v.fecha)}</span></div><b style="flex:none">${fmt(v.precio)}</b><button class="tag ${v.pagado?'ok':''}" onclick="pago(${v.id})">${v.pagado?'Pagado':'Pendiente'}</button></div>`;

async function pago(id) {
  const v = S.ventas.find(x => x.id == id);
  v.pagado = !v.pagado;
  v.pagoFecha = v.pagado ? Date.now() : null;
  await put('ventas', v);
  render()
}
