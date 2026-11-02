/* ============================================================
   MiFardo · QR al registrar una venta
   Envío del QR por WhatsApp al registrar una venta (tres modos, ver sendSale).
   ============================================================ */
'use strict';

const MSGV = 'Hola {nombre}, tu prenda #{codigo} ({prenda}) cuesta {monto}. Te comparto mi QR para el pago. ¡Gracias!';
const msgV = v => (cfg().msgV || MSGV).replace('{nombre}', v.comprador).replace('{monto}', fmt(v.precio)).replace('{codigo}', v.codigo).replace('{prenda}', v.desc);
const qrT = () => cfg().qr ? `<label class="chk"><input type="checkbox" id="lq" ${localStorage.ff_autoqr!=='0'?'checked':''} onchange="localStorage.ff_autoqr=this.checked?'1':'0'">Enviar mi QR por WhatsApp al registrar</label>${(modoQR()!=='enlace'||cfg().qrData)?'':'<p class="mut" style="margin:0 0 10px">Tu QR no se pudo leer para el enlace de pago. Revisa <a href="#ajustes">Ajustes</a>.</p>'}` : `<p class="mut" style="margin:6px 0 10px">Sube tu QR en <a href="#ajustes">Ajustes</a> para enviarlo al registrar cada venta.</p>`;

function copyQR() {
  try {
    const p = new Promise(r => {
      const i = new Image();
      i.onload = () => {
        const c = document.createElement('canvas');
        c.width = i.width;
        c.height = i.height;
        c.getContext('2d').drawImage(i, 0, 0);
        c.toBlob(r, 'image/png')
      };
      i.src = cfg().qr
    });
    return navigator.clipboard.write([new ClipboardItem({ 'image/png': p })]).then(() => true, () => false)
  } catch (e) {
    return Promise.resolve(false)
  }
}

function goWA(tel, text) {
  const a = document.createElement('a');
  a.href = wa(tel, text);
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove()
}

/* Modos de envío del QR (se elige en Ajustes):
   - 'pegar' (por defecto): copia la imagen del QR y abre el chat del número con el mensaje; la usuaria
     solo mantiene presionado el mensaje, toca Pegar y envía. Es la única forma de dejar la IMAGEN en el
     chat correcto, porque WhatsApp no permite adjuntar imágenes desde una página web.
   - 'compartir': abre el menú de compartir del celular con la imagen; hay que elegir el contacto.
   - 'enlace': envía un enlace a una página que muestra el QR (no adjunta la imagen). */
const modoQR = () => cfg().modoQR || 'pegar';

// Abre el menú de compartir con la imagen. Devuelve false si el celular no lo permite.
async function compartirImagen(texto) {
  const f = dataFile(cfg().qr, 'qr-cobro.jpg');
  if (!(navigator.canShare && navigator.canShare({ files: [f] }))) return false;
  try { await navigator.share({ files: [f], text: texto }); return true; }
  catch (e) { return e.name == 'AbortError'; }   // si la usuaria cancela no es un error
}

// Copia el QR y abre el chat del número con el mensaje. Devuelve false si no se pudo copiar la imagen.
async function abrirChatConQR(tel, texto) {
  if (!(await copyQR())) return false;
  goWA(tel, texto);
  toast('QR copiado. En WhatsApp mantén presionado el mensaje y toca Pegar');
  return true;
}

// Guía de la primera vez (después ya no se muestra).
function guiaPegar(tel, texto) {
  CB = { tel, texto };
  sheet(`<h2>Cómo se envía tu QR</h2><p>Para que la imagen llegue al chat de la compradora:</p>
<ol><li>Se copia tu QR y se abre su chat de WhatsApp con el mensaje.</li><li>Mantén presionado el cuadro de mensaje y toca <b>Pegar</b>.</li><li>Toca enviar.</li></ol>
<p class="mut">Solo verás esta guía una vez.</p>
<button class="btn big" onclick="iniciarPegar()">Entendido, abrir WhatsApp</button>`);
}
async function iniciarPegar() {
  localStorage.ff_pegar_visto = '1';
  closeSheet();
  if (!(await abrirChatConQR(CB.tel, CB.texto))) {
    if (!(await compartirImagen(CB.texto))) toast('No se pudo copiar la imagen. Usa Pagos > Enviar QR');
  }
}

async function sendSale(v) {
  const c = cfg();
  if (!c.qr) return;
  const texto = msgV(v), modo = modoQR();
  if (modo === 'enlace' && v.tel) {
    const enlace = payLink(v.comprador, v.precio, `#${v.codigo} ${v.desc}`);
    if (enlace) { goWA(v.tel, texto + '\n\nPaga aquí: ' + enlace); return; }
  }
  if (modo === 'pegar' && v.tel) {
    if (!localStorage.ff_pegar_visto) return guiaPegar(v.tel, texto);
    if (await abrirChatConQR(v.tel, texto)) return;
    toast('No se pudo copiar la imagen. Elige el contacto en el menú');
  }
  if (await compartirImagen(texto)) return;
  qrSheet(v.comprador, v.tel, v.precio, texto);
}

const onb = () => `<h1 class="hello">Bienvenida a MiFardo.</h1><p class="sub">Empecemos desde cero. Son tres pasos.</p><div class="card"><div class="step"><b>1</b><div><h2>Crea tu primer fardo</h2><p class="mut">Pon el nombre, lo que costó y cuántas prendas trae.</p></div></div><div class="step"><b>2</b><div><h2>Agrega tu QR de cobro</h2><p class="mut">Súbelo en Ajustes para enviarlo al registrar cada venta.</p></div></div><div class="step"><b>3</b><div><h2>Vende en tu Live</h2><p class="mut">Registra número, precio y compradora. Lo demás se organiza solo.</p></div></div></div><a class="btn big" href="#fardos">${ic('box')}Crear mi primer fardo</a>`;

async function resetData() {
  if (prompt('Se borrarán fardos, prendas, ventas y gastos. Escribe BORRAR para confirmar:') !== 'BORRAR') return;
  for (const s of ['fardos', 'prendas', 'ventas', 'gastos']) await tx(s, 'readwrite', o => o.clear());
  localStorage.removeItem('fa');
  await load();
  toast('Listo, empiezas desde cero');
  render()
}
