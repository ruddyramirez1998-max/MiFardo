/* ============================================================
   MiFardo · QR al registrar una venta
   Envío del enlace de pago por WhatsApp al vender.
   ============================================================ */
'use strict';

const MSGV = 'Hola {nombre}, tu prenda #{codigo} ({prenda}) cuesta {monto}. Te comparto mi QR para el pago. ¡Gracias!';
const msgV = v => (cfg().msgV || MSGV).replace('{nombre}', v.comprador).replace('{monto}', fmt(v.precio)).replace('{codigo}', v.codigo).replace('{prenda}', v.desc);
const qrT = () => cfg().qr ? `<label class="chk"><input type="checkbox" id="lq" ${localStorage.ff_autoqr!=='0'?'checked':''} onchange="localStorage.ff_autoqr=this.checked?'1':'0'">Enviar mi QR por WhatsApp al registrar</label>${cfg().qrData?'':'<p class="mut" style="margin:0 0 10px">Tu QR no se pudo leer: se copiará la imagen para pegarla en el chat. Revisa <a href="#ajustes">Ajustes</a>.</p>'}` : `<p class="mut" style="margin:6px 0 10px">Sube tu QR en <a href="#ajustes">Ajustes</a> para enviarlo al registrar cada venta.</p>`;
const qrMsg = t => t + (cfg().qrUrl ? '\n\n' + cfg().qrUrl : '');

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

async function sendSale(v) {
  const c = cfg();
  if (!c.qr) return;
  const t = msgV(v), l = payLink(v.comprador, v.precio, `#${v.codigo} ${v.desc}`);
  if (!c.negocio) toast('Tip: agrega el nombre de tu negocio en Ajustes');
  if (v.tel) {
    if (l) {
      goWA(v.tel, t + '\n\nPaga aquí: ' + l);
      return
    }
    copyQR();
    goWA(v.tel, qrMsg(t));
    return
  }
  const f = dataFile(c.qr, 'qr-cobro.jpg');
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try {
      await navigator.share({ files: [f], text: t });
      return
    } catch (e) {
      if (e.name == 'AbortError') return
    }
  }
  qrSheet(v.comprador, v.tel, v.precio, t, l)
}

function dlQR() {
  if (!cfg().qr) return toast('Primero sube tu QR');
  const a = document.createElement('a');
  a.href = cfg().qr;
  a.download = 'qr.jpg';
  a.click()
}

function chkQR() {
  const u = $('#qu').value.trim(), st = $('#qs');
  if (!u) return st.textContent = 'Escribe el enlace primero.';
  st.textContent = 'Verificando...';
  const i = new Image();
  i.onload = () => st.textContent = 'El enlace funciona. El QR se verá en el chat.';
  i.onerror = () => st.textContent = 'No se encontró la imagen. Revisa que subiste qr.jpg a GitHub y espera 1 o 2 minutos.';
  i.src = u + (u.includes('?') ? '&' : '?') + 't=' + Date.now()
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
