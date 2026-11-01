# Configuración de Supabase para MiFardo

Si la página de Supabase se traduce sola al español, apaga la traducción: daña el código SQL.

1. **Crear proyecto**: supabase.com > New project (plan gratuito).
2. **Tablas y seguridad**: SQL Editor > New query. Pega TODO `supabase/schema.sql` y toca Run. Debe decir Success.
   Puedes ejecutarlo de nuevo cuando quieras (no duplica nada).
3. **Registro público**: Authentication > Providers > Email. DESACTIVA "Allow new users to sign up".
   Las usuarias ya no usan Supabase Auth: las crea la administradora desde el panel.
4. **Tu usuario administrador**: Authentication > Users > Add user > Create new user (tu correo, una contraseña nueva, Auto Confirm User).
5. **Hacerte administradora**: SQL Editor > New query. Pega `supabase/admin.sql` y toca Run (1 fila afectada).
6. **Claves**: Project Settings > API. Copia la Project URL y la clave publishable (o anon) en `js/config.js`.
   Nunca uses una clave "secret" o "service_role".
7. Sube todo a GitHub y activa GitHub Pages.

## Cómo funciona
- La administradora (una sola) entra con su correo. Las usuarias entran solo con usuario y contraseña.
- La app distingue por el "@": con "@" es la administradora; sin "@" es una usuaria.
- Las contraseñas de las usuarias se guardan cifradas (bcrypt) y nadie, ni la administradora, puede leerlas.
- 5 contraseñas incorrectas seguidas bloquean ese usuario por 10 minutos.
- Al bloquear a una usuaria se cierran sus sesiones al instante; la app también lo revisa al abrirse, al volver a ella y cada 10 minutos.
- Sin internet se permite usar la app hasta 72 horas (`GRACIA_HORAS` en `js/config.js`).

## Límites
- Los datos de ventas están en el celular de cada usuaria; la administradora no los ve.
- Un bloqueo se aplica cuando el celular tenga internet.
