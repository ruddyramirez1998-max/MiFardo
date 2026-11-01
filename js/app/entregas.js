/* ============================================================
   MiFardo · Entregas
   Pedidos por entregar: personal o paquetería.
   ============================================================ */
'use strict';

R.entregas = () => {
  const g = grupos(S.ventas.filter(v => v.entrega != 'entregado'));
  return `<div class="card"><h2>Por entregar: ${g.length} ${g.length==1?'pedido':'pedidos'}</h2>${g.map(x=>{const k=esc(key(x[0].comprador)),pag=x.every(v=>v.pagado),paq=x[0].tipo=='paqueteria';return`<div class="ent"><div class="ent-h"><div><b>${esc(x[0].comprador)}</b><span class="mut">${x.length} ${x.length==1?'prenda':'prendas'} · ${pag?'Pagado':'Falta pago'}${paq&&x[0].guia?' · Guía '+esc(x[0].guia):''}</span></div><b class="ent-t">${fmt(sum(x,v=>v.precio))}</b></div><div class="ent-c"><select aria-label="Tipo de entrega" onchange="entr('${k}',{tipo:this.value})"><option value="personal" ${!paq?'selected':''}>Entrega personal</option><option value="paqueteria" ${paq?'selected':''}>Envío por paquetería</option></select>${paq?`<button class="btn sm ghost" onclick="guia('${k}')">${x[0].guia?'Cambiar guía':'Agregar guía'}</button>`:''}<button class="btn sm ok" onclick="entr('${k}',{entrega:'entregado'})">${ic('check')}Entregado</button></div></div>`}).join('')||'<p class="mut">Todo entregado.</p>'}</div>`
};

async function entr(k, o) {
  for (const v of S.ventas.filter(x => key(x.comprador) == k && x.entrega != 'entregado')) {
    Object.assign(v, o);
    await put('ventas', v, 1)
  }
  await load();
  render()
}

function guia(k) {
  const g = prompt('N° de guía / paquetería:');
  if (g) entr(k, { guia: g })
}
