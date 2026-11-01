/* ============================================================
   MiFardo · Etiquetas
   Etiquetas imprimibles para cada pedido.
   ============================================================ */
'use strict';

R.etiquetas = () => {
  const g = grupos(S.ventas.filter(v => v.entrega != 'entregado'));
  return `<button class="btn big np" onclick="print()">${ic('print')}Imprimir etiquetas</button>${g.map(x=>`<div class="lbl"><h3>${esc(x[0].comprador)}</h3><p>${esc(x[0].tel||'')} · ${x[0].tipo=='paqueteria'?'Paquetería '+esc(x[0].guia):'Entrega personal'}</p><p>${x.map(v=>'#'+esc(v.codigo)+' '+esc(v.desc)).join(', ')}</p><b>${fmt(sum(x,v=>v.precio))} · ${x.every(v=>v.pagado)?'PAGADO':'POR COBRAR'}</b></div>`).join('')||'<p class="mut">No hay pedidos pendientes.</p>'}`
};
