/* Configuración pública de Supabase.
   La clave "publishable" es pública por diseño (la protegen las reglas del archivo supabase/schema.sql).
   NUNCA pongas aquí una clave "secret" ni "service_role". */
window.FF_CONFIG = {
  SUPABASE_URL: 'https://ytqkotefqvqsacfbvzbp.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_7rF8Ep5ffTL6TzEh57xeJw_YPrXs3r5',
  GRACIA_HORAS: 72,        // horas que puede usar la app sin internet antes de volver a verificar su estado
  VERIFICAR_CADA_MIN: 10   // cada cuántos minutos se revisa si el acceso sigue activo
};
