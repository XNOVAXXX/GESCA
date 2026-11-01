// Microservicio de ESPACIOS: lee el catálogo del esquema espacios (RF01).
import { supabase } from '@/compartido/supabase';
import type { Espacio } from './espacios.tipos';

export async function listarEspacios(): Promise<Espacio[]> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('espacios')
    .select('id, nombre, tipo, capacidad_max, estado')
    .order('nombre');

  if (error) throw new Error(error.message);
  return data ?? [];
}
