// Llama a una Edge Function de GESCA (svc-*) y convierte su respuesta de error en un mensaje claro.
// Solo la usan los *.api.ts (regla de ESLint), igual que el cliente de Supabase.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function invocarServicio<T>(servicio: string, cuerpo: Record<string, unknown>, porDefecto: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(servicio, { body: cuerpo });

  if (error instanceof FunctionsHttpError) {
    const respuesta = await error.context.json().catch(() => null);
    throw new Error(respuesta?.error ?? porDefecto);
  }
  if (error) throw new Error(porDefecto);
  if (data == null) throw new Error(porDefecto);
  return data;
}
