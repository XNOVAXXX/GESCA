// Microservicio de ESPACIOS: catálogo, capacidad y mantenimiento (RF01, HU02).
import { supabase } from '@/compartido/supabase';
import type { DatosEspacio, Espacio } from './espacios.tipos';

const COLUMNAS = 'id, nombre, tipo, capacidad_max, estado, motivo_estado';

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
  const { data, error } = await supabase.schema('espacios').from('espacios').select(COLUMNAS).order('nombre');

  if (error) throw new Error(error.message);
  return data ?? [];
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
