-- =====================================================================
-- Dominio USUARIOS: perfiles y roles (RNF01, RNF02, RN05)
-- Los usuarios se autentican con Supabase Auth (contraseña para admin y
-- coordinador; código OTP al correo para solicitantes).
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

create schema if not exists usuarios;
grant usage on schema usuarios to anon, authenticated, service_role;

create type usuarios.rol as enum ('admin', 'coordinador', 'solicitante');

create table usuarios.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  correo     text not null,
  rol        usuarios.rol not null default 'solicitante',
  creado_en  timestamptz not null default now()
);

comment on table usuarios.perfiles is 'Datos del usuario y su rol. El correo viene de auth.users (verificado por Supabase Auth).';

-- Rol del usuario que hace la petición; null si no hay sesión.
create function usuarios.rol_actual()
returns usuarios.rol
language sql
stable
security definer
set search_path = ''
as $$
  select rol from usuarios.perfiles where id = auth.uid();
$$;

-- Todo usuario nuevo de Auth recibe un perfil de solicitante.
-- Los roles admin y coordinador los asigna un administrador.
create function usuarios.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into usuarios.perfiles (id, nombre, correo)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), new.email),
    lower(new.email)
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function usuarios.crear_perfil();

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila
-- ---------------------------------------------------------------------
alter table usuarios.perfiles enable row level security;

create policy "cada usuario ve su perfil; admin y coordinador ven todos"
  on usuarios.perfiles for select
  to authenticated
  using (id = auth.uid() or usuarios.rol_actual() in ('admin', 'coordinador'));

create policy "solo admin cambia perfiles"
  on usuarios.perfiles for update
  to authenticated
  using (usuarios.rol_actual() = 'admin')
  with check (usuarios.rol_actual() = 'admin');

grant select, update on usuarios.perfiles to authenticated;
grant all on usuarios.perfiles to service_role;
grant execute on function usuarios.rol_actual() to anon, authenticated, service_role;
