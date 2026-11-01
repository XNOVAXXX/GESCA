import { FunctionsHttpError } from '@supabase/supabase-js';
import type { SolicitudReserva } from '@/domain/tipos';
import { supabase } from './supabase';

export interface ResultadoRadicacion {
  id: string;
  estado: 'pendiente';
  bandeja: 'administrador' | 'coordinador';
}

// Llama al microservicio svc-reservas (supabase/functions/svc-reservas).
export async function radicarSolicitud(s: SolicitudReserva): Promise<ResultadoRadicacion> {
  const { data, error } = await supabase.functions.invoke<ResultadoRadicacion>('svc-reservas', {
    body: {
      espacio_id: s.espacioId,
      inicio: s.inicio.toISOString(),
      fin: s.fin.toISOString(),
      motivo_uso: s.motivoUso,
    },
  });

  if (error instanceof FunctionsHttpError) {
    const cuerpo = await error.context.json().catch(() => null);
    throw new Error(cuerpo?.error ?? 'No se pudo radicar la solicitud.');
  }
  if (error) throw new Error(error.message);
  if (!data) throw new Error('El servicio de reservas no respondió.');
  return data;
}
