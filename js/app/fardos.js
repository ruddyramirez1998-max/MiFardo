/* ============================================================
   MiFardo · Fardos
   Creación, edición y eliminación de fardos.
   ============================================================ */
'use strict';

R.fardos = () => `<div class="card"><h2>Nuevo fardo</h2><input id="fn" placeholder="Nombre (ej. Fardo N° 01)"><div class="two"><input id="fc" type="number" placeholder="Costo Bs"><input id="fq" type="number" placeholder="Cantidad prendas"></div><div class="two"><input id="fd" type="date" value="${new Date().toISOString().slice(0,10)}"><input id="fp" type="number" placeholder="Precio base Bs"></div><button class="btn big" onclick="addF()">Crear fardo</button></div>` + S.fardos.map(f => {
  const p = S.prendas.filter(x => x.fardoId == f.id), v = p.filter(x => x.estado == 'vendida').length;
  return `<div class="card"><b>${esc(f.nombre)}</b> ${f.id==fa()?.id?'<span class="tag ok">En uso</span>':''}<p class="mut">${f.fecha} · Costo ${fmt(f.costo)} · ${v}/${p.length} vendidas · ${p.filter(x=>x.foto).length} con foto</p><div class="bar"><i style="transform:scaleX(${p.length?v/p.length:0})"></i></div><br><button class="btn sm" onclick="localStorage.fa=${f.id};toast('Fardo activo');render()">Usar en Live</button> <button class="btn sm alt" onclick="fotosSeq(${f.id})">${ic('camera')}Fotos</button> <button class="btn sm alt" onclick="editF(${f.id})">Editar costo</button> <button class="btn sm ghost" onclick="delF(${f.id})">Eliminar</button></div>`
}).join('');

async function addF() {
  const n = $('#fn').value.trim(), q = +$('#fq').value;
  if (!n || !q) return toast('Pon nombre y cantidad');
  const id = await put('fardos', { nombre: n, costo: +$('#fc').value || 0, fecha: $('#fd').value, cantidad: q }, 1);
  for (let i = 1; i <= q; i++) await put('prendas', { fardoId: id, codigo: String(i), desc: 'Prenda', talla: '', precio: +$('#fp').value || 0, estado: 'disponible' }, 1);
  await load();
  localStorage.fa = id;
  render();
  sheet(`<h2>Fardo creado</h2><p>Se crearon ${q} prendas. ¿Quieres agregar la foto de cada una ahora? Puedes hacerlo luego desde Fardos o Prendas.</p><br><button class="btn big" onclick="closeSheet();fotosSeq(${id})">${ic('camera')}Agregar fotos ahora</button><button class="btn ghost big" style="margin-top:8px" onclick="closeSheet()">Después</button>`)
}

async function editF(id) {
  const f = S.fardos.find(x => x.id == id), c = prompt('Costo del fardo (Bs):', f.costo);
  if (c === null) return;
  f.costo = +c || 0;
  await put('fardos', f);
  render()
}

async function delF(id) {
  if (!confirm('Se borrarán el fardo, sus prendas y ventas.')) return;
  for (const p of S.prendas.filter(x => x.fardoId == id)) await del('prendas', p.id);
  for (const v of S.ventas.filter(x => x.fardoId == id)) await del('ventas', v.id);
  await del('fardos', id);
  render()
}
