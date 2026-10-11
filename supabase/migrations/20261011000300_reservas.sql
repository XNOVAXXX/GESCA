-- =====================================================================
-- Dominio RESERVAS: solicitudes, ciclo de vida, aprobaciones e historial
-- (RF03, RF04, RF05, RN01, RN03, RN04, RN05, RN06)
--
-- Las reglas de negocio viven aquí para que se cumplan igual desde la
-- app, las Edge Functions o cualquier otro cliente.
-- =====================================================================

create schema if not exists reservas;
grant usage on schema reservas to anon, authenticated, service_role;

create type reservas.estado_reserva as enum ('pendiente', 'aprobada', 'rechazada', 'cancelada');
create type reservas.bandeja as enum ('administrador', 'coordinador');

create table reservas.reservas (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references espacios.espacios (id) on delete restrict,
  responsable_id  uuid not null references usuarios.perfiles (id) on delete restrict, -- RN02
  franja          tstzrange not null,
  motivo_uso      text not null check (trim(motivo_uso) <> ''),
  estado          reservas.estado_reserva not null default 'pendiente',
  bandeja         reservas.bandeja not null,
  motivo_decision text,
  decidido_por    uuid references usuarios.perfiles (id),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Franja con inicio y fin definidos, en formato [inicio, fin).
  constraint franja_valida check (
    not isempty(franja) and not lower_inf(franja) and not upper_inf(franja)
    and lower_inc(franja) and not upper_inc(franja)
  ),
  -- RN06: duración máxima de 2 horas continuas.
  constraint duracion_maxima check (upper(franja) - lower(franja) <= interval '2 hours'),
  -- RN04: rechazar o cancelar exige justificación.
  constraint justificacion_obligatoria check (
    estado not in ('rechazada', 'cancelada') or nullif(trim(motivo_decision), '') is not null
  ),
  -- RN01: cero solapamiento. La base de datos rechaza de forma atómica cualquier
  -- reserva activa que se cruce con otra en el mismo espacio, incluso si llegan
  -- al mismo tiempo (RNF04).
  constraint sin_solapamiento exclude using gist (
    espacio_id with =,
    franja with &&
  ) where (estado in ('pendiente', 'aprobada'))
);

create index on reservas.reservas (responsable_id);
create index on reservas.reservas (bandeja, estado);

create table reservas.reserva_items (
  reserva_id uuid not null references reservas.reservas (id) on delete cascade,
  item_id    uuid not null references espacios.items (id) on delete restrict,
  cantidad   integer not null check (cantidad > 0),
  primary key (reserva_id, item_id)
);

create table reservas.historial (
  id              bigint generated always as identity primary key,
  reserva_id      uuid not null references reservas.reservas (id) on delete cascade,
  estado_anterior reservas.estado_reserva,
  estado_nuevo    reservas.estado_reserva not null,
  actor_id        uuid,
  motivo          text,
  fecha           timestamptz not null default now()
);

create index on reservas.historial (reserva_id);

-- ---------------------------------------------------------------------
-- Al radicar: estado inicial, RN03, RN06 (anticipación) y RN05 (enrutamiento)
-- ---------------------------------------------------------------------
create function reservas.validar_radicacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_espacio espacios.espacios%rowtype;
  v_correo  text;
begin
  new.estado := 'pendiente';
  new.motivo_decision := null;
  new.decidido_por := null;

  -- "for share" evita que el espacio pase a mantenimiento mientras se radica.
  select * into v_espacio from espacios.espacios where id = new.espacio_id for share;
  if not found then
    raise exception 'El espacio no existe.';
  end if;
  if v_espacio.estado = 'mantenimiento' then
    raise exception 'El espacio "%" está en mantenimiento y no admite reservas.', v_espacio.nombre; -- RN03
  end if;

  if lower(new.franja) <= now() then
    raise exception 'La reserva debe ser en el futuro.';
  end if;
  if lower(new.franja) > now() + interval '15 days' then
    raise exception 'Solo se puede reservar con máximo 15 días de anticipación.'; -- RN06
  end if;

  select correo into v_correo from usuarios.perfiles where id = new.responsable_id;

  -- RN05: laboratorios, espacios compartidos y correos externos van al Coordinador.
  new.bandeja := case
    when v_espacio.tipo in ('laboratorio', 'espacio_compartido') then 'coordinador'
    when v_correo is null or v_correo not like '%@pascualbravo.edu.co' then 'coordinador'
    else 'administrador'
  end::reservas.bandeja;

  return new;
end;
$$;

create trigger al_radicar
  before insert on reservas.reservas
  for each row execute function reservas.validar_radicacion();

