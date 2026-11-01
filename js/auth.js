/* ============================================================
   MiFardo · Autenticación y control de acceso
   ------------------------------------------------------------
   Hay dos tipos de cuenta:
   - ADMINISTRADORA (una sola): entra con su correo y contraseña (Supabase Auth).
   - USUARIAS: entran con "usuario" y "contraseña" que crea la administradora.
     No usan correo: sus credenciales viven en la tabla "usuarias" y se validan
     con funciones SQL (ver supabase/schema.sql).

   Expone el objeto global FFAuth. La seguridad real está en Supabase (RLS y
   funciones SQL); ocultar o mostrar botones en pantalla es solo comodidad.
   ============================================================ */
const FFAuth = (() => {
  const C = window.FF_CONFIG || {};
  const MSG_BLOQUEADO = 'Tu acceso está suspendido. Contacta a tu administrador.';
  const MSG_SESION = 'Tu sesión venció. Ingresa de nuevo.';
  const MENSAJES_LOGIN = {
    credenciales: 'Usuario o contraseña incorrectos.',
    espera: 'Demasiados intentos. Intenta de nuevo en 10 minutos.',
    bloqueada: MSG_BLOQUEADO
  };

  let sb = null;      // cliente de Supabase (se crea la primera vez que se usa)
  let perfil = null;  // { id, visible, nombre, rol: 'admin' | 'usuaria' }

  /* ---------- Utilidades ---------- */
  const configurado = () =>
    !!C.SUPABASE_URL && !/TU-PROYECTO/.test(C.SUPABASE_URL) &&
    !!C.SUPABASE_ANON_KEY && !/TU_ANON/.test(C.SUPABASE_ANON_KEY);

  const cliente = () => sb || (sb = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }));

  // ¿El error se debe a que no hay internet (y no a credenciales incorrectas)?
  const sinRed = e => !navigator.onLine || typeof supabase === 'undefined' ||
    e?.name === 'AuthRetryableFetchError' || /fetch|network|load failed/i.test(e?.message || '');

  // Tipo de sesión activa en este celular.
  const tipo = () => (localStorage.ff_token ? 'usuaria' : 'admin');

  function guardarPerfil(p) {
    perfil = p;
    localStorage.ff_perfil = JSON.stringify(p);   // copia para poder abrir sin internet un tiempo limitado
    localStorage.ff_lastok = Date.now();
    return p;
  }

  /* ---------- Administradora (Supabase Auth) ---------- */
  async function validarAdmin(contar) {
    const c = cliente();
    const r = await c.auth.getUser();
    if (r.error) {
      if (sinRed(r.error) || r.error.status >= 500) throw r.error;
      throw new Error(MSG_SESION);
    }
    const { data, error } = await c.from('profiles').select('*').eq('id', r.data.user.id).maybeSingle();
    if (error) throw error;
    if (!data || data.rol !== 'admin' || data.estado !== 'activo') {
      await c.auth.signOut();
      throw new Error('Esta cuenta no tiene acceso. Ingresa con tu usuario y contraseña.');
    }
    let p = data;
    if (contar && !sessionStorage.ff_counted) {          // un acceso por cada vez que se abre la app
      const a = await c.rpc('registrar_acceso');
      if (!a.error && a.data) { p = a.data; sessionStorage.ff_counted = '1'; }
    }
    return guardarPerfil({ id: p.id, visible: p.email, nombre: p.nombre || '', rol: 'admin' });
  }

  async function iniciarAdmin(correo, clave) {
    localStorage.removeItem('ff_token');
    const { error } = await cliente().auth.signInWithPassword({ email: correo, password: clave });
    if (error) {
      if (/invalid login/i.test(error.message)) throw new Error('Usuario o contraseña incorrectos.');
      throw error;
    }
    return validarAdmin(true);
  }

  /* ---------- Usuarias (usuario y contraseña) ---------- */
  async function iniciarUsuaria(usuario, clave) {
    try { await cliente().auth.signOut({ scope: 'local' }); } catch (e) { /* no había sesión de administradora */ }
    const { data, error } = await cliente().rpc('usuaria_login', { p_usuario: usuario, p_clave: clave });
    if (error) throw error;
    if (!data.ok) throw new Error(MENSAJES_LOGIN[data.error] || 'No se pudo iniciar sesión.');
    localStorage.ff_token = data.token;
    sessionStorage.ff_counted = '1';                     // el inicio de sesión ya sumó un acceso
    return guardarPerfil({ id: data.id, visible: data.usuario, nombre: data.nombre || '', rol: 'usuaria' });
  }

  async function validarUsuaria(contar) {
    const token = localStorage.ff_token;
    if (!token) throw new Error(MSG_SESION);
    const { data, error } = await cliente().rpc('usuaria_verificar',
      { p_token: token, p_contar: !!(contar && !sessionStorage.ff_counted) });
    if (error) throw error;
    if (!data.ok) {
      localStorage.removeItem('ff_token');
      throw new Error(data.error === 'bloqueada' ? MSG_BLOQUEADO : MSG_SESION);
    }
    sessionStorage.ff_counted = '1';
    return guardarPerfil({ id: data.id, visible: data.usuario, nombre: data.nombre || '', rol: 'usuaria' });
  }

  /* ---------- Flujo común ---------- */

  // Inicio de sesión: si lo escrito tiene "@" es la administradora; si no, es una usuaria.
  async function iniciar(identificador, clave) {
    const id = (identificador || '').trim();
    if (!id || !clave) throw new Error('Escribe tu usuario y tu contraseña.');
    try {
      return id.includes('@') ? await iniciarAdmin(id, clave) : await iniciarUsuaria(id, clave);
    } catch (e) {
      if (sinRed(e)) throw new Error('Sin conexión. Necesitas internet para iniciar sesión.');
      throw e;
    }
  }

  // Al abrir la app: verifica la sesión guardada. Sin internet permite entrar solo dentro del periodo de gracia.
  async function restaurar() {
    try {
      if (typeof supabase === 'undefined') throw new Error('network');
      if (localStorage.ff_token) return await validarUsuaria(true);
      const { data: { session } } = await cliente().auth.getSession();
      if (!session) return null;
      return await validarAdmin(true);
    } catch (e) {
      if (!sinRed(e)) throw e;
      const copia = JSON.parse(localStorage.ff_perfil || 'null');
      const horas = (Date.now() - (+localStorage.ff_lastok || 0)) / 36e5;
      if (copia && copia.rol && horas < (C.GRACIA_HORAS || 72)) { perfil = copia; return perfil; }
      throw new Error('Necesitas conexión a internet para verificar tu acceso.');
    }
  }

  async function salir() {
    try {
      if (tipo() === 'usuaria') await cliente().rpc('usuaria_salir', { p_token: localStorage.ff_token });
      else await cliente().auth.signOut();
    } catch (e) { /* si falla (sin internet) igual se cierra la sesión local */ }
    ['ff_token', 'ff_perfil'].forEach(k => localStorage.removeItem(k));
    ['ff_counted', 'ff_ok'].forEach(k => sessionStorage.removeItem(k));
    location.reload();
  }

  // Revisa cada cierto tiempo (y al volver a la app) que el acceso siga activo. Si no, ejecuta alBloquear(mensaje).
  function vigilar(alBloquear) {
    const revisar = async () => {
      if (!perfil || !navigator.onLine) return;
      try { await (tipo() === 'usuaria' ? validarUsuaria(false) : validarAdmin(false)); }
      catch (e) { if (e.message === MSG_BLOQUEADO || e.message === MSG_SESION) alBloquear(e.message); }
    };
    setInterval(revisar, (C.VERIFICAR_CADA_MIN || 10) * 6e4);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) revisar(); });
  }

  async function cambiarClave(actual, nueva) {
    if (tipo() === 'usuaria') {
      const { data, error } = await cliente().rpc('usuaria_cambiar_clave',
        { p_token: localStorage.ff_token, p_actual: actual, p_nueva: nueva });
      if (error) throw new Error(error.message);
      if (!data.ok) throw new Error('La contraseña actual no es correcta.');
      return;
    }
    const prueba = await cliente().auth.signInWithPassword({ email: perfil.visible, password: actual });
    if (prueba.error) throw new Error('La contraseña actual no es correcta.');
    const { error } = await cliente().auth.updateUser({ password: nueva });
    if (error) throw new Error(error.message);
  }

  /* ---------- Administración de usuarias (solo la administradora; lo exige Supabase) ---------- */
  async function rpc(nombre, args) {
    const { data, error } = await cliente().rpc(nombre, args);
    if (error) throw new Error(error.message);
    return data;
  }
  async function listar() {
    const { data, error } = await cliente().from('usuarias')
      .select('id,usuario,nombre,estado,accesos,ultimo_acceso,creado').order('creado', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  return {
    configurado, iniciar, restaurar, salir, vigilar, cambiarClave, listar,
    crear: (usuario, clave, nombre) => rpc('admin_crear_usuaria', { p_usuario: usuario, p_clave: clave, p_nombre: nombre || '' }),
    estado: (id, estado) => rpc('admin_estado', { p_id: id, p_estado: estado }),
    clave: (id, clave) => rpc('admin_clave', { p_id: id, p_clave: clave }),
    borrar: id => rpc('admin_borrar_usuaria', { p_id: id }),
    esAdmin: () => perfil?.rol === 'admin',
    perfil: () => perfil,
    identificador: () => perfil?.visible || ''
  };
})();
