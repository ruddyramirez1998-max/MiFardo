/* ============================================================
   MiFardo · Remate
   Descuentos para prendas no vendidas.
   ============================================================ */
'use strict';

R.remate = () => {
  const l = S.prendas.filter(p => p.estado != 'vendida' && (!Q.fv || p.fardoId == Q.fv));
  return fsel('fv') + `<div class="card"><h2>Remate masivo</h2><div class="two"><input id="rd" type="number" placeholder="% descuento"><button class="btn" onclick="rem()">Pasar a remate</button></div><p class="mut">Aplica a las prendas disponibles mostradas.</p></div><div class="card">${l.map(p=>`<div class="row">${p.foto?`<img class="th" src="${p.foto}" alt="">`:''}<b style="flex:none;width:44px">#${esc(p.codigo)}</b><div><b>${esc(p.desc)} ${esc(p.talla)}</b><span class="mut">${fmt(p.precio)}${p.estado=='remate'?' → '+fmt(p.precioRemate):''}</span></div><button class="btn sm alt" onclick="remP(${p.id})">Precio</button></div>`).join('')||'<p class="mut">Sin prendas disponibles.</p>'}</div>`
};

async function rem() {
  const d = +$('#rd').value;
  if (!d) return toast('Pon el % de descuento');
  for (const p of S.prendas.filter(p => p.estado != 'vendida' && (!Q.fv || p.fardoId == Q.fv))) {
    p.estado = 'remate';
    p.precioRemate = Math.round(p.precio * (1 - d / 100));
    await put('prendas', p, 1)
  }
  await load();
  toast('Remate aplicado');
  render()
}

async function remP(id) {
  const p = S.prendas.find(x => x.id == id), n = prompt('Precio de remate Bs:', p.precioRemate || p.precio);
  if (n === null) return;
  p.precioRemate = +n;
  p.estado = 'remate';
  await put('prendas', p);
  render()
}
