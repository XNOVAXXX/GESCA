-- =====================================================================
-- Gestión de espacios (INSOFT-28) y mantenimiento con motivo (HU02, INSOFT-29)
-- =====================================================================

-- Nombre único sin importar mayúsculas ni espacios sobrantes ("Auditorio" = " auditorio ").
create unique index espacios_nombre_unico_ci on espacios.espacios (lower(trim(nombre)));

-- Al reactivar un espacio se borra el motivo del mantenimiento anterior,
-- así el catálogo nunca muestra un motivo viejo en un espacio activo.
create function espacios.limpiar_motivo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'activo' then
    new.motivo_estado := null;
  else
    new.motivo_estado := trim(new.motivo_estado);
  end if;
  return new;
end;
$$;

create trigger al_cambiar_estado
  before insert or update of estado, motivo_estado on espacios.espacios
  for each row execute function espacios.limpiar_motivo();
