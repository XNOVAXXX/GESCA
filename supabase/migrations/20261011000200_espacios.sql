-- =====================================================================
-- Dominio ESPACIOS: catálogo, capacidad, ítems y mantenimiento
-- (RF01, RN03, HU02)
-- =====================================================================

create schema if not exists espacios;
grant usage on schema espacios to anon, authenticated, service_role;

create type espacios.tipo_espacio as enum (
  'auditorio', 'sala_computo', 'cancha', 'laboratorio', 'espacio_compartido'
);

create type espacios.estado_espacio as enum ('activo', 'mantenimiento');

create table espacios.espacios (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null unique check (trim(nombre) <> ''),
  tipo           espacios.tipo_espacio not null,
  capacidad_max  integer not null check (capacidad_max > 0),
  estado         espacios.estado_espacio not null default 'activo',
  motivo_estado  text,
  actualizado_en timestamptz not null default now(),
  -- HU02: poner un espacio en mantenimiento exige indicar el motivo.
  constraint mantenimiento_con_motivo
    check (estado = 'activo' or nullif(trim(motivo_estado), '') is not null)
);

create table espacios.items (
  id         uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references espacios.espacios (id) on delete cascade,
  nombre     text not null check (trim(nombre) <> ''),
  cantidad   integer not null check (cantidad >= 0),
  unique (espacio_id, nombre)
);

create index on espacios.items (espacio_id);

create function espacios.marcar_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger al_actualizar_espacio
  before update on espacios.espacios
  for each row execute function espacios.marcar_actualizado();

-- ---------------------------------------------------------------------
-- Seguridad: cualquiera consulta el catálogo (RF02); solo admin lo cambia.
-- ---------------------------------------------------------------------
alter table espacios.espacios enable row level security;
alter table espacios.items enable row level security;

create policy "catálogo público" on espacios.espacios
  for select to anon, authenticated using (true);
create policy "admin gestiona espacios" on espacios.espacios
  for all to authenticated
  using (usuarios.rol_actual() = 'admin')
  with check (usuarios.rol_actual() = 'admin');

create policy "ítems públicos" on espacios.items
  for select to anon, authenticated using (true);
create policy "admin gestiona ítems" on espacios.items
  for all to authenticated
  using (usuarios.rol_actual() = 'admin')
  with check (usuarios.rol_actual() = 'admin');

grant select on espacios.espacios, espacios.items to anon;
grant select, insert, update, delete on espacios.espacios, espacios.items to authenticated;
grant all on espacios.espacios, espacios.items to service_role;
