/* ============================================================
   MiFardo · Prendas
   Listado y edición de prendas de cada fardo.
   ============================================================ */
'use strict';

R.prendas = () => {
  const l = S.prendas.filter(p => (!Q.fv || p.fardoId == Q.fv) && (!Q.fe || p.estado == Q.fe));
  return fsel('fv') + pills('fe', [['', 'Todas'], ['disponible', 'Disponibles'], ['vendida', 'Vendidas'], ['remate', 'Remate']]) + `<div class="ent-c np" style="margin:2px 0 10px"><button class="btn sm alt" onclick="addP()">${ic('plus')}Agregar prenda</button><button class="btn sm" onclick="fotosSeq(Q.fv||fa()?.id)">${ic('camera')}Agregar fotos</button></div><div class="card">${l.map(p=>`<div class="row" onclick="editP(${p.id})" style="cursor:pointer"><div class="th">${p.foto?`<img src="${p.foto}" alt="">`:ic('camera')}</div><b style="flex:none;min-width:36px">#${esc(p.codigo)}</b><div><b>${esc(p.desc)} ${esc(p.talla)}</b><span class="mut">${fmt(p.estado=='remate'?p.precioRemate:p.precio)}</span></div><span class="tag ${p.estado=='vendida'?'ok':p.estado=='remate'?'rm':''}">${p.estado}</span></div>`).join('')||'<p class="mut">Sin prendas en este filtro.</p>'}</div>`
};

async function addP() {
  const f = Q.fv || fa()?.id;
  if (!f) return toast('Crea un fardo primero');
  const n = S.prendas.filter(p => p.fardoId == f).length + 1;
  await put('prendas', { fardoId: +f, codigo: String(n), desc: 'Prenda', talla: '', precio: 0, estado: 'disponible' });
  render()
}
