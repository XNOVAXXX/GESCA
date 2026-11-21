// Microservicio de APROBACIONES (INSOFT-39): aprueba, rechaza o cancela una reserva.
// Trabaja con la sesión de quien llama, así que la base de datos valida la bandeja y el rol (RF04, RN05),
// la justificación (RN04) y las 24 horas para cancelar (RN06). Después pide a svc-notificaciones
// que avise por correo al solicitante (INSOFT-40); si el correo falla, la decisión queda guardada igual.
import { clienteDelUsuario, cors, type ErrorBD, leerCuerpo, responder } from '../_compartido/http.ts';

type Accion = 'aprobar' | 'rechazar' | 'cancelar';

interface Peticion {
  accion?: Accion;
  reserva_id?: string;
  motivo?: string;
}

const ESTADO: Record<Accion, string> = { aprobar: 'aprobada', rechazar: 'rechazada', cancelar: 'cancelada' };

function mensajeDeError(e: ErrorBD): string {
  if (e.code === 'P0001') return e.message; // mensajes escritos en los triggers
  if (e.code === '23514' && e.message.includes('justificacion')) return 'Escribe la justificación.';
  if (e.code === '42501') return 'No tienes permiso para hacer esto.';
  return 'No se pudo guardar la decisión.';
}

async function notificar(reservaId: string): Promise<boolean> {
  try {
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/svc-notificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ reserva_id: reservaId }),
    });
    const cuerpo = await r.json().catch(() => null);
    return r.ok && cuerpo?.enviado === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  const supabase = clienteDelUsuario(req);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return responder(401, { error: 'Debes ingresar para decidir una solicitud.' });

  const p = await leerCuerpo<Peticion>(req);
  if (!p?.accion || !(p.accion in ESTADO) || !p.reserva_id) {
    return responder(400, { error: 'Indica la acción (aprobar, rechazar o cancelar) y la reserva.' });
  }

  const motivo = p.motivo?.trim() || null;
  if (p.accion !== 'aprobar' && !motivo) return responder(400, { error: 'Escribe la justificación.' }); // RN04

  const { data, error } = await supabase
    .schema('reservas')
    .from('reservas')
    .update({ estado: ESTADO[p.accion], motivo_decision: motivo })
    .eq('id', p.reserva_id)
    .select('id, estado');

  if (error) return responder(409, { error: mensajeDeError(error) });
  if (!data || data.length === 0) {
    return responder(403, { error: 'No tienes permiso para cambiar esta reserva o ya no existe.' });
  }

  const correoEnviado = await notificar(p.reserva_id);
  return responder(200, { ...data[0], correo_enviado: correoEnviado });
});
