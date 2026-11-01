/* ============================================================
   MiFardo · Pagos
   Cobros pendientes por compradora.
   ============================================================ */
'use strict';

R.pagos = () => {
  const g = grupos(S.ventas.filter(v => !v.pagado));
  return `<div class="card"><h2>Por cobrar: ${fmt(sum(S.ventas.filter(v=>!v.pagado),v=>v.precio))}</h2>${g.map(x=>{const t=sum(x,v=>v.precio),k=esc(key(x[0].comprador));return`<div class="ent"><div class="ent-h"><div><b>${esc(x[0].comprador)}</b><span class="mut">${x.length} ${x.length==1?'prenda':'prendas'}${x[0].tel?' · '+esc(x[0].tel):' · sin número'}</span></div><b class="ent-t">${fmt(t)}</b></div><div class="ent-c"><button class="btn sm" onclick="cobrarQR('${k}')">${ic('qr')}Enviar QR</button>${x[0].tel?`<a class="btn sm alt" target="_blank" rel="noopener" href="${wa(x[0].tel,msgC(x))}">${ic('chat')}Recordar</a>`:''}<button class="btn sm ok" onclick="pagarTodo('${k}')">${ic('check')}Cobrado</button></div></div>`}).join('')||'<p class="mut">Sin pagos pendientes. Todo al día.</p>'}</div>`
};

async function pagarTodo(k) {
  for (const v of S.ventas.filter(x => key(x.comprador) == k && !x.pagado)) {
    v.pagado = true;
    v.pagoFecha = Date.now();
    await put('ventas', v, 1)
  }
  await load();
  toast('Pago registrado');
  render()
}
