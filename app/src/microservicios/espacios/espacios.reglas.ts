// Reglas del catálogo de espacios que se validan en pantalla antes de llamar a Supabase.
// La base de datos aplica las mismas reglas, así que esto solo evita viajes inútiles.

export const LONGITUD_MINIMA_MOTIVO = 5;

// INSOFT-28: nombre obligatorio y capacidad máxima mayor que 0.
export function validarEspacio(nombre: string, capacidad: string): string | null {
  if (!nombre.trim()) return 'Escribe el nombre del espacio.';
  if (!/^\d+$/.test(capacidad.trim()) || Number(capacidad) <= 0) {
    return 'La capacidad máxima debe ser un número entero mayor que 0.';
  }
  return null;
}

// HU02 (INSOFT-29): sin motivo no se puede poner un espacio en mantenimiento.
export function validarMotivo(motivo: string): string | null {
  return motivo.trim().length >= LONGITUD_MINIMA_MOTIVO
    ? null
    : 'Indica el motivo del mantenimiento (mínimo 5 caracteres).';
}

// Dos nombres son el mismo espacio aunque cambien mayúsculas o espacios sobrantes.
export function mismoNombre(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
