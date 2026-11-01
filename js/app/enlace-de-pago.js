/* ============================================================
   MiFardo · Enlace de pago
   Lectura del QR y creación del enlace de pago.
   ============================================================ */
'use strict';

const lib = (u, ok) => new Promise((res, rej) => {
  let i = 0;
  const t = () => {
    if (ok()) return res();
    if (i >= u.length) return rej(new Error('lib'));
    const e = document.createElement('script');
    e.src = u[i++];
    e.onload = () => ok() ? res() : t();
    e.onerror = t;
    document.head.appendChild(e)
  };
  t()
});

async function decodeQR(u) {
  try {
    await lib(['https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js', 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'], () => window.jsQR)
  } catch (e) {
    return null
  }
  const im = await new Promise(r => {
    const i = new Image();
    i.onload = () => r(i);
    i.onerror = () => r(null);
    i.src = u
  });
  if (!im) return '';
  for (const m of [1000, 700, 1400]) {
    const k = m / Math.max(im.width, im.height), c = document.createElement('canvas');
    c.width = Math.round(im.width * k);
    c.height = Math.round(im.height * k);
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), r = jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
    if (r && r.data) return r.data
  }
  return ''
}
const payLink = (n, m, c) => {
  const g = cfg();
  if (!g.qrData) return '';
  return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'pago.html#' + new URLSearchParams({ p: g.qrData, n, m: fmt(m), c, b: g.negocio || '' })
};
