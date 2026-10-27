import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { validarSolicitud } from '@/microservicios/reservas/reservas.reglas';
import { radicarSolicitud } from '@/microservicios/reservas/reservas.api';
import { useSesion } from '@/microservicios/usuarios';

// Convierte "AAAA-MM-DD" + "HH:MM" en fecha local; null si el formato no es válido.
function aFecha(fecha: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const d = new Date(`${fecha}T${hora}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useSolicitarReserva() {
  const { espacioId = '', nombre = '' } = useLocalSearchParams<{ espacioId: string; nombre: string }>();
  const { perfil } = useSesion();

  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivoUso, setMotivoUso] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const enviar = async () => {
    setConfirmacion(null);
    const inicio = aFecha(fecha, horaInicio);
    const fin = aFecha(fecha, horaFin);
    if (!inicio || !fin) {
      setErrores(['Usa el formato AAAA-MM-DD para la fecha y HH:MM para las horas.']);
      return;
    }

    const solicitud = { espacioId, inicio, fin, motivoUso };
    const encontrados = validarSolicitud(solicitud);
    setErrores(encontrados);
    if (encontrados.length > 0) return; // HU01 escenario 2: el formulario sigue en edición

    // Solo un correo verificado puede radicar (RNF01). Después de verificar vuelve a este formulario.
    if (!perfil) {
      const volver = `/reservas/solicitar?espacioId=${encodeURIComponent(espacioId)}&nombre=${encodeURIComponent(nombre)}`;
      router.push({ pathname: '/acceso/verificar', params: { volver } });
      return;
    }

    setEnviando(true);
    try {
      const r = await radicarSolicitud(solicitud);
      setConfirmacion(
        r.bandeja === 'coordinador'
          ? 'Solicitud radicada. Requiere aprobación de Coordinación.'
          : 'Solicitud radicada en estado Pendiente.',
      );
    } catch (e) {
      setErrores([mensajeDe(e, 'No se pudo radicar la solicitud.')]);
    } finally {
      setEnviando(false);
    }
  };

  return {
    nombreEspacio: nombre,
    fecha,
    setFecha,
    horaInicio,
    setHoraInicio,
    horaFin,
    setHoraFin,
    motivoUso,
    setMotivoUso,
    errores,
    enviando,
    confirmacion,
    enviar,
    correoVerificado: perfil?.correo ?? null,
  };
}

export type SolicitarReservaProps = ReturnType<typeof useSolicitarReserva>;