-- ---------------------------------------------------------------------
-- Cambios de estado: transiciones válidas, permisos por bandeja, RN06 (24 h)
-- ---------------------------------------------------------------------
create function reservas.validar_cambio_estado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_rol   usuarios.rol := usuarios.rol_actual();
begin
  if new.espacio_id <> old.espacio_id or new.franja <> old.franja
     or new.responsable_id <> old.responsable_id or new.bandeja <> old.bandeja then
    raise exception 'El espacio, la franja, el responsable y la bandeja no se pueden modificar. Cancela y radica una nueva solicitud.';
  end if;

  if new.estado = old.estado then
    new.actualizado_en := now();
    return new;
  end if;

  if not (
    (old.estado = 'pendiente' and new.estado in ('aprobada', 'rechazada', 'cancelada'))
    or (old.estado = 'aprobada' and new.estado = 'cancelada')
  ) then
    raise exception 'No se puede pasar una reserva de % a %.', old.estado, new.estado;
  end if;

  -- v_actor nulo = operación del sistema (service_role o administrador de la base de datos).
  if v_actor is not null then
    if new.estado in ('aprobada', 'rechazada') then
      if not ((new.bandeja = 'administrador' and v_rol = 'admin')
              or (new.bandeja = 'coordinador' and v_rol = 'coordinador')) then
        raise exception 'Esta solicitud está en la bandeja del %; no tienes permiso para decidirla.', new.bandeja;
      end if;
      new.decidido_por := v_actor;
    elsif new.estado = 'cancelada' then
      if v_actor <> old.responsable_id and v_rol is distinct from 'admin' then
        raise exception 'Solo el responsable o un administrador pueden cancelar la reserva.';
      end if;
    end if;
  end if;

  if new.estado = 'cancelada' and lower(old.franja) - now() < interval '24 hours' then
    raise exception 'Solo se puede cancelar con mínimo 24 horas de anticipación.'; -- RN06
  end if;

  if new.estado = 'aprobada' and exists (
    select 1 from espacios.espacios where id = new.espacio_id and estado = 'mantenimiento'
  ) then
    raise exception 'El espacio está en mantenimiento; no se puede aprobar la reserva.'; -- RN03
  end if;

  new.actualizado_en := now();
  return new;
end;
$$;

create trigger al_cambiar_estado
  before update on reservas.reservas
  for each row execute function reservas.validar_cambio_estado();

-- ---------------------------------------------------------------------
-- Auditoría: cada radicación y cambio de estado queda en el historial
-- ---------------------------------------------------------------------
create function reservas.registrar_historial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.estado <> old.estado then
    insert into reservas.historial (reserva_id, estado_anterior, estado_nuevo, actor_id, motivo)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.estado end,
      new.estado,
      auth.uid(),
      case when tg_op = 'INSERT' then new.motivo_uso else new.motivo_decision end
    );
  end if;
  return null;
end;
$$;

create trigger al_registrar_historial
  after insert or update on reservas.reservas
  for each row execute function reservas.registrar_historial();

-- Los recursos pedidos deben pertenecer al espacio reservado (RF03).
create function reservas.validar_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from reservas.reservas r
    join espacios.items i on i.espacio_id = r.espacio_id
    where r.id = new.reserva_id and i.id = new.item_id and new.cantidad <= i.cantidad
  ) then
    raise exception 'El recurso no pertenece al espacio reservado o la cantidad supera la disponible.';
  end if;
  return new;
end;
$$;

create trigger al_agregar_item
  before insert or update on reservas.reserva_items
  for each row execute function reservas.validar_item();

-- ---------------------------------------------------------------------
-- Ocupación pública para el calendario (RF02), sin datos personales
-- ---------------------------------------------------------------------
create function reservas.ocupacion(p_desde timestamptz, p_hasta timestamptz)
returns table (espacio_id uuid, inicio timestamptz, fin timestamptz, estado reservas.estado_reserva)
language sql
stable
security definer
set search_path = ''
as $$
  select r.espacio_id, lower(r.franja), upper(r.franja), r.estado
  from reservas.reservas r
  where r.estado in ('pendiente', 'aprobada')
    and r.franja && tstzrange(p_desde, p_hasta, '[)');
$$;

-- ---------------------------------------------------------------------
-- Seguridad a nivel de fila
-- ---------------------------------------------------------------------
alter table reservas.reservas enable row level security;
alter table reservas.reserva_items enable row level security;
alter table reservas.historial enable row level security;

create policy "ver propias o de la bandeja propia" on reservas.reservas
  for select to authenticated
  using (
    responsable_id = auth.uid()
    or usuarios.rol_actual() = 'admin'
    or (usuarios.rol_actual() = 'coordinador' and bandeja = 'coordinador')
  );

create policy "radicar a nombre propio" on reservas.reservas
  for insert to authenticated
  with check (responsable_id = auth.uid());

create policy "cambiar propias o de la bandeja propia" on reservas.reservas
  for update to authenticated
  using (
    responsable_id = auth.uid()
    or usuarios.rol_actual() = 'admin'
    or (usuarios.rol_actual() = 'coordinador' and bandeja = 'coordinador')
  );

create policy "ítems de reservas visibles" on reservas.reserva_items
  for select to authenticated
  using (exists (select 1 from reservas.reservas r where r.id = reserva_id));

create policy "agregar ítems a reservas propias pendientes" on reservas.reserva_items
  for insert to authenticated
  with check (exists (
    select 1 from reservas.reservas r
    where r.id = reserva_id and r.responsable_id = auth.uid() and r.estado = 'pendiente'
  ));

create policy "historial de reservas visibles" on reservas.historial
  for select to authenticated
  using (exists (select 1 from reservas.reservas r where r.id = reserva_id));

grant select, insert, update on reservas.reservas to authenticated;
grant select, insert on reservas.reserva_items to authenticated;
grant select on reservas.historial to authenticated;
grant all on all tables in schema reservas to service_role;
grant execute on function reservas.ocupacion(timestamptz, timestamptz) to anon, authenticated;
