// Microservicio de RESERVAS: radica solicitudes (Edge Function svc-reservas), consulta las reservas
// propias y las bandejas, y registra decisiones. Las reglas las hace cumplir la base de datos.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/compartido/supabase';
import type {
  Bandeja,
  Decision,
  EstadoReserva,
  Franja,
  Reserva,
  ResultadoRadicacion,
  SolicitudPendiente,
  SolicitudReserva,
} from './reservas.tipos';

// Llama al microservicio svc-reservas (supabase/functions/svc-reservas).
export async function radicarSolicitud(s: SolicitudReserva): Promise<ResultadoRadicacion> {
  const { data, error } = await supabase.functions.invoke<ResultadoRadicacion>('svc-reservas', {
    body: {
      espacio_id: s.espacioId,
      inicio: s.inicio.toISOString(),
      fin: s.fin.toISOString(),
      motivo_uso: s.motivoUso,
      items: (s.items ?? [])
        .filter((i) => i.cantidad > 0)
        .map((i) => ({ item_id: i.itemId, cantidad: i.cantidad })),
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

interface ErrorBD {
  code?: string;
  message: string;
}

// Traduce los errores de la base de datos a un mensaje que el usuario entienda.
export function errorDeReserva(error: ErrorBD, porDefecto: string): Error {
  if (error.code === 'P0001') return new Error(error.message); // mensajes escritos en los triggers
  if (error.code === '23514' && error.message.includes('justificacion')) {
    return new Error('Escribe la justificación.'); // RN04
  }
  if (error.code === '42501') return new Error('No tienes permiso para hacer esto.');
  return new Error(porDefecto);
}

interface FilaReserva {
  id: string;
  espacio_id: string;
  espacio_nombre: string;
  inicio: string;
  fin: string;
  motivo_uso: string;
  estado: EstadoReserva;
  bandeja: Bandeja;
  motivo_decision: string | null;
  recursos: string | null;
}

interface FilaPendiente {
  id: string;
  espacio_nombre: string;
  espacio_estado: string;
  inicio: string;
  fin: string;
  motivo_uso: string;
  responsable_nombre: string;
  responsable_correo: string;
  bandeja: Bandeja;
  recursos: string | null;
}

// INSOFT-34: reservas del usuario de la sesión (función reservas.mis_reservas).
export async function misReservas(): Promise<Reserva[]> {
  const { data, error } = await supabase.schema('reservas').rpc('mis_reservas');
  if (error) throw errorDeReserva(error, 'No se pudieron cargar tus reservas.');
  return ((data ?? []) as FilaReserva[]).map((f) => ({
    id: f.id,
    espacioId: f.espacio_id,
    espacioNombre: f.espacio_nombre,
    inicio: new Date(f.inicio),
    fin: new Date(f.fin),
    motivoUso: f.motivo_uso,
    estado: f.estado,
    bandeja: f.bandeja,
    motivoDecision: f.motivo_decision,
    recursos: f.recursos ?? null,
  }));
}

// INSOFT-37/38: solicitudes pendientes de la bandeja del rol de la sesión (RN05).
export async function bandejaPendiente(): Promise<SolicitudPendiente[]> {
  const { data, error } = await supabase.schema('reservas').rpc('bandeja_pendiente');
  if (error) throw errorDeReserva(error, 'No se pudo cargar la bandeja.');
  return ((data ?? []) as FilaPendiente[]).map((f) => ({
    id: f.id,
    espacioNombre: f.espacio_nombre,
    espacioEnMantenimiento: f.espacio_estado === 'mantenimiento',
    inicio: new Date(f.inicio),
    fin: new Date(f.fin),
    motivoUso: f.motivo_uso,
    responsableNombre: f.responsable_nombre,
    responsableCorreo: f.responsable_correo,
    bandeja: f.bandeja,
    recursos: f.recursos ?? null,
  }));
}

// Cambia el estado de una reserva. El trigger reservas.validar_cambio_estado revisa la transición,
// el rol según la bandeja y las 24 horas para cancelar.
async function decidir(id: string, estado: Decision, motivo: string | null): Promise<void> {
  const { data, error } = await supabase
    .schema('reservas')
    .from('reservas')
    .update({ estado, motivo_decision: motivo?.trim() || null })
    .eq('id', id)
    .select('id');
  if (error) throw errorDeReserva(error, 'No se pudo guardar la decisión.');
  if (!data || data.length === 0) throw new Error('No tienes permiso para cambiar esta reserva o ya no existe.');
}

export const aprobar = (id: string) => decidir(id, 'aprobada', null);
export const rechazar = (id: string, motivo: string) => decidir(id, 'rechazada', motivo);
export const cancelar = (id: string, motivo: string) => decidir(id, 'cancelada', motivo);

// RF02: franjas ocupadas (pendientes o aprobadas) de todos los espacios entre dos fechas,
// sin datos personales. Funciona sin sesión (calendario público).
export async function ocupacionEntre(desde: Date, hasta: Date): Promise<Franja[]> {
  const { data, error } = await supabase
    .schema('reservas')
    .rpc('ocupacion', { p_desde: desde.toISOString(), p_hasta: hasta.toISOString() });
  if (error) throw errorDeReserva(error, 'No se pudo consultar la ocupación.');
  return ((data ?? []) as { espacio_id: string; inicio: string; fin: string; estado: EstadoReserva }[])
    .map((f) => ({ espacioId: f.espacio_id, inicio: new Date(f.inicio), fin: new Date(f.fin), estado: f.estado }))
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

// Franjas ocupadas de un espacio en un día (hora local).
export async function ocupacionDelDia(espacioId: string, dia: Date): Promise<Franja[]> {
  const desde = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const hasta = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
  return (await ocupacionEntre(desde, hasta)).filter((f) => f.espacioId === espacioId);
}

// INSOFT-36: avisa cuando alguien radica, aprueba, rechaza o cancela una reserva, para refrescar
// el calendario sin recargar. La base de datos publica en el canal "ocupacion" de Supabase Realtime
// (trigger reservas.avisar_ocupacion). Devuelve la función para dejar de escuchar.
export function escucharOcupacion(alCambiar: (espacioId: string | null) => void): () => void {
  const canal = supabase
    .channel('ocupacion')
    .on('broadcast', { event: 'cambio' }, (mensaje) => {
      const espacioId = (mensaje.payload as { espacio_id?: string } | undefined)?.espacio_id ?? null;
      alCambiar(espacioId);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(canal);
  };
}
