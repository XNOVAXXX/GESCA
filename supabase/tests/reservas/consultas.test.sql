-- Pruebas de "Mis reservas" y de las bandejas de aprobación (INSOFT-34, 35, 37, 38).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(16);

-- ---------------------------------------------------------------- datos
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000c1', 'coordinador@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e1', 'estudiante@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e2', 'externo@gmail.com');

update usuarios.perfiles set rol = 'admin'       where id = '00000000-0000-0000-0000-0000000000a1';
update usuarios.perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000c1';

insert into espacios.espacios (id, nombre, tipo, capacidad_max) values
  ('10000000-0000-0000-0000-000000000001', 'Auditorio prueba', 'auditorio', 200),
  ('10000000-0000-0000-0000-000000000002', 'Laboratorio prueba', 'laboratorio', 30);

create temp table t (inicio timestamptz);
insert into t values (date_trunc('hour', now()) + interval '3 days');
grant select on t to authenticated;

create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- R1: estudiante, auditorio → bandeja del Administrador.
-- R2: estudiante, laboratorio → bandeja del Coordinador.
-- R3: externo, auditorio (otra hora) → bandeja del Coordinador.
select pg_temp.como('00000000-0000-0000-0000-0000000000e1');
insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
select '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-0000000000e1', tstzrange(inicio, inicio + interval '2 hours'), 'Clase'
from t;
insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
select '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-0000000000e1', tstzrange(inicio, inicio + interval '1 hour'), 'Práctica'
from t;

select pg_temp.como('00000000-0000-0000-0000-0000000000e2');
insert into reservas.reservas (id, espacio_id, responsable_id, franja, motivo_uso)
select '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-0000000000e2', tstzrange(inicio + interval '4 hours', inicio + interval '5 hours'), 'Evento'
from t;

-- ------------------------------------------------------ Mis reservas (INSOFT-34)
select is((select count(*)::int from reservas.mis_reservas()), 1, 'el externo solo ve su propia reserva');

select pg_temp.como('00000000-0000-0000-0000-0000000000e1');
select is((select count(*)::int from reservas.mis_reservas()), 2, 'el estudiante ve sus dos reservas');
select is((select espacio_nombre from reservas.mis_reservas() where id = '20000000-0000-0000-0000-000000000001'),
  'Auditorio prueba', 'cada reserva trae el nombre del espacio');

-- ------------------------------------------------------ Bandejas (INSOFT-37/38, RN05)
select is((select count(*)::int from reservas.bandeja_pendiente()), 0, 'un solicitante no tiene bandeja');

select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select results_eq('select id from reservas.bandeja_pendiente()',
  $$values ('20000000-0000-0000-0000-000000000001'::uuid)$$,
  'la bandeja del Administrador solo tiene la solicitud que le corresponde');

select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select set_eq('select id from reservas.bandeja_pendiente()',
  $$values ('20000000-0000-0000-0000-000000000002'::uuid), ('20000000-0000-0000-0000-000000000003'::uuid)$$,
  'la bandeja del Coordinador tiene el laboratorio y la del correo externo');
select is((select responsable_correo from reservas.bandeja_pendiente() where id = '20000000-0000-0000-0000-000000000003'),
  'externo@gmail.com', 'la bandeja muestra quién pidió el espacio');

-- ------------------------------------------------------ Aprobar y rechazar
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$
  update reservas.reservas set estado = 'aprobada' where id = '20000000-0000-0000-0000-000000000001' $$,
  'el Administrador aprueba una solicitud de su bandeja');
select is((select count(*)::int from reservas.bandeja_pendiente()), 0, 'la solicitud aprobada sale de la bandeja');

select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select throws_ok($$
  update reservas.reservas set estado = 'rechazada' where id = '20000000-0000-0000-0000-000000000002' $$,
  '23514', null, 'RN04: rechazar sin justificación no se permite');
select lives_ok($$
  update reservas.reservas set estado = 'rechazada', motivo_decision = 'El laboratorio está reservado para parciales'
  where id = '20000000-0000-0000-0000-000000000002' $$,
  'el Coordinador rechaza con justificación');

-- ------------------------------------------------------ Cancelar (INSOFT-35)
select pg_temp.como('00000000-0000-0000-0000-0000000000e2');
select lives_ok($$
  update reservas.reservas set estado = 'cancelada', motivo_decision = 'Se aplazó el evento'
  where id = '20000000-0000-0000-0000-000000000003' $$,
  'el solicitante cancela su reserva con justificación');

select pg_temp.como('00000000-0000-0000-0000-0000000000e1');
select is((select estado::text from reservas.mis_reservas() where id = '20000000-0000-0000-0000-000000000001'),
  'aprobada', 'el solicitante ve su reserva aprobada');
select is((select motivo_decision from reservas.mis_reservas() where id = '20000000-0000-0000-0000-000000000002'),
  'El laboratorio está reservado para parciales', 'el solicitante ve el motivo del rechazo');

select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from reservas.bandeja_pendiente()), 0, 'la bandeja del Coordinador queda vacía');

reset role;
set local role anon;
select throws_ok('select * from reservas.mis_reservas()', '42501', null,
  'sin sesión no se pueden consultar reservas');

select * from finish();
rollback;
