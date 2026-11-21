// Microservicio de NOTIFICACIONES (INSOFT-40): envía un correo al solicitante cuando su reserva
// se aprueba, se rechaza o se cancela. Solo lo llaman otros servicios con la llave de servicio.
//
// Usa SMTP (por ejemplo Gmail con contraseña de aplicación). Secretos de la función:
//   SMTP_HOST (smtp.gmail.com), SMTP_PORT (465), SMTP_USER, SMTP_PASS, SMTP_FROM (opcional)
// Sin esos secretos no falla: responde { enviado: false } y la decisión ya quedó guardada.
import nodemailer from 'npm:nodemailer@6.9.16';
import { clienteDeServicio, cors, leerCuerpo, responder } from '../_compartido/http.ts';

const TITULO: Record<string, string> = {
  aprobada: 'Tu reserva fue aprobada',
  rechazada: 'Tu reserva fue rechazada',
  cancelada: 'Tu reserva fue cancelada',
};

// Postgres entrega "2026-11-24 13:00:00+00"; se lleva a ISO para que Date lo entienda en cualquier motor.
const aFecha = (t: string) => new Date(t.trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));

const fecha = (d: Date) =>
  d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

const escapar = (t: string) =>
  t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  // Solo otros servicios de GESCA (con la llave de servicio) pueden pedir un correo.
  const llave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!llave || req.headers.get('Authorization') !== `Bearer ${llave}`) {
    return responder(401, { error: 'No autorizado.' });
  }

  const p = await leerCuerpo<{ reserva_id?: string }>(req);
  if (!p?.reserva_id) return responder(400, { error: 'Falta la reserva.' });

  const supabase = clienteDeServicio();
  const { data: r, error } = await supabase
    .schema('reservas')
    .from('reservas')
    .select('id, espacio_id, responsable_id, franja, estado, motivo_decision')
    .eq('id', p.reserva_id)
    .single();
  if (error || !r) return responder(404, { error: 'La reserva no existe.' });
  if (!TITULO[r.estado]) return responder(200, { enviado: false, motivo: 'Ese estado no se notifica.' });

  const [{ data: espacio }, { data: perfil }] = await Promise.all([
    supabase.schema('espacios').from('espacios').select('nombre').eq('id', r.espacio_id).single(),
    supabase.schema('usuarios').from('perfiles').select('nombre, correo').eq('id', r.responsable_id).single(),
  ]);
  if (!perfil?.correo) return responder(200, { enviado: false, motivo: 'El solicitante no tiene correo.' });

  const host = Deno.env.get('SMTP_HOST');
  const usuario = Deno.env.get('SMTP_USER');
  const clave = Deno.env.get('SMTP_PASS');
  if (!host || !usuario || !clave) {
    return responder(200, { enviado: false, motivo: 'El correo no está configurado (secretos SMTP_*).' });
  }

  // franja llega como texto "[inicio,fin)".
  const [inicio, fin] = String(r.franja).replace(/^[[(]|[\])]$/g, '').split(',').map((t) => t.replaceAll('"', ''));
  const titulo = TITULO[r.estado];
  const lineas = [
    `Hola, ${perfil.nombre}.`,
    `${titulo}: ${espacio?.nombre ?? 'Espacio'}, ${fecha(aFecha(inicio))} a ${aFecha(fin).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}.`,
    ...(r.motivo_decision ? [`Justificación: ${r.motivo_decision}`] : []),
    'Puedes ver el detalle en GESCA → Mi panel → Mis reservas.',
  ];

  try {
    const puerto = Number(Deno.env.get('SMTP_PORT') ?? '465');
    const transporte = nodemailer.createTransport({
      host,
      port: puerto,
      secure: puerto === 465,
      auth: { user: usuario, pass: clave },
    });
    await transporte.sendMail({
      from: Deno.env.get('SMTP_FROM') ?? `GESCA <${usuario}>`,
      to: perfil.correo,
      subject: `GESCA: ${titulo.toLowerCase()}`,
      text: lineas.join('\n\n'),
      html: `<div style="font-family:Arial,sans-serif;color:#000">${lineas
        .map((l) => `<p>${escapar(l)}</p>`)
        .join('')}<p style="color:#666">I.U. Pascual Bravo · Gestión de espacios</p></div>`,
    });
    return responder(200, { enviado: true });
  } catch (e) {
    console.error('svc-notificaciones: no se pudo enviar el correo', e);
    return responder(200, { enviado: false, motivo: 'El servidor de correo rechazó el envío.' });
  }
});
