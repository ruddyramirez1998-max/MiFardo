/* ============================================================
   MiFardo · Pantalla de acceso
   Inicio de sesión, bloqueo automático y cambio de contraseña.
   ============================================================ */
'use strict';

const menu = () => FFAuth.esAdmin() ? M.concat([['admin', 'Administración', 'shield']]) : M;

function showLogin(msg) {
  const L = $('#lock'), u = localStorage.ff_user || '';
  msg = msg || sessionStorage.ff_msg || '';
  sessionStorage.removeItem('ff_msg');
  L.classList.add('on');
  document.body.classList.add('locked');
  L.innerHTML = `<form class="lk" onsubmit="doLogin(event);return false"><img src="icons/logo.png" alt="MiFardo"><h1>Bienvenida</h1><p class="mut">Ingresa con tu usuario y tu contraseña.</p>
<label for="au">Usuario</label><input id="au" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(u)}"><label for="ap">Contraseña</label><input id="ap" type="password" autocomplete="current-password">
<label class="chk"><input type="checkbox" onchange="$('#ap').type=this.checked?'text':'password'">Mostrar contraseña</label><p id="ae" class="err" role="alert">${esc(msg)}</p><button class="btn big" type="submit" id="lb">Entrar</button>
<p class="mut" style="margin-top:14px">¿Olvidaste tu contraseña? Pídele una nueva a quien te entregó la app.</p></form>`;
  setTimeout(() => $(u ? '#ap' : '#au').focus(), 50)
}

async function doLogin(e) {
  e.preventDefault();
  const b = $('#lb'), er = $('#ae');
  er.textContent = '';
  b.disabled = true;
  b.textContent = 'Verificando...';
  try {
    const p = await FFAuth.iniciar($('#au').value.trim(), $('#ap').value);
    localStorage.ff_user = p.visible;
    if (DB && PU == p.id) enter();
    else if (DB) location.reload();
    else await arrancar(p)
  } catch (x) {
    er.textContent = x.message;
    b.disabled = false;
    b.textContent = 'Entrar'
  }
}

function enter() {
  sessionStorage.ff_ok = '1';
  const L = $('#lock');
  L.classList.remove('on');
  L.innerHTML = '';
  document.body.classList.remove('locked');
  render()
}

function lockNow() {
  closeSheet();
  sessionStorage.removeItem('ff_ok');
  $('#main').innerHTML = '';
  showLogin('Sesión bloqueada. Ingresa tu contraseña para continuar.')
}

function chPass() {
  sheet(`<h2>Cambiar contraseña</h2><label for="c0">Contraseña actual</label><input id="c0" type="password" autocomplete="current-password"><label for="c1">Nueva contraseña (mínimo 6 caracteres)</label><input id="c1" type="password" autocomplete="new-password"><label for="c2">Repite la nueva</label><input id="c2" type="password" autocomplete="new-password"><p id="ce" class="err" role="alert"></p><button class="btn big" onclick="doCh()">Guardar</button><button class="btn ghost big" style="margin-top:8px" onclick="closeSheet()">Cancelar</button>`)
}

async function doCh() {
  const a = $('#c0').value, n = $('#c1').value, er = $('#ce');
  if (n.length < 6) return er.textContent = 'La nueva necesita al menos 6 caracteres.';
  if (n != $('#c2').value) return er.textContent = 'Las contraseñas no coinciden.';
  try {
    await FFAuth.cambiarClave(a, n);
    closeSheet();
    toast('Contraseña cambiada')
  } catch (x) {
    er.textContent = x.message
  }
}
let hid = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hid = Date.now();
  else if (sessionStorage.ff_ok && hid) {
    const m = +(localStorage.ff_lockmin ?? 10);
    if (m > 0 && Date.now() - hid > m * 60000) lockNow();
    hid = 0
  }
});
