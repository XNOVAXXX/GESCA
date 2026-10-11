// Microservicio de RESERVAS: radica solicitudes (RF03).
// Las reglas (cruces, 2 horas, 15 días, mantenimiento, enrutamiento) las aplica la base de
// datos; este servicio identifica al usuario y traduce los errores a mensajes claros.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

interface Solicitud {
  espacio_id?: string;
  inicio?: string;
  fin?: string;
  motivo_uso?: string;
}

function mensajeDeError(code: string | undefined, message: string): string {
  if (code === '23P01') return 'El espacio ya está reservado en esa franja horaria.';
  if (code === '23514' && message.includes('duracion_maxima')) return 'El límite máximo por evento es de 2 horas.';
  if (code === 'P0001') return message; // mensajes escritos en los triggers
  return 'No se pudo radicar la solicitud.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  // Cliente con la sesión del usuario: aplica RLS y auth.uid() en la base de datos.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return responder(401, { error: 'Debes verificar tu correo para radicar una solicitud.' });

  let s: Solicitud;
  try {
    s = await req.json();
  } catch {
    return responder(400, { error: 'Solicitud inválida.' });
  }
  if (!s.espacio_id || !s.inicio || !s.fin || !s.motivo_uso?.trim()) {
    return responder(400, { error: 'Faltan datos: espacio, inicio, fin y motivo de uso.' });
  }

  const { data, error } = await supabase
    .schema('reservas')
    .from('reservas')
    .insert({
      espacio_id: s.espacio_id,
      responsable_id: auth.user.id,
      franja: `[${s.inicio},${s.fin})`,
      motivo_uso: s.motivo_uso.trim(),
    })
    .select('id, estado, bandeja')
    .single();

  if (error) return responder(409, { error: mensajeDeError(error.code, error.message) });
  return responder(201, data);
});
