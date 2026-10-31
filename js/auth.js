/* Autenticación y control de acceso con Supabase.
   Expone el objeto global FFAuth. La seguridad real vive en Supabase (RLS + Edge Function);
   lo que oculta o muestra la interfaz es solo comodidad. */
const FFAuth = (() => {
  const C = window.FF_CONFIG || {};
  const MSG_BLOQ = 'Tu acceso está suspendido. Contacta a tu administrador.';
  let sb = null, perfil = null;

  const configurado = () => !!C.SUPABASE_URL && !/TU-PROYECTO/.test(C.SUPABASE_URL) && !!C.SUPABASE_ANON_KEY && !/TU_ANON/.test(C.SUPABASE_ANON_KEY);
  const cli = () => sb || (sb = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }));
  const sinRed = e => !navigator.onLine || typeof supabase === 'undefined' || e?.name === 'AuthRetryableFetchError' || /fetch|network|load failed/i.test(e?.message || '');

  /* Revisa en Supabase que la sesión sea válida y la cuenta esté activa. Si "contar" es true suma un acceso (una vez por sesión de la app). */
  async function validar(contar) {
    const c = cli(), r = await c.auth.getUser();
    if (r.error) { if (sinRed(r.error) || r.error.status >= 500) throw r.error; throw new Error('Tu sesión venció. Ingresa de nuevo.'); }
    const { data, error } = await c.from('profiles').select('*').eq('id', r.data.user.id).maybeSingle();
    if (error) throw error;
    if (!data || data.estado !== 'activo') { await c.auth.signOut(); throw new Error(MSG_BLOQ); }
    perfil = data;
    if (contar && !sessionStorage.ff_counted) {
      const a = await c.rpc('registrar_acceso');
      if (!a.error && a.data) { perfil = a.data; sessionStorage.ff_counted = '1'; }
    }
    localStorage.ff_lastok = Date.now();
    localStorage.ff_perfil = JSON.stringify({ id: perfil.id, email: perfil.email, rol: perfil.rol, estado: perfil.estado });
    return perfil;
  }

  /* Al abrir la app: si hay sesión guardada la verifica; sin internet permite entrar solo dentro del periodo de gracia. */
  async function restaurar() {
    try {
      if (typeof supabase === 'undefined') throw new Error('network');
      const { data: { session } } = await cli().auth.getSession();
      if (!session) return null;
      return await validar(true);
    } catch (e) {
      if (!sinRed(e) && e.message !== 'network') throw e;
      const c = JSON.parse(localStorage.ff_perfil || 'null'), h = (Date.now() - (+localStorage.ff_lastok || 0)) / 36e5;
      if (c && c.estado === 'activo' && h < (C.GRACIA_HORAS || 72)) { perfil = c; return perfil; }
      throw new Error('Necesitas conexión a internet para verificar tu acceso.');
    }
  }

  async function iniciar(email, clave) {
    if (!email || !clave) throw new Error('Escribe tu correo y tu contraseña.');
    try {
      const { error } = await cli().auth.signInWithPassword({ email, password: clave });
      if (error) {
        if (/banned/i.test(error.message)) throw new Error(MSG_BLOQ);
        if (/invalid login/i.test(error.message)) throw new Error('Correo o contraseña incorrectos.');
        throw error;
      }
      return await validar(true);
    } catch (e) {
      if (sinRed(e)) throw new Error('Sin conexión. Necesitas internet para iniciar sesión.');
      throw e;
    }
  }

  async function salir() {
    try { await cli().auth.signOut(); } catch (e) {}
    ['ff_counted', 'ff_ok'].forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem('ff_perfil');
    location.reload();
  }

  /* Revisa periódicamente (y al volver a la app) que el acceso siga activo. Si se bloqueó, ejecuta cb. */
  function vigilar(cb) {
    const t = async () => {
      if (!perfil || !navigator.onLine) return;
      try { await validar(false); } catch (e) { if (e.message === MSG_BLOQ || /venció/.test(e.message)) cb(e.message); }
    };
    setInterval(t, (C.VERIFICAR_CADA_MIN || 10) * 6e4);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) t(); });
  }

  async function cambiarClave(n) { const { error } = await cli().auth.updateUser({ password: n }); if (error) throw error; }

  /* ---- Administración (la autorización real la hace Supabase) ---- */
  async function listar() {
    const { data, error } = await cli().from('profiles').select('*').order('creado', { ascending: false });
    if (error) throw error; return data;
  }
  /* Crea una usuaria desde el panel. Usa un cliente temporal sin sesión guardada para que tu sesión de administradora no se cierre.
     La cuenta nace "bloqueada" (lo decide el disparador de la base de datos) y aquí el administrador la activa. */
  async function alta(email, clave, nombre) {
    const tmp = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ff-alta' } });
    const { data, error } = await tmp.auth.signUp({ email, password: clave, options: { data: { nombre } } });
    if (error) {
      if (/registered|already/i.test(error.message)) throw new Error('Ese correo ya está registrado.');
      if (/not allowed|disabled/i.test(error.message)) throw new Error('El registro está desactivado en Supabase. Actívalo en Authentication > Providers > Email.');
      throw new Error(error.message);
    }
    if (!data.user || (data.user.identities && !data.user.identities.length)) throw new Error('Ese correo ya está registrado.');
    const r = await cli().from('profiles').update({ estado: 'activo' }).eq('id', data.user.id);
    if (r.error) throw new Error('La cuenta se creó pero no se pudo activar: ' + r.error.message);
    return { id: data.user.id, pideConfirmar: !data.session };
  }
  async function estado(id, e) {
    const r = await cli().from('profiles').update({ estado: e }).eq('id', id);
    if (r.error) throw new Error(r.error.message);
  }

  return {
    configurado, restaurar, iniciar, salir, vigilar, cambiarClave, listar,
    crear: alta, estado,
    esAdmin: () => perfil?.rol === 'admin', perfil: () => perfil, correo: () => perfil?.email || ''
  };
})();
