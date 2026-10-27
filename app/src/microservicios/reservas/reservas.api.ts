// Microservicio de RESERVAS: radica solicitudes a través de la Edge Function svc-reservas.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/compartido/supabase';
import type { ResultadoRadicacion, SolicitudReserva } from './reservas.tipos';

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
