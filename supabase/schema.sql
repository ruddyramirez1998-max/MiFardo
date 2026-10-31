-- MiFardo: esquema de Supabase. Pégalo COMPLETO en SQL Editor y toca Run. Se puede ejecutar varias veces sin problema.

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

-- Permisos: nadie sin sesión toca la tabla; con sesión solo se puede leer y cambiar la columna "estado" (y solo si eres admin).
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (estado) on public.profiles to authenticated;

create or replace function public.es_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin' and estado = 'activo');
$$;

drop policy if exists perfiles_select on public.profiles;
create policy perfiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.es_admin());

drop policy if exists perfiles_update_admin on public.profiles;
create policy perfiles_update_admin on public.profiles for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Toda cuenta nueva nace BLOQUEADA. Solo el administrador la activa desde el panel.
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

-- Suma +1 al contador solo si la cuenta está activa.
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
