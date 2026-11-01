-- ============================================================
-- MiFardo · Esquema de Supabase
-- Pégalo COMPLETO en SQL Editor y toca Run. Se puede ejecutar varias veces.
--
-- Cuentas:
--   * Administradora (una sola): usuario de Supabase Auth con correo. Tabla "profiles".
--   * Usuarias: "usuario" y "contraseña" propios (sin correo). Tabla "usuarias".
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Administradora ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text default '',
  rol text not null default 'cliente' check (rol in ('cliente','admin')),
  estado text not null default 'bloqueado' check (estado in ('activo','bloqueado')),
  accesos int not null default 0,
  ultimo_acceso timestamptz,
  creado timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Solo puede existir UNA administradora.
create unique index if not exists un_solo_admin on public.profiles ((rol)) where rol = 'admin';

create or replace function public.es_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin' and estado = 'activo');
$$;

drop policy if exists perfiles_select on public.profiles;
create policy perfiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.es_admin());
drop policy if exists perfiles_update_admin on public.profiles;

-- Todo usuario de Supabase Auth nace bloqueado: solo se activa convirtiéndolo en administradora con supabase/admin.sql.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nombre, estado)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre',''), 'bloqueado')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.registrar_acceso() returns public.profiles
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  update public.profiles set accesos = accesos + 1, ultimo_acceso = now()
   where id = auth.uid() and estado = 'activo' returning * into p;
  if p.id is null then select * into p from public.profiles where id = auth.uid(); end if;
  return p;
end $$;
revoke all on function public.registrar_acceso() from public, anon;
grant execute on function public.registrar_acceso() to authenticated;

-- ---------- Usuarias (usuario y contraseña) ----------
create table if not exists public.usuarias (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique check (usuario ~ '^[a-z0-9._-]{3,30}$'),
  nombre text not null default '',
  clave_hash text not null,
  estado text not null default 'activo' check (estado in ('activo','bloqueado')),
  accesos int not null default 0,
  ultimo_acceso timestamptz,
  intentos int not null default 0,
  bloqueo_hasta timestamptz,
  creado timestamptz not null default now()
);
create table if not exists public.sesiones (
  token_hash text primary key,
  usuaria_id uuid not null references public.usuarias(id) on delete cascade,
  expira timestamptz not null
);
alter table public.usuarias enable row level security;
alter table public.sesiones enable row level security;
revoke all on public.usuarias, public.sesiones from anon, authenticated;

-- La administradora puede LEER la lista (sin la contraseña cifrada). Nadie escribe directo: solo las funciones de abajo.
grant select (id, usuario, nombre, estado, accesos, ultimo_acceso, creado) on public.usuarias to authenticated;
drop policy if exists usuarias_select_admin on public.usuarias;
create policy usuarias_select_admin on public.usuarias for select to authenticated using (public.es_admin());

