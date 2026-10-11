import type { Espacio } from '@/domain/tipos';
import { supabase } from './supabase';

export async function listarEspacios(): Promise<Espacio[]> {
  const { data, error } = await supabase
    .schema('espacios')
    .from('espacios')
    .select('id, nombre, tipo, capacidad_max, estado')
    .order('nombre');

  if (error) throw new Error(error.message);
  return data ?? [];
}
