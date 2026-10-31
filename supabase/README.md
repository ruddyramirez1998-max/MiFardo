# Configuración de Supabase para MiFardo (versión sin función de servidor)

Si la página de Supabase se traduce sola al español, apaga la traducción: daña el código SQL.

1. **Crear proyecto**: supabase.com > New project (plan gratuito). Guarda la contraseña de la base de datos.
2. **Tablas y seguridad**: SQL Editor > New query. Pega TODO `supabase/schema.sql` y toca Run. Debe decir Success.
3. **Registro**: Authentication > Providers > Email.
   - Deja ACTIVADO "Allow new users to sign up" (es el que usa el panel para crear usuarias).
   - DESACTIVA "Confirm email".
4. **Tu usuario administrador**: Authentication > Users > Add user > Create new user. Tu correo, una contraseña nueva, y marca Auto Confirm User.
5. **Hacerte administrador**: SQL Editor > New query. Abre `supabase/admin.sql`, cambia el correo por el tuyo y toca Run. Debe decir 1 fila afectada.
6. **Claves**: Project Settings > API. Copia la Project URL y la clave anon public (empieza con eyJ) en `js/config.js`. Nunca uses la clave service_role.
7. Sube a GitHub (git add . / git commit / git push) y activa GitHub Pages.

## Cómo funciona la seguridad
- Cada cuenta nueva nace bloqueada. Aunque alguien se registre por su cuenta, no puede usar la app hasta que tú la actives.
- Las usuarias solo pueden leer su propio perfil. Solo un administrador activo puede ver la lista y cambiar el estado.
- Nadie puede cambiar su rol ni su contador de accesos: solo existe permiso para la columna "estado" y solo para administradores.
- El bloqueo se aplica al abrir la app, al volver a ella y cada 10 minutos (con internet). Sin internet se permite hasta 72 horas.

## Límites
- No se puede restablecer la contraseña de otra usuaria desde el panel (cada una puede cambiar la suya en Ajustes).
- Como el registro es público, alguien podría crear cuentas que quedan bloqueadas y no sirven para nada. Puedes borrarlas en Authentication > Users.
