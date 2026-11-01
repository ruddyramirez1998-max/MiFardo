/* ============================================================
   MiFardo · Panel de administración
   ------------------------------------------------------------
   Solo la administradora ve esta sección (no aparece en el menú de las usuarias).
   Aunque alguien forzara la ruta, Supabase rechaza la lectura y las acciones
   si la cuenta no es la administradora.
   ============================================================ */
let USUARIAS = [];   // lista que se muestra en pantalla

R.admin = () => !FFAuth.esAdmin()
  ? '<div class="blk empty"><p>No tienes permiso para ver esta sección.</p></div>'
  : `<div class="card"><h2>Crear acceso para una emprendedora</h2>
<label for="adn">Nombre (opcional)</label><input id="adn" autocomplete="off" placeholder="Ej. Pepito Pérez">
<label for="adu">Usuario</label><input id="adu" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ej. pepito">
<label for="adc">Contraseña (mínimo 6 caracteres)</label><input id="adc" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ej. pepito123">
<button class="btn big" onclick="adminCrear()">${ic('plus')}Crear acceso</button></div>
<div class="card"><h2>Usuarias</h2><div id="alist"><p class="mut">Cargando...</p></div></div>`;

R.admin_i = () => FFAuth.esAdmin() && adminCargar();

async function adminCargar() {
  try { USUARIAS = await FFAuth.listar(); adminPintar(); }
  catch (e) { $('#alist').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

function adminPintar() {
  $('#alist').innerHTML = USUARIAS.map(u => {
    const bloqueada = u.estado !== 'activo';
    return `<div class="ent">
<div class="ent-h"><div><b>${esc(u.nombre || u.usuario)}</b><span class="mut">Usuario: ${esc(u.usuario)}</span>
<span class="mut">${u.accesos} accesos${u.ultimo_acceso ? ' · último ' + hm(u.ultimo_acceso) : ' · aún no ha entrado'}</span></div>
<span class="tag ${bloqueada ? 'rm' : 'ok'}">${bloqueada ? 'Bloqueada' : 'Activa'}</span></div>
<div class="ent-c">
<button class="btn sm ${bloqueada ? 'ok' : 'ghost'}" onclick="adminEstado('${u.id}','${bloqueada ? 'activo' : 'bloqueado'}')">${bloqueada ? 'Activar acceso' : 'Bloquear acceso'}</button>
<button class="btn sm alt" onclick="adminClave('${u.id}')">Nueva contraseña</button>
<button class="btn sm ghost" onclick="adminBorrar('${u.id}')">${ic('x')}Eliminar</button></div></div>`;
  }).join('') || '<p class="mut">Aún no has creado usuarias.</p>';
}

async function adminCrear() {
  const nombre = $('#adn').value.trim(), usuario = $('#adu').value.trim(), clave = $('#adc').value;
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(usuario)) return toast('Usuario: de 3 a 30 letras, números, punto o guion');
  if (clave.length < 6) return toast('La contraseña necesita al menos 6 caracteres');
  try {
    await FFAuth.crear(usuario, clave, nombre);
    ['adn', 'adu', 'adc'].forEach(id => $('#' + id).value = '');
    await adminCargar();
    adminMostrarAcceso('Acceso creado', nombre, usuario, clave);
  } catch (e) { toast(e.message); }
}

// Ventana con el mensaje listo para enviarle a la usuaria (enlace, usuario y contraseña).
function adminMostrarAcceso(titulo, nombre, usuario, clave) {
  const enlace = location.href.replace(/[#?].*$/, '');
  const texto = `Hola${nombre ? ' ' + nombre : ''}, ya puedes usar MiFardo.\nEnlace: ${enlace}\nUsuario: ${usuario.toLowerCase()}\nContraseña: ${clave}`;
  sheet(`<h2>${esc(titulo)}</h2><p class="mut">Envíale estos datos. Por seguridad, la contraseña no se vuelve a mostrar.</p>
<textarea id="adt" rows="6" readonly>${esc(texto)}</textarea>
<button class="btn big" onclick="adminCopiar()">Copiar mensaje</button>
<a class="btn alt big" style="margin-top:8px" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(texto)}">Enviar por WhatsApp</a>
<button class="btn ghost big" style="margin-top:8px" onclick="closeSheet()">Cerrar</button>`);
}

async function adminCopiar() {
  const campo = $('#adt');
  try { await navigator.clipboard.writeText(campo.value); }
  catch (e) { campo.select(); document.execCommand('copy'); }
  toast('Mensaje copiado');
}

async function adminEstado(id, estado) {
  if (estado === 'bloqueado' && !confirm('¿Bloquear el acceso de esta usuaria? Su sesión se cerrará.')) return;
  try { await FFAuth.estado(id, estado); toast(estado === 'activo' ? 'Acceso activado' : 'Acceso bloqueado'); adminCargar(); }
  catch (e) { toast(e.message); }
}

async function adminClave(id) {
  const u = USUARIAS.find(x => x.id === id);
  const clave = prompt('Nueva contraseña para ' + u.usuario + ' (mínimo 6 caracteres):');
  if (!clave) return;
  if (clave.length < 6) return toast('Mínimo 6 caracteres');
  try { await FFAuth.clave(id, clave); adminMostrarAcceso('Contraseña actualizada', u.nombre, u.usuario, clave); }
  catch (e) { toast(e.message); }
}

async function adminBorrar(id) {
  const u = USUARIAS.find(x => x.id === id);
  if (!confirm('¿Eliminar a ' + (u.nombre || u.usuario) + '? Ya no podrá entrar. Sus datos de ventas siguen en su celular.')) return;
  try { await FFAuth.borrar(id); toast('Usuaria eliminada'); adminCargar(); }
  catch (e) { toast(e.message); }
}
