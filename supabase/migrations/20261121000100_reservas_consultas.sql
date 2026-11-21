-- =====================================================================
-- Consultas de RESERVAS para la app: "Mis reservas" (INSOFT-34) y las
-- bandejas de aprobación del Administrador y del Coordinador (INSOFT-37/38).
--
-- La API REST no puede unir tablas de esquemas distintos, así que estas
-- funciones devuelven la reserva junto con el nombre del espacio y del
-- solicitante. Cada una filtra por el usuario de la sesión (auth.uid()).
-- Aprobar, rechazar y cancelar siguen pasando por el trigger
-- reservas.validar_cambio_estado y las políticas RLS.
-- =====================================================================

-- Reservas del usuario que hace la petición, de la más reciente a la más antigua.
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
  creado_en       timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.espacio_id, e.nombre, lower(r.franja), upper(r.franja),
         r.motivo_uso, r.estado, r.bandeja, r.motivo_decision, r.creado_en
  from reservas.reservas r
  join espacios.espacios e on e.id = r.espacio_id
  where r.responsable_id = auth.uid()
  order by lower(r.franja) desc;
$$;

-- Solicitudes pendientes de la bandeja que le corresponde al rol de la sesión (RN05):
-- el administrador ve la suya y el coordinador la suya. Un solicitante no ve nada.
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
  creado_en          timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.espacio_id, e.nombre, e.tipo, e.estado, lower(r.franja), upper(r.franja),
         r.motivo_uso, p.nombre, p.correo, r.bandeja, r.creado_en
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
