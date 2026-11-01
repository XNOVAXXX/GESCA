-- Asignación de roles (INSOFT-27). Se ejecuta con `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000c1', 'coordinador@pascualbravo.edu.co'),
  ('00000000-0000-0000-0000-0000000000e1', 'estudiante@pascualbravo.edu.co');

update usuarios.perfiles set rol = 'admin'       where id = '00000000-0000-0000-0000-0000000000a1';
update usuarios.perfiles set rol = 'coordinador' where id = '00000000-0000-0000-0000-0000000000c1';

-- Actúa como el usuario indicado (igual que una petición con su sesión).
create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- El coordinador no puede asignar roles: la política de RLS no le deja tocar la fila.
select pg_temp.como('00000000-0000-0000-0000-0000000000c1');
update usuarios.perfiles set rol = 'admin' where id = '00000000-0000-0000-0000-0000000000e1';
select is((select rol::text from usuarios.perfiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'solicitante', 'un coordinador no puede cambiar roles');

-- El administrador sí.
select pg_temp.como('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$ update usuarios.perfiles set rol = 'coordinador'
                   where id = '00000000-0000-0000-0000-0000000000e1' $$,
  'el administrador asigna el rol coordinador');
select is((select rol::text from usuarios.perfiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'coordinador', 'el rol queda guardado');

-- Desde la app solo se puede cambiar el rol, ni siquiera un admin cambia el nombre o el correo.
select throws_ok($$ update usuarios.perfiles set correo = 'otro@gmail.com'
                    where id = '00000000-0000-0000-0000-0000000000e1' $$,
  '42501', null, 'el correo no se puede cambiar desde la app');

-- El único administrador no puede quitarse el rol.
select throws_ok($$ update usuarios.perfiles set rol = 'solicitante'
                    where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'P0001', 'Debe quedar al menos un administrador.', 'siempre queda al menos un administrador');

select * from finish();
rollback;
