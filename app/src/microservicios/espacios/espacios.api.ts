// Microservicio de ESPACIOS: catálogo, capacidad, recursos y mantenimiento (RF01, HU02, INSOFT-30).
import { invocarServicio } from '@/compartido/servicios';
import { supabase } from '@/compartido/supabase';
import type { DatosEspacio, Espacio, Item } from './espacios.tipos';

const COLUMNAS = 'id, nombre, tipo, capacidad_max, estado, motivo_estado';
const COLUMNAS_ITEM = 'id, nombre, cantidad';

export async function listarEspacios(): Promise<Espacio[]> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('espacios')
    .select(`${COLUMNAS}, items(${COLUMNAS_ITEM})`)
    .order('nombre');

  if (error) throw new Error(error.message);
  return (data ?? []).map((e: Espacio) => ({
    ...e,
    items: [...(e.items ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  }));
}

// Los cambios pasan por el microservicio svc-espacios (INSOFT-31); la RLS sigue exigiendo rol admin.
const svcEspacios = <T>(cuerpo: Record<string, unknown>, porDefecto: string) =>
  invocarServicio<T>('svc-espacios', cuerpo, porDefecto);

export function crearEspacio(datos: DatosEspacio): Promise<Espacio> {
  return svcEspacios({ accion: 'crear_espacio', ...datos, nombre: datos.nombre.trim() }, 'No se pudo crear el espacio.');
}

export function editarEspacio(id: string, datos: DatosEspacio): Promise<Espacio> {
  return svcEspacios({ accion: 'editar_espacio', id, ...datos, nombre: datos.nombre.trim() }, 'No se pudo guardar el espacio.');
}

// HU02: en mantenimiento el espacio deja de aceptar solicitudes y aprobaciones (RN03, lo aplica la BD).
export function ponerEnMantenimiento(id: string, motivo: string): Promise<Espacio> {
  return svcEspacios({ accion: 'mantenimiento', id, motivo: motivo.trim() }, 'No se pudo cambiar el estado.');
}

export function reactivarEspacio(id: string): Promise<Espacio> {
  return svcEspacios({ accion: 'reactivar', id }, 'No se pudo reactivar el espacio.');
}

// ---------------------------------------------------------------- recursos (INSOFT-30)

export async function itemsDelEspacio(espacioId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('items')
    .select(COLUMNAS_ITEM)
    .eq('espacio_id', espacioId)
    .order('nombre');
  if (error) throw new Error('No se pudieron cargar los recursos del espacio.');
  return data ?? [];
}

export function crearItem(espacioId: string, nombre: string, cantidad: number): Promise<Item> {
  return svcEspacios({ accion: 'crear_item', espacio_id: espacioId, nombre: nombre.trim(), cantidad }, 'No se pudo agregar el recurso.');
}

export function cambiarCantidad(itemId: string, cantidad: number): Promise<Item> {
  return svcEspacios({ accion: 'cambiar_cantidad', id: itemId, cantidad }, 'No se pudo cambiar la cantidad.');
}

export async function eliminarItem(itemId: string): Promise<void> {
  await svcEspacios({ accion: 'eliminar_item', id: itemId }, 'No se pudo quitar el recurso.');
}
