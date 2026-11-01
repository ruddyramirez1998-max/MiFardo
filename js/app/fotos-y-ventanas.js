/* ============================================================
   MiFardo · Fotos y ventanas emergentes
   Fotos de prendas, ventana inferior (sheet) y mensajes de cobro.
   ============================================================ */
'use strict';

const thumb = v => {
  const p = S.prendas.find(x => x.id == v.prendaId);
  return p && p.foto ? `<img class="th" src="${p.foto}" alt="">` : ''
};
let SH = {}, CB = {};
const MSG = 'Hola {nombre}, tu pedido de {prendas} prenda(s) suma {monto}. Te comparto mi QR para el pago. ¡Gracias!';
const cfg = () => S.config.find(x => x.id == 1) || { id: 1 }, setCfg = o => put('config', { ...cfg(), ...o, id: 1 });
const msgC = x => (cfg().msg || MSG).replace('{nombre}', x[0].comprador).replace('{monto}', fmt(sum(x, v => v.precio))).replace('{prendas}', x.length);
const sheet = h => {
  $('#sheet').innerHTML = `<div class="sb" onclick="closeSheet()"></div><div class="sp" role="dialog" aria-modal="true">${h}</div>`;
  $('#sheet').classList.add('on');
  document.body.classList.add('locked')
};
const closeSheet = () => {
  $('#sheet').classList.remove('on');
  $('#sheet').innerHTML = '';
  document.body.classList.remove('locked')
};

async function comp(f, max, q) {
  let b;
  try {
    b = await createImageBitmap(f, { imageOrientation: 'from-image' })
  } catch (e) {
    b = await new Promise((r, j) => {
      const i = new Image();
      i.onload = () => r(i);
      i.onerror = j;
      i.src = URL.createObjectURL(f)
    })
  }
  const w = b.width || b.naturalWidth, h = b.height || b.naturalHeight, k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q)
}
const phH = f => f ? `<img src="${f}" alt="Foto de la prenda">` : `<div class="ph-e">${ic('camera')}<span>Sin foto</span></div>`;

function editP(id, seq) {
  const p = S.prendas.find(x => x.id == id);
  SH = { id, seq, foto: p.foto || '' };
  sheet(`<h2>Prenda #${esc(p.codigo)}</h2><div class="ph" id="php">${phH(SH.foto)}</div><div class="ent-c"><label class="btn alt sm">${ic('camera')}Cámara<input type="file" accept="image/*" capture="environment" hidden onchange="pickF(this)"></label><label class="btn alt sm">${ic('image')}Galería<input type="file" accept="image/*" hidden onchange="pickF(this)"></label><button class="btn ghost sm" onclick="SH.foto='';$('#php').innerHTML=phH('')">Quitar</button></div>
<label>Descripción</label><input id="ed" value="${esc(p.desc)}"><div class="two"><div><label>Talla</label><input id="et" value="${esc(p.talla)}"></div><div><label>Precio Bs</label><input id="ep" type="number" inputmode="decimal" value="${p.precio||''}"></div></div>
<button class="btn big" onclick="saveP()">${seq?'Guardar y siguiente':'Guardar'}</button><div class="ent-c" style="margin-top:8px">${seq?'<button class="btn ghost" onclick="nextP(S.prendas.find(x=>x.id==SH.id))">Saltar</button>':''}<button class="btn ghost" onclick="closeSheet()">${seq?'Terminar':'Cancelar'}</button></div>`)
}

async function pickF(i) {
  const f = i.files[0];
  if (!f) return;
  try {
    SH.foto = await comp(f, 640,.72);
    $('#php').innerHTML = phH(SH.foto)
  } catch (e) {
    toast('No se pudo leer la imagen')
  }
  i.value = ''
}

async function saveP() {
  const p = S.prendas.find(x => x.id == SH.id);
  p.desc = $('#ed').value.trim() || 'Prenda';
  p.talla = $('#et').value.trim();
  p.precio = +$('#ep').value || 0;
  p.foto = SH.foto || '';
  await put('prendas', p);
  const q = SH.seq;
  closeSheet();
  render();
  if (q) nextP(p);
  else toast('Guardado')
}

function nextP(f) {
  const l = S.prendas.filter(x => x.fardoId == f.fardoId && !x.foto && x.id != f.id), n = l.find(x => x.id > f.id) || l[0];
  if (n) editP(n.id, true);
  else {
    closeSheet();
    toast('Todas las prendas tienen foto')
  }
}

function fotosSeq(fid) {
  if (!fid) return toast('Crea un fardo primero');
  const p = S.prendas.find(x => x.fardoId == fid && !x.foto);
  p ? editP(p.id, true) : toast('Todas las prendas ya tienen foto')
}
