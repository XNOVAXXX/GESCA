-- Pruebas de HU01 con recursos (INSOFT-33) y de los recursos de cada espacio (INSOFT-30).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e1', 'estudiante@pascualbravo.edu.co');
update usuarios.perfiles set rol = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into espacios.espacios (id, nombre, tipo, capacidad_max) values
  ('10000000-0000-0000-0000-000000000001', 'Auditorio prueba', 'auditorio', 200),
  ('10000000-0000-0000-0000-000000000002', 'Cancha prueba', 'cancha', 40);

create temp table t (inicio timestamptz);
insert into t values (date_trunc('hour', now()) + interval '3 days');
grant select on t to authenticated;

create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ------------------------------------------------------ INSOFT-30: recursos del espacio
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$
  insert into espacios.items (id, espacio_id, nombre, cantidad) values
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Micrófono', 4),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Video beam', 1),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Balón', 6) $$,
  'el administrador registra recursos con su cantidad');

select pg_temp.como('00000000-0000-0000-0000-0000000000e1');
select is((select count(*)::int from espacios.items), 3, 'cualquiera puede ver los recursos');
update espacios.items set cantidad = 99;
select is((select max(cantidad) from espacios.items), 6, 'un solicitante no puede cambiar los recursos');

-- ------------------------------------------------------ HU01 con recursos
select lives_ok($$
  select reservas.radicar('10000000-0000-0000-0000-000000000001', inicio, inicio + interval '2 hours', 'Conferencia',
    '[{"item_id": "30000000-0000-0000-0000-000000000001", "cantidad": 2},
      {"item_id": "30000000-0000-0000-0000-000000000002", "cantidad": 1}]'::jsonb)
  from t $$,
  'se radica una reserva con dos recursos');

select is((select recursos from reservas.mis_reservas()), 'Micrófono x2, Video beam x1',
  'Mis reservas muestra los recursos pedidos');

select throws_ok($$
  select reservas.radicar('10000000-0000-0000-0000-000000000001', inicio + interval '3 hours', inicio + interval '4 hours',
    'Mucho', '[{"item_id": "30000000-0000-0000-0000-000000000001", "cantidad": 9}]'::jsonb)
  from t $$,
  'P0001', null, 'no se pueden pedir más unidades de las que tiene el espacio');

select throws_ok($$
  select reservas.radicar('10000000-0000-0000-0000-000000000001', inicio + interval '5 hours', inicio + interval '6 hours',
    'Ajeno', '[{"item_id": "30000000-0000-0000-0000-000000000003", "cantidad": 1}]'::jsonb)
  from t $$,
  'P0001', null, 'no se puede pedir un recurso de otro espacio');

select is((select count(*)::int from reservas.mis_reservas()), 1,
  'si un recurso no es válido no queda la reserva a medias');

reset role;
set local role anon;
select throws_ok($$
  select reservas.radicar('10000000-0000-0000-0000-000000000002', now() + interval '2 days',
    now() + interval '2 days 1 hour', 'Sin sesión') $$,
  '42501', null, 'sin sesión no se puede radicar');

select * from finish();
rollback;