-- ---------- Funciones de la administradora ----------
create or replace function public.admin_crear_usuaria(p_usuario text, p_clave text, p_nombre text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare u text := lower(trim(p_usuario)); v_id uuid;
begin
  if not public.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if u !~ '^[a-z0-9._-]{3,30}$' then raise exception 'Usuario no válido: usa de 3 a 30 letras, números, punto o guion'; end if;
  if length(coalesce(p_clave, '')) < 6 then raise exception 'La contraseña necesita al menos 6 caracteres'; end if;
  insert into public.usuarias (usuario, nombre, clave_hash)
  values (u, left(coalesce(p_nombre, ''), 80), crypt(p_clave, gen_salt('bf', 8))) returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'Ese usuario ya existe';
end $$;

create or replace function public.admin_estado(p_id uuid, p_estado text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_estado not in ('activo','bloqueado') then raise exception 'Estado no válido'; end if;
  update public.usuarias set estado = p_estado where id = p_id;
  if p_estado = 'bloqueado' then delete from public.sesiones where usuaria_id = p_id; end if;  -- cierra sus sesiones al instante
end $$;

create or replace function public.admin_clave(p_id uuid, p_clave text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if length(coalesce(p_clave, '')) < 6 then raise exception 'La contraseña necesita al menos 6 caracteres'; end if;
  update public.usuarias set clave_hash = crypt(p_clave, gen_salt('bf', 8)), intentos = 0, bloqueo_hasta = null where id = p_id;
  delete from public.sesiones where usuaria_id = p_id;
end $$;

create or replace function public.admin_borrar_usuaria(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  delete from public.usuarias where id = p_id;
end $$;

-- ---------- Funciones de las usuarias (se pueden llamar sin sesión de Supabase) ----------
create or replace function public.usuaria_login(p_usuario text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r public.usuarias; tok text;
begin
  select * into r from public.usuarias where usuario = lower(trim(p_usuario));
  if not found then
    perform crypt(coalesce(p_clave, ''), gen_salt('bf', 8));      -- tarda igual aunque el usuario no exista
    return json_build_object('ok', false, 'error', 'credenciales');
  end if;
  if r.bloqueo_hasta is not null and r.bloqueo_hasta > now() then
    return json_build_object('ok', false, 'error', 'espera');
  end if;
  if r.clave_hash <> crypt(coalesce(p_clave, ''), r.clave_hash) then
    update public.usuarias
       set intentos = case when intentos + 1 >= 5 then 0 else intentos + 1 end,
           bloqueo_hasta = case when intentos + 1 >= 5 then now() + interval '10 minutes' else bloqueo_hasta end
     where id = r.id;                                              -- 5 errores seguidos = 10 minutos de espera
    return json_build_object('ok', false, 'error', 'credenciales');
  end if;
  if r.estado <> 'activo' then return json_build_object('ok', false, 'error', 'bloqueada'); end if;

  tok := encode(gen_random_bytes(32), 'hex');
  delete from public.sesiones where expira < now();
  insert into public.sesiones (token_hash, usuaria_id, expira)
  values (encode(digest(tok, 'sha256'), 'hex'), r.id, now() + interval '30 days');
  update public.usuarias set accesos = accesos + 1, ultimo_acceso = now(), intentos = 0, bloqueo_hasta = null where id = r.id;
  return json_build_object('ok', true, 'token', tok, 'id', r.id, 'usuario', r.usuario, 'nombre', r.nombre);
end $$;

create or replace function public.usuaria_verificar(p_token text, p_contar boolean default false)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r public.usuarias;
begin
  select u.* into r from public.sesiones s join public.usuarias u on u.id = s.usuaria_id
   where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expira > now();
  if not found then return json_build_object('ok', false, 'error', 'sesion'); end if;
  if r.estado <> 'activo' then return json_build_object('ok', false, 'error', 'bloqueada'); end if;
  if p_contar then update public.usuarias set accesos = accesos + 1, ultimo_acceso = now() where id = r.id; end if;
  return json_build_object('ok', true, 'id', r.id, 'usuario', r.usuario, 'nombre', r.nombre);
end $$;

create or replace function public.usuaria_salir(p_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from public.sesiones where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
end $$;

create or replace function public.usuaria_cambiar_clave(p_token text, p_actual text, p_nueva text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r public.usuarias;
begin
  select u.* into r from public.sesiones s join public.usuarias u on u.id = s.usuaria_id
   where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') and s.expira > now() and u.estado = 'activo';
  if not found or r.clave_hash <> crypt(coalesce(p_actual, ''), r.clave_hash) then return json_build_object('ok', false); end if;
  if length(coalesce(p_nueva, '')) < 6 then raise exception 'La contraseña necesita al menos 6 caracteres'; end if;
  update public.usuarias set clave_hash = crypt(p_nueva, gen_salt('bf', 8)) where id = r.id;
  return json_build_object('ok', true);
end $$;

-- ---------- Permisos de ejecución ----------
revoke all on function public.admin_crear_usuaria(text, text, text), public.admin_estado(uuid, text),
  public.admin_clave(uuid, text), public.admin_borrar_usuaria(uuid) from public, anon;
grant execute on function public.admin_crear_usuaria(text, text, text), public.admin_estado(uuid, text),
  public.admin_clave(uuid, text), public.admin_borrar_usuaria(uuid) to authenticated;

revoke all on function public.usuaria_login(text, text), public.usuaria_verificar(text, boolean),
  public.usuaria_salir(text), public.usuaria_cambiar_clave(text, text, text) from public;
grant execute on function public.usuaria_login(text, text), public.usuaria_verificar(text, boolean),
  public.usuaria_salir(text), public.usuaria_cambiar_clave(text, text, text) to anon, authenticated;
