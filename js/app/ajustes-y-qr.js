/* ============================================================
   MiFardo · QR de cobro y Ajustes
   Guardar el QR, compartirlo y la pantalla de Ajustes.
   ============================================================ */
'use strict';

function dataFile(u, n) {
  const [h, b] = u.split(','), m = /:(.*?);/.exec(h)[1], t = atob(b), a = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i);
  return new File([a], n, { type: m })
}

function qrSheet(nombre, tel, total, msg, link) {
  CB = { tel, link };
  const c = cfg();
  sheet(`<h2>Cobrar a ${esc(nombre)}</h2><p class="mut">${tel?'WhatsApp guardado: '+esc(tel):'No hay número guardado'} · Total ${fmt(total)}</p><div class="qrp"><img src="${c.qr}" alt="Tu QR de cobro"></div><label>Mensaje</label><textarea id="cm" rows="3">${esc(msg)}</textarea><button class="btn big" onclick="shareQR()">${ic('share')}Compartir QR</button>${tel?`<button class="btn alt big" style="margin-top:8px" onclick="openChat()">${ic('chat')}Abrir chat con este número</button>`:''}<p class="mut" style="margin-top:10px">Al compartir, elige WhatsApp y busca a ${esc(nombre)}. WhatsApp no permite elegir el contacto de forma automática.</p>`)
}

function cobrarQR(k) {
  const x = S.ventas.filter(v => key(v.comprador) == k && !v.pagado);
  if (!x.length) return;
  if (!cfg().qr) {
    toast('Primero sube tu QR en Ajustes');
    location.hash = '#ajustes';
    return
  }
  const tt = sum(x, v => v.precio);
  qrSheet(x[0].comprador, x[0].tel, tt, msgC(x), payLink(x[0].comprador, tt, x.length + ' prenda(s)'))
}

function openChat() {
  const t = $('#cm').value;
  window.open(wa(CB.tel, CB.link ? t + '\n\nPaga aquí: ' + CB.link : qrMsg(t)), '_blank')
}

async function shareQR() {
  const f = dataFile(cfg().qr, 'qr-cobro.jpg'), t = $('#cm').value;
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try {
      await navigator.share({ files: [f], text: t });
      return
    } catch (e) {
      if (e.name == 'AbortError') return
    }
  }
  const a = document.createElement('a');
  a.href = cfg().qr;
  a.download = 'qr-cobro.jpg';
  a.click();
  toast('Imagen descargada. Adjúntala en el chat')
}

async function upQR(i) {
  const f = i.files[0];
  if (!f) return;
  try {
    const q = await comp(f, 1000,.92);
    await setCfg({ qr: q, qrData: '' });
    toast('Leyendo tu QR...');
    const d = await decodeQR(q);
    await setCfg({ qrData: d || '' });
    toast(d ? 'QR listo. Se enviará como enlace de pago' : d === null ? 'Sin internet: no se pudo leer el QR' : 'No se pudo leer el QR. Sube una foto más nítida');
    render()
  } catch (e) {
    toast('No se pudo leer la imagen')
  }
}

async function scanQR() {
  const q = cfg().qr;
  if (!q) return;
  toast('Leyendo tu QR...');
  const d = await decodeQR(q);
  await setCfg({ qrData: d || '' });
  toast(d ? 'QR leído correctamente' : 'No se pudo leer el QR');
  render()
}

function prevPago() {
  const l = payLink('María Pérez', 120, '#12 Casaca jean');
  if (!l) return toast('Sube tu QR y espera a que se lea');
  window.open(l, '_blank')
}

async function rmQR() {
  if (confirm('¿Quitar el QR guardado?')) {
    await setCfg({ qr: '', qrData: '' });
    render()
  }
}

async function saveMsg() {
  await setCfg({ msg: $('#qm').value.trim() || MSG, msgV: $('#qv').value.trim() || MSGV, negocio: ($('#qb')?.value || '').trim() });
  toast('Cambios guardados');
  render()
}
R.ajustes = () => {
  const sug = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'qr.jpg', c = cfg(), a = { u: FFAuth.identificador() }, lm = localStorage.ff_lockmin ?? '10';
  return `<div class="card"><h2>QR de cobro</h2><p class="mut">Sube la imagen de tu QR. Luego podrás enviarla a cada compradora desde Pagos.</p><div class="qrp">${c.qr?`<img src="${c.qr}" alt="Tu QR de cobro">`:`<div class="ph-e">${ic('qr')}<span>Aún no subes tu QR</span></div>`}</div><div class="ent-c"><label class="btn ${c.qr?'alt':''}">${ic('up')}${c.qr?'Cambiar imagen':'Subir imagen del QR'}<input type="file" accept="image/*" hidden onchange="upQR(this)"></label>${c.qr?'<button class="btn ghost" onclick="rmQR()">Quitar</button>':''}</div>
<p class="mut" id="qs" role="status">${c.qrData?'QR leído correctamente: se enviará como enlace de pago.':c.qr?'No se pudo leer este QR: se copiará la imagen para pegarla en el chat.':''}</p>${c.qr&&!c.qrData?'<button class="btn alt sm" onclick="scanQR()">Leer QR de nuevo</button>':''}
<label for="qb">Nombre de tu negocio (lo verá tu compradora)</label><input id="qb" value="${esc(c.negocio||'')}" placeholder="Ej. Ropa Americana Ruddy"><button class="btn alt sm" onclick="prevPago()">Ver cómo lo recibe tu compradora</button>
<label for="qv">Mensaje al registrar una venta</label><textarea id="qv" rows="3">${esc(c.msgV||MSGV)}</textarea><p class="mut">Usa {nombre}, {monto}, {codigo} y {prenda}.</p><label for="qm">Mensaje al cobrar desde Pagos</label><textarea id="qm" rows="3">${esc(c.msg||MSG)}</textarea><p class="mut">Usa {nombre}, {monto} y {prendas}.</p><button class="btn alt" style="margin-top:8px" onclick="saveMsg()">Guardar cambios</button></div>
<div class="card"><h2>Seguridad</h2><p class="mut">Usuario: ${esc(a.u)}</p><label for="lm">Bloquear automáticamente</label><select id="lm" onchange="localStorage.ff_lockmin=this.value;toast('Guardado')">${[['1','Después de 1 minuto fuera de la app'],['5','Después de 5 minutos'],['15','Después de 15 minutos'],['60','Después de 1 hora'],['0','Solo al cerrar la app']].map(o=>`<option value="${o[0]}" ${lm==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
<div class="ent-c"><button class="btn alt" onclick="chPass()">Cambiar contraseña</button><button class="btn ghost" onclick="lockNow()">${ic('lock')}Bloquear ahora</button><button class="btn ghost" onclick="FFAuth.salir()">Cerrar sesión</button></div></div><div class="card"><h2>Empezar de cero</h2><p class="mut">Borra fardos, prendas, ventas y gastos de este celular. Se conservan tu acceso y tu QR. Exporta un respaldo antes si lo necesitas.</p><button class="btn ghost" onclick="resetData()">Borrar todos los datos</button></div>`
};
