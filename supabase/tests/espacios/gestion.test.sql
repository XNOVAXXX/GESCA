-- Gestión de espacios (INSOFT-28) y mantenimiento con motivo (HU02, INSOFT-29).
-- Se ejecuta con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000c1', 'coordinador@pascualbravo.edu.co');

update usuarios.perfiles set rol = 'admin'       where id = '00000000-0000-0000-0000-0000000000a1';
update usuarios.perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000c1';

-- Actúa como el usuario indicado (igual que una petición con su sesión).
create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ----------------------------------------------------------- registrar
select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
select throws_ok($$ insert into espacios.espacios (nombre, tipo, capacidad_max)
                    values ('Sala del coordinador', 'sala_computo', 20) $$,
  '42501', null, 'un coordinador no puede registrar espacios');

select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$ insert into espacios.espacios (id, nombre, tipo, capacidad_max)
                   values ('20000000-0000-0000-0000-000000000001', 'Auditorio Gesca', 'auditorio', 150) $$,
  'el administrador registra un espacio');

select throws_ok($$ insert into espacios.espacios (nombre, tipo, capacidad_max)
                    values ('  auditorio gesca ', 'auditorio', 80) $$,
  '23505', null, 'el nombre es único aunque cambien mayúsculas y espacios');

select throws_ok($$ insert into espacios.espacios (nombre, tipo, capacidad_max)
                    values ('Cancha sin cupo', 'cancha', 0) $$,
  '23514', null, 'la capacidad máxima debe ser mayor que 0');

-- -------------------------------------------------------------- editar
update espacios.espacios set capacidad_max = 180 where id = '20000000-0000-0000-0000-000000000001';
select is((select capacidad_max from espacios.espacios where id = '20000000-0000-0000-0000-000000000001'),
  180, 'el administrador edita la capacidad');

-- --------------------------------------------------------- mantenimiento
select throws_ok($$ update espacios.espacios set estado = 'mantenimiento', motivo_estado = '   '
                    where id = '20000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'HU02: sin motivo no se guarda el mantenimiento');

update espacios.espacios set estado = 'mantenimiento', motivo_estado = ' Cambio de sillas '
  where id = '20000000-0000-0000-0000-000000000001';
select is((select motivo_estado from espacios.espacios where id = '20000000-0000-0000-0000-000000000001'),
  'Cambio de sillas', 'HU02: con motivo el espacio queda en mantenimiento');

-- RN03 ya lo prueba reglas.test.sql; aquí se comprueba que el coordinador no puede reactivarlo.
select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
update espacios.espacios set estado = 'activo' where id = '20000000-0000-0000-0000-000000000001';
select is((select estado::text from espacios.espacios where id = '20000000-0000-0000-0000-000000000001'),
  'mantenimiento', 'un coordinador no puede reactivar un espacio');

select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
update espacios.espacios set estado = 'activo' where id = '20000000-0000-0000-0000-000000000001';
select is((select motivo_estado from espacios.espacios where id = '20000000-0000-0000-0000-000000000001'),
  null, 'al reactivar se borra el motivo anterior');

select * from finish();
rollback;
