-- =====================================================================
-- Dominio USUARIOS: asignación de roles (INSOFT-27)
-- =====================================================================

-- Desde la app solo se puede cambiar el rol (y solo un admin, por la política
-- "solo admin cambia perfiles"). El nombre y el correo vienen de Auth.
revoke update on usuarios.perfiles from authenticated;
grant update (rol) on usuarios.perfiles to authenticated;

-- Siempre debe quedar al menos un administrador; si no, nadie podría volver a asignar roles.
create function usuarios.conservar_un_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'admin' and new.rol <> 'admin' and not exists (
    select 1 from usuarios.perfiles where rol = 'admin' and id <> old.id
  ) then
    raise exception 'Debe quedar al menos un administrador.';
  end if;
  return new;
end;
$$;

create trigger al_cambiar_rol
  before update of rol on usuarios.perfiles
  for each row execute function usuarios.conservar_un_admin();
