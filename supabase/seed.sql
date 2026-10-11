-- Datos de EJEMPLO para desarrollo local (`supabase db reset`).
-- Reemplazar por los espacios reales de la Sede Cata cuando estén levantados.
insert into espacios.espacios (nombre, tipo, capacidad_max, estado, motivo_estado) values
  ('Auditorio Principal',      'auditorio',          250, 'activo',        null),
  ('Sala de Cómputo 101',      'sala_computo',        30, 'activo',        null),
  ('Sala de Cómputo 102',      'sala_computo',        30, 'mantenimiento', 'Cambio de equipos'),
  ('Cancha Múltiple',          'cancha',              40, 'activo',        null),
  ('Laboratorio de Química',   'laboratorio',         24, 'activo',        null),
  ('Sala de Estudio Compartida','espacio_compartido', 20, 'activo',        null);

insert into espacios.items (espacio_id, nombre, cantidad)
select e.id, i.nombre, i.cantidad
from espacios.espacios e
join (values
  ('Auditorio Principal',    'Micrófono inalámbrico', 4),
  ('Auditorio Principal',    'Consola de sonido',     1),
  ('Auditorio Principal',    'Video beam',            1),
  ('Sala de Cómputo 101',    'Computador',           30),
  ('Cancha Múltiple',        'Balón',                 6),
  ('Laboratorio de Química', 'Kit de seguridad',     24),
  ('Sala de Estudio Compartida', 'Silla',            20)
) as i(espacio, nombre, cantidad) on i.espacio = e.nombre;
