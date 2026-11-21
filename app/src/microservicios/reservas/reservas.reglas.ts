// Copia de las reglas de reservas para dar retroalimentación inmediata en pantalla.
// La validación definitiva la hace la base de datos (supabase/migrations/*_reservas.sql); esto
// solo evita enviar solicitudes que de todas formas serían rechazadas.
import type { SolicitudReserva } from './reservas.tipos';

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

export const DURACION_MAXIMA_HORAS = 2; // RN06
export const ANTICIPACION_MAXIMA_DIAS = 15; // RN06

export function validarSolicitud(s: SolicitudReserva, ahora = new Date()): string[] {
  const errores: string[] = [];
  const duracion = s.fin.getTime() - s.inicio.getTime();

  if (!s.espacioId) errores.push('Selecciona un espacio.');
  if (duracion <= 0) errores.push('La hora de fin debe ser posterior a la de inicio.');
  if (duracion > DURACION_MAXIMA_HORAS * HORA_MS)
    errores.push(`El límite máximo por evento es de ${DURACION_MAXIMA_HORAS} horas.`);
  if (s.inicio.getTime() <= ahora.getTime()) errores.push('La reserva debe ser en el futuro.');
  if (s.inicio.getTime() > ahora.getTime() + ANTICIPACION_MAXIMA_DIAS * DIA_MS)
    errores.push(`Solo se puede reservar con máximo ${ANTICIPACION_MAXIMA_DIAS} días de anticipación.`);
  if (!s.motivoUso.trim()) errores.push('Indica el motivo de uso.');

  return errores;
}

export const ANTICIPACION_MINIMA_CANCELAR_HORAS = 24; // RN06

// RN06: una reserva pendiente o aprobada se cancela con mínimo 24 horas de anticipación.
export function puedeCancelar(r: { estado: string; inicio: Date }, ahora = new Date()): boolean {
  if (r.estado !== 'pendiente' && r.estado !== 'aprobada') return false;
  return r.inicio.getTime() - ahora.getTime() >= ANTICIPACION_MINIMA_CANCELAR_HORAS * HORA_MS;
}

// RN04: rechazar o cancelar exige una justificación.
export function validarJustificacion(motivo: string): string | null {
  return motivo.trim() ? null : 'Escribe la justificación.';
}

// Días que se pueden reservar: desde hoy hasta 15 días después (RN06).
export function diasReservables(ahora = new Date()): Date[] {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Array.from({ length: ANTICIPACION_MAXIMA_DIAS + 1 }, (_, i) =>
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i),
  );
}
