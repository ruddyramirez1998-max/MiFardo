/* ============================================================
   MiFardo · Arranque
   Abre la base local de cada usuaria y arranca la aplicación.
   ============================================================ */
'use strict';

async function arrancar(p) {
  PU = p.id;
  await opn('mifardo-' + p.id);
  await load();
  FFAuth.vigilar(m => {
    sessionStorage.ff_msg = m;
    FFAuth.salir()
  });
  enter()
}

async function FFBoot() {
  $('#lockb').innerHTML = ic('lock');
  'serviceWorker' in navigator && navigator.serviceWorker.register('sw.js?v=2').catch(() => {});
  if (!FFAuth.configurado()) return showLogin('Falta configurar Supabase en js/config.js');
  try {
    const p = await FFAuth.restaurar();
    p ? await arrancar(p) : showLogin()
  } catch (e) {
    showLogin(e.message)
  }
}
addEventListener('DOMContentLoaded', FFBoot);
