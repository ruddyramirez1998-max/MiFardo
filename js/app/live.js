/* ============================================================
   MiFardo · Ventas en vivo
   Registro rápido de ventas durante la transmisión.
   ============================================================ */
'use strict';

R.live = () => {
  const f = fa();
  if (!f) return empty('Primero crea un fardo para vender en vivo.', 'fardos');
  const av = S.prendas.filter(p => p.fardoId == f.id && p.estado != 'vendida'), hoy = S.ventas.filter(v => v.fardoId == f.id && sameDay(v.fecha, Date.now()));
  return `<div class="card"><select onchange="localStorage.fa=this.value;render()">${S.fardos.map(x=>`<option value="${x.id}" ${x.id==f.id?'selected':''}>${esc(x.nombre)}</option>`).join('')}</select>
<div class="two"><div><label>N° de prenda</label><input id="lc" list="dc" autocomplete="off" oninput="lk()" onkeydown="if(event.key=='Enter')$('#lp').focus()"></div>
<div><label>Precio Bs</label><input id="lp" type="number" inputmode="decimal" onkeydown="if(event.key=='Enter')$('#ln').focus()"></div></div>
<datalist id="dc">${av.map(p=>`<option value="${esc(p.codigo)}">${esc(p.desc)}`).join('')}</datalist><p id="lh" class="mut">&nbsp;</p>
<label>Compradora</label><input id="ln" list="dn" autocomplete="off" oninput="lt()" onkeydown="if(event.key=='Enter')vender()">
<datalist id="dn">${[...new Set(S.ventas.map(v=>v.comprador))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
<label>WhatsApp</label><input id="lw" inputmode="tel" onkeydown="if(event.key=='Enter')vender()">
${qrT()}<button class="btn big" onclick="vender()">${ic('check')}Registrar venta</button></div>
<div class="card"><h2>En este Live: ${hoy.length} prendas · ${fmt(sum(hoy,v=>v.precio))}</h2>${hoy.slice().reverse().slice(0,8).map(vrow).join('')}</div>`
};
R.live_i = () => $('#lc') && $('#lc').focus();

function pr(c) {
  const f = fa();
  return S.prendas.find(p => p.fardoId == f.id && String(p.codigo).toLowerCase() == c.trim().toLowerCase())
}

function lk() {
  const p = pr($('#lc').value);
  $('#lh').innerHTML = (p && p.foto ? `<img class="th s" src="${p.foto}" alt="">` : '') + esc(p ? (p.estado == 'vendida' ? 'Ya fue vendida' : `${p.desc} ${p.talla||''}${p.estado=='remate'?' · REMATE':''}`) : 'Prenda nueva (se creará)');
  if (p && p.estado != 'vendida') $('#lp').value = p.estado == 'remate' && p.precioRemate ? p.precioRemate : p.precio || ''
}

function lt() {
  const v = S.ventas.find(x => key(x.comprador) == key($('#ln').value) && x.tel);
  if (v) $('#lw').value = v.tel
}

async function vender() {
  const f = fa(), c = $('#lc').value.trim(), p = +$('#lp').value, n = $('#ln').value.trim();
  if (!c || !p || !n) return toast('Falta número, precio o compradora');
  let x = pr(c);
  if (x && x.estado == 'vendida') return toast('Esa prenda ya fue vendida');
  if (!x) x = { fardoId: f.id, codigo: c, desc: 'Prenda', talla: '', precio: p };
  x.estado = 'vendida';
  const pid = await put('prendas', x, 1);
  const vo = { fecha: Date.now(), fardoId: f.id, prendaId: pid, codigo: c, desc: x.desc + (x.talla ? ' ' + x.talla : ''), comprador: n, tel: $('#lw').value.trim(), precio: p, pagado: false, entrega: 'pendiente', tipo: 'personal', guia: '' };
  const sq = $('#lq') && $('#lq').checked && cfg().qr;
  await put('ventas', vo);
  if (sq) sendSale(vo);
  toast('Vendida a ' + n);
  render();
  const l = $('#lp');
  if (l) l.value = p;
  $('#lc').focus()
}
