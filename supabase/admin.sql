-- Ejecuta esto DESPUÉS de crear tu usuario en Authentication > Users > Add user.
-- Cambia el correo por el tuyo, exactamente igual al que escribiste al crear el usuario.
insert into public.profiles (id, email, rol, estado)
select id, email, 'admin', 'activo' from auth.users where email = 'ruddyramirez1998@gmail.com'
on conflict (id) do update set rol = 'admin', estado = 'activo';
