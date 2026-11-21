-- =====================================================================
-- HU01 con recursos (INSOFT-33) y calendario en tiempo real (INSOFT-36)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Radicar una solicitud con sus recursos en una sola transacción.
-- Corre con los permisos de quien llama (security invoker): aplican la RLS,
-- auth.uid() y todos los triggers de reservas (RN01, RN03, RN05, RN06).
-- Si un recurso no es válido, no queda ni la reserva ni los recursos.
-- ---------------------------------------------------------------------
create function reservas.radicar(
  p_espacio_id uuid,
  p_inicio     timestamptz,
  p_fin        timestamptz,
  p_motivo_uso text,
  p_items      jsonb default '[]'::jsonb
)
returns table (id uuid, estado reservas.estado_reserva, bandeja reservas.bandeja)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reserva reservas.reservas%rowtype;
  v_item    jsonb;
begin
  if auth.uid() is null then
    raise exception 'Debes verificar tu correo para radicar una solicitud.';
  end if;

  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  values (p_espacio_id, auth.uid(), tstzrange(p_inicio, p_fin, '[)'), trim(p_motivo_uso))
  returning * into v_reserva;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    if coalesce((v_item ->> 'cantidad')::int, 0) > 0 then
      insert into reservas.reserva_items (reserva_id, item_id, cantidad)
      values (v_reserva.id, (v_item ->> 'item_id')::uuid, (v_item ->> 'cantidad')::int);
    end if;
  end loop;

  return query select v_reserva.id, v_reserva.estado, v_reserva.bandeja;
end;
$$;

revoke execute on function reservas.radicar(uuid, timestamptz, timestamptz, text, jsonb) from public, anon;
grant execute on function reservas.radicar(uuid, timestamptz, timestamptz, text, jsonb) to authenticated;

-- Mis reservas y la bandeja ahora muestran los recursos pedidos ("Micrófono x2, Video beam x1").
create function reservas.recursos_texto(p_reserva_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select string_agg(i.nombre || ' x' || ri.cantidad, ', ' order by i.nombre)
  from reservas.reserva_items ri
  join espacios.items i on i.id = ri.item_id
  where ri.reserva_id = p_reserva_id;
$$;

revoke execute on function reservas.recursos_texto(uuid) from public, anon, authenticated;

drop function reservas.mis_reservas();
create function reservas.mis_reservas()
returns table (
  id              uuid,
  espacio_id      uuid,
  espacio_nombre  text,
  inicio          timestamptz,
  fin             timestamptz,
  motivo_uso      text,
  estado          reservas.estado_reserva,
  bandeja         reservas.bandeja,
  motivo_decision text,
  creado_en       timestamptz,
  recursos        text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.espacio_id, e.nombre, lower(r.franja), upper(r.franja),
         r.motivo_uso, r.estado, r.bandeja, r.motivo_decision, r.creado_en,
         reservas.recursos_texto(r.id)
  from reservas.reservas r
  join espacios.espacios e on e.id = r.espacio_id
  where r.responsable_id = auth.uid()
  order by lower(r.franja) desc;
$$;

drop function reservas.bandeja_pendiente();
create function reservas.bandeja_pendiente()
returns table (
  id                 uuid,
  espacio_id         uuid,
  espacio_nombre     text,
  espacio_tipo       espacios.tipo_espacio,
  espacio_estado     espacios.estado_espacio,
  inicio             timestamptz,
  fin                timestamptz,
  motivo_uso         text,
  responsable_nombre text,
  responsable_correo text,
  bandeja            reservas.bandeja,
  creado_en          timestamptz,
  recursos           text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.espacio_id, e.nombre, e.tipo, e.estado, lower(r.franja), upper(r.franja),
         r.motivo_uso, p.nombre, p.correo, r.bandeja, r.creado_en,
         reservas.recursos_texto(r.id)
  from reservas.reservas r
  join espacios.espacios e on e.id = r.espacio_id
  join usuarios.perfiles p on p.id = r.responsable_id
  where r.estado = 'pendiente'
    and r.bandeja = case usuarios.rol_actual()
                      when 'admin' then 'administrador'::reservas.bandeja
                      when 'coordinador' then 'coordinador'::reservas.bandeja
                    end
  order by lower(r.franja);
$$;

revoke execute on function reservas.mis_reservas() from public, anon;
revoke execute on function reservas.bandeja_pendiente() from public, anon;
grant execute on function reservas.mis_reservas() to authenticated;
grant execute on function reservas.bandeja_pendiente() to authenticated;

-- ---------------------------------------------------------------------
-- Tiempo real (INSOFT-36): cada vez que una reserva se radica o cambia de
-- estado se avisa por el canal público "ocupacion" de Supabase Realtime.
-- El aviso solo lleva el espacio (sin datos personales); la app vuelve a
-- consultar reservas.ocupacion(). Si Realtime no está disponible, la
-- reserva se guarda igual.
-- ---------------------------------------------------------------------
create function reservas.avisar_ocupacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('espacio_id', new.espacio_id),
      'cambio',
      'ocupacion',
      false
    );
  exception when others then
    null; -- el aviso es opcional; nunca bloquea la reserva
  end;
  return null;
end;
$$;

create trigger al_cambiar_ocupacion
  after insert or update of estado on reservas.reservas
  for each row execute function reservas.avisar_ocupacion();
