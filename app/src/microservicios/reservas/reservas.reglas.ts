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
