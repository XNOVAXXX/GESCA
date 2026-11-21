// Microservicio de ESPACIOS: catálogo, capacidad, recursos y mantenimiento (RF01, HU02, INSOFT-30).
import { supabase } from '@/compartido/supabase';
import type { DatosEspacio, Espacio, Item } from './espacios.tipos';

const COLUMNAS = 'id, nombre, tipo, capacidad_max, estado, motivo_estado';
const COLUMNAS_ITEM = 'id, nombre, cantidad';

interface ErrorBD {
  code?: string;
  message: string;
}

// Traduce los errores de la base de datos a un mensaje que el administrador entienda.
function errorDeEspacio(error: ErrorBD, porDefecto: string): Error {
  if (error.code === '23505') return new Error('Ya existe un espacio con ese nombre.');
  if (error.code === '23514') {
    if (error.message.includes('mantenimiento_con_motivo')) {
      return new Error('Indica el motivo del mantenimiento.');
    }
    return new Error('Revisa los datos: el nombre es obligatorio y la capacidad debe ser mayor que 0.');
  }
  if (error.code === '42501') return new Error('Solo un administrador puede gestionar espacios.');
  return new Error(porDefecto);
}

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

export async function crearEspacio(datos: DatosEspacio): Promise<Espacio> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('espacios')
    .insert({ ...datos, nombre: datos.nombre.trim() })
    .select(COLUMNAS)
    .single();

  if (error) throw errorDeEspacio(error, 'No se pudo crear el espacio.');
  return data;
}

// RLS deja la fila sin tocar (sin error) cuando quien edita no es admin; por eso se pide la fila de vuelta.
async function actualizar(id: string, cambios: Record<string, unknown>, porDefecto: string): Promise<Espacio> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('espacios')
    .update(cambios)
    .eq('id', id)
    .select(COLUMNAS);

  if (error) throw errorDeEspacio(error, porDefecto);
  if (!data?.length) throw new Error(porDefecto);
  return data[0];
}

export function editarEspacio(id: string, datos: DatosEspacio): Promise<Espacio> {
  return actualizar(id, { ...datos, nombre: datos.nombre.trim() }, 'No se pudo guardar el espacio.');
}

// HU02: en mantenimiento el espacio deja de aceptar solicitudes y aprobaciones (RN03, lo aplica la BD).
export function ponerEnMantenimiento(id: string, motivo: string): Promise<Espacio> {
  return actualizar(id, { estado: 'mantenimiento', motivo_estado: motivo.trim() }, 'No se pudo cambiar el estado.');
}

export function reactivarEspacio(id: string): Promise<Espacio> {
  return actualizar(id, { estado: 'activo', motivo_estado: null }, 'No se pudo reactivar el espacio.');
}

// ---------------------------------------------------------------- recursos (INSOFT-30)

function errorDeItem(error: ErrorBD, porDefecto: string): Error {
  if (error.code === '23505') return new Error('Ese espacio ya tiene un recurso con ese nombre.');
  if (error.code === '23503') {
    return new Error('Este recurso ya se pidió en reservas. En lugar de quitarlo, deja su cantidad en 0.');
  }
  if (error.code === '23514') return new Error('Revisa los datos: el nombre es obligatorio y la cantidad no puede ser negativa.');
  if (error.code === '42501') return new Error('Solo un administrador puede gestionar recursos.');
  return new Error(porDefecto);
}

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

export async function crearItem(espacioId: string, nombre: string, cantidad: number): Promise<Item> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('items')
    .insert({ espacio_id: espacioId, nombre: nombre.trim(), cantidad })
    .select(COLUMNAS_ITEM)
    .single();
  if (error) throw errorDeItem(error, 'No se pudo agregar el recurso.');
  return data;
}

export async function cambiarCantidad(itemId: string, cantidad: number): Promise<Item> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('items')
    .update({ cantidad })
    .eq('id', itemId)
    .select(COLUMNAS_ITEM);
  if (error) throw errorDeItem(error, 'No se pudo cambiar la cantidad.');
  if (!data?.length) throw new Error('No se pudo cambiar la cantidad.');
  return data[0];
}

export async function eliminarItem(itemId: string): Promise<void> {
  const { data, error } = await supabase.schema('espacios').from('items').delete().eq('id', itemId).select('id');
  if (error) throw errorDeItem(error, 'No se pudo quitar el recurso.');
  if (!data?.length) throw new Error('No se pudo quitar el recurso.');
}
