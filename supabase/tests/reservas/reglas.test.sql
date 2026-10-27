-- Pruebas de las reglas de negocio de GESCA (se ejecutan con `supabase test db`).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(25);

-- ---------------------------------------------------------------- datos
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000c1', 'coordinador@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e1', 'estudiante@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e2', 'externo@gmail.com');

update usuarios.perfiles set rol = 'admin'       where id = '00000000-0000-0000-0000-0000000000a1';
update usuarios.perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000c1';

insert into espacios.espacios (id, nombre, tipo, capacidad_max, estado, motivo_estado) values
  ('10000000-0000-0000-0000-000000000001', 'Auditorio prueba', 'auditorio', 200, 'activo', null),
  ('10000000-0000-0000-0000-000000000002', 'Laboratorio prueba', 'laboratorio', 30, 'activo', null),
  ('10000000-0000-0000-0000-000000000003', 'Sala en arreglo', 'sala_computo', 25, 'mantenimiento', 'Cambio de equipos');

create temp table t (nombre text primary key, inicio timestamptz);
-- Base: dentro de 3 días (más de 24 h y menos de 15 días, sin importar la hora de ejecución).
insert into t values ('base', date_trunc('hour', now()) + interval '3 days');
grant select on t to authenticated;

-- Actúa como el usuario indicado (igual que una petición con su sesión).
create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ------------------------------------------------------ perfiles
select is((select count(*)::int from usuarios.perfiles), 4, 'cada usuario de Auth recibe un perfil');
select is((select rol::text from usuarios.perfiles where correo = 'externo@gmail.com'), 'solicitante',
  'el rol por defecto es solicitante');

-- ------------------------------------------------------ radicación (RN01, RN03, RN05, RN06)
select pg_temp.como('00000000-0000-0000-0000-0000000000e1');

select lives_ok($$
  insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
  select '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-0000000000e1', tstzrange(inicio, inicio + interval '2 hours'), 'Clase'
  from t where nombre = 'base' $$,
  'HU01: una solicitud válida de 2 horas se radica');

select is((select estado::text from reservas.reservas where id = '20000000-0000-0000-0000-000000000001'),
  'pendiente', 'la solicitud queda en estado Pendiente');
select is((select bandeja::text from reservas.reservas where id = '20000000-0000-0000-0000-000000000001'),
  'administrador', 'auditorio + correo institucional va al Administrador');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  select '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1',
         tstzrange(inicio + interval '1 hour', inicio + interval '3 hours'), 'Cruce'
  from t where nombre = 'base' $$,
  '23P01', null, 'RN01: no se permite una reserva que se cruce con otra');

select lives_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  select '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1',
         tstzrange(inicio + interval '2 hours', inicio + interval '3 hours'), 'Contigua'
  from t where nombre = 'base' $$,
  'RN01: una franja contigua (empieza cuando termina la otra) sí se permite');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  select '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1',
         tstzrange(inicio + interval '5 hours', inicio + interval '8 hours'), 'Larga'
  from t where nombre = 'base' $$,
  '23514', null, 'RN06 / HU01 escenario 2: no se permiten más de 2 horas');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1',
          tstzrange(now() + interval '16 days', now() + interval '16 days 1 hour'), 'Lejana') $$,
  'P0001', 'Solo se puede reservar con máximo 15 días de anticipación.',
  'RN06: no se permite reservar con más de 15 días de anticipación');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1',
          tstzrange(now() - interval '1 hour', now()), 'Pasada') $$,
  'P0001', 'La reserva debe ser en el futuro.', 'no se permite reservar en el pasado');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  select '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000e1',
         tstzrange(inicio, inicio + interval '1 hour'), 'Mantenimiento'
  from t where nombre = 'base' $$,
  'P0001', null, 'RN03: un espacio en mantenimiento no admite reservas');

select throws_ok($$
  insert into reservas.reservas (espacio_id, responsable_id, franja, motivo_uso)
  select '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e2',
         tstzrange(inicio, inicio + interval '1 hour'), 'Suplantación'
  from t where nombre = 'base' $$,
  '42501', null, 'nadie puede radicar a nombre de otra persona');

select lives_ok($$
  insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
  select '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
         '00000000-0000-0000-0000-0000000000e1', tstzrange(inicio, inicio + interval '1 hour'), 'Práctica'
  from t where nombre = 'base' $$,
  'se radica una solicitud de laboratorio');
select is((select bandeja::text from reservas.reservas where id = '20000000-0000-0000-0000-000000000002'),
  'coordinador', 'RN05: los laboratorios van al Coordinador');

select pg_temp.como('00000000-0000-0000-0000-0000000000e2');
select lives_ok($$
  insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
  select '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-0000000000e2', tstzrange(inicio + interval '4 hours', inicio + interval '5 hours'), 'Evento externo'
  from t where nombre = 'base' $$,
  'un usuario externo radica una solicitud');
select is((select bandeja::text from reservas.reservas where id = '20000000-0000-0000-0000-000000000003'),
  'coordinador', 'RN05 / HU03 escenario 1: correo externo va al Coordinador');
select is((select count(*)::int from reservas.reservas), 1,
  'RLS: el solicitante solo ve sus propias reservas');

-- ------------------------------------------------------ aprobaciones (RF04, RN04)
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select throws_ok($$
  update reservas.reservas set estado = 'aprobada' where id = '20000000-0000-0000-0000-000000000002' $$,
  'P0001', null, 'RF04: el Administrador no puede decidir solicitudes de la bandeja del Coordinador');

select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select throws_ok($$
  update reservas.reservas set estado = 'rechazada', motivo_decision = '  '
  where id = '20000000-0000-0000-0000-000000000002' $$,
  '23514', null, 'RN04 / HU03 escenario 2: rechazar sin motivo no se permite');

select lives_ok($$
  update reservas.reservas set estado = 'rechazada', motivo_decision = 'No cumple protocolo de seguridad'
  where id = '20000000-0000-0000-0000-000000000002' $$,
  'el Coordinador rechaza con motivo');

-- ------------------------------------------------------ cancelación (RF05, RN06 24 h)
reset role;
select set_config('request.jwt.claims', '', true);
insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
values ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-0000000000e1',
        tstzrange(date_trunc('hour', now()) + interval '3 hours', date_trunc('hour', now()) + interval '4 hours'),
        'Reunión hoy');

select pg_temp.como('00000000-0000-0000-0000-0000000000e1');
select throws_ok($$
  update reservas.reservas set estado = 'cancelada', motivo_decision = 'Ya no se necesita'
  where id = '20000000-0000-0000-0000-000000000004' $$,
  'P0001', 'Solo se puede cancelar con mínimo 24 horas de anticipación.',
  'RN06: no se cancela con menos de 24 horas');

select throws_ok($$
  update reservas.reservas set estado = 'cancelada'
  where id = '20000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'RN04: cancelar sin justificación no se permite');

select lives_ok($$
  update reservas.reservas set estado = 'cancelada', motivo_decision = 'Se reprogramó la clase'
  where id = '20000000-0000-0000-0000-000000000001' $$,
  'RF05: el solicitante cancela con justificación y más de 24 h');

select throws_ok($$
  update reservas.reservas set estado = 'aprobada'
  where id = '20000000-0000-0000-0000-000000000001' $$,
  'P0001', null, 'una reserva cancelada no puede volver a aprobarse');

reset role;
select is((select count(*)::int from reservas.historial
           where reserva_id = '20000000-0000-0000-0000-000000000002'), 2,
  'el historial guarda la radicación y el rechazo');

select * from finish();
rollback;
