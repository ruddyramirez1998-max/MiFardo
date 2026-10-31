/* Panel de administración. Solo aparece en el menú si el perfil tiene rol "admin".
   Aunque alguien forzara la ruta, Supabase rechaza la lectura y las acciones si no es admin. */
let ADM = [];

R.admin = () => !FFAuth.esAdmin()
  ? '<div class="blk empty"><p>No tienes permiso para ver esta sección.</p></div>'
  : `<div class="card"><h2>Crear acceso para una emprendedora</h2>
<label for="adn">Nombre</label><input id="adn" autocomplete="off">
<label for="ade">Correo</label><input id="ade" type="email" autocapitalize="none" autocomplete="off">
<label for="adc">Contraseña inicial (mínimo 8 caracteres)</label><input id="adc" autocomplete="off">
<button class="btn big" onclick="adminCrear()">${ic('plus')}Crear acceso</button></div>
<div class="card"><h2>Usuarias</h2><div id="alist"><p class="mut">Cargando...</p></div></div>`;
R.admin_i = () => FFAuth.esAdmin() && adminCargar();

async function adminCargar() {
  try { ADM = await FFAuth.listar(); adminPintar(); }
  catch (e) { $('#alist').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

function adminPintar() {
  const yo = FFAuth.perfil().id;
  $('#alist').innerHTML = ADM.map(u => {
    const bl = u.estado !== 'activo';
    return `<div class="ent"><div class="ent-h"><div><b>${esc(u.nombre || u.email)}</b><span class="mut">${esc(u.email)}${u.rol === 'admin' ? ' · administrador' : ''}</span>
<span class="mut">${u.accesos} accesos${u.ultimo_acceso ? ' · último ' + hm(u.ultimo_acceso) : ''}</span></div>
<span class="tag ${bl ? 'rm' : 'ok'}">${bl ? 'Bloqueada' : 'Activa'}</span></div>
${u.id === yo ? '' : `<div class="ent-c"><button class="btn sm ${bl ? 'ok' : 'ghost'}" onclick="adminEstado('${u.id}','${bl ? 'activo' : 'bloqueado'}')">${bl ? 'Activar acceso' : 'Bloquear acceso'}</button>
</div>`}</div>`;
  }).join('') || '<p class="mut">Aún no hay usuarias.</p>';
}

async function adminCrear() {
  const n = $('#adn').value.trim(), e = $('#ade').value.trim(), c = $('#adc').value;
  if (!/^\S+@\S+\.\S+$/.test(e)) return toast('Escribe un correo válido');
  if (c.length < 8) return toast('La contraseña necesita al menos 8 caracteres');
  try { const r = await FFAuth.crear(e, c, n); toast(r.pideConfirmar ? 'Creada, pero Supabase pide confirmar el correo: desactiva Confirm email' : 'Acceso creado. Entrega el correo y la contraseña a la usuaria'); ['adn', 'ade', 'adc'].forEach(i => $('#' + i).value = ''); adminCargar(); }
  catch (x) { toast(x.message); }
}
async function adminEstado(id, estado) {
  if (estado === 'bloqueado' && !confirm('¿Bloquear el acceso de esta usuaria?')) return;
  try { await FFAuth.estado(id, estado); toast(estado === 'activo' ? 'Acceso activado' : 'Acceso bloqueado'); adminCargar(); }
  catch (x) { toast(x.message); }
}
