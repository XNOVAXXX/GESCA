import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { cancelar, misReservas } from '@/microservicios/reservas/reservas.api';
import { franja } from '@/microservicios/reservas/reservas.formato';
import { puedeCancelar, validarJustificacion } from '@/microservicios/reservas/reservas.reglas';
import { NOMBRE_BANDEJA, NOMBRE_ESTADO_RESERVA, type Reserva } from '@/microservicios/reservas/reservas.tipos';
import { useSesion } from '@/microservicios/usuarios';

// INSOFT-32 (mis reservas y su estado) e INSOFT-33 (cancelar con justificación, RN04 y RN06).
export function useMisReservas() {
  const { perfil, cargando: verificando } = useSesion();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cancelacion, setCancelacion] = useState<{ id: string; motivo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0);

  // Sin sesión, primero se verifica el correo y luego se vuelve aquí.
  useEffect(() => {
    if (!verificando && !perfil) {
      router.replace({ pathname: '/acceso/verificar', params: { volver: '/reservas/mias' } });
    }
  }, [verificando, perfil]);

  useEffect(() => {
    if (!perfil) return;
    let vigente = true;
    misReservas()
      .then((lista) => {
        if (vigente) setReservas(lista);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDe(e, 'No se pudieron cargar tus reservas.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [perfil, version]);

  const confirmarCancelacion = async () => {
    if (!cancelacion) return;
    const invalido = validarJustificacion(cancelacion.motivo);
    setAviso(null);
    setError(invalido);
    if (invalido) return;

    setGuardando(true);
    try {
      await cancelar(cancelacion.id, cancelacion.motivo);
      setCancelacion(null);
      setAviso('La reserva quedó cancelada y el horario vuelve a estar disponible.');
      setVersion((v) => v + 1);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo cancelar la reserva.'));
    } finally {
      setGuardando(false);
    }
  };

  const filas = useMemo(() => {
    const ahora = new Date();
    return reservas.map((r) => ({
      id: r.id,
      espacio: r.espacioNombre,
      horario: franja(r.inicio, r.fin),
      motivoUso: r.motivoUso,
      estado: r.estado,
      nombreEstado: NOMBRE_ESTADO_RESERVA[r.estado],
      aprueba: NOMBRE_BANDEJA[r.bandeja],
      motivoDecision: r.motivoDecision,
      cancelable: puedeCancelar(r, ahora),
      // Pendiente o aprobada a menos de 24 horas: se informa por qué no se puede cancelar.
      sinCancelacion: (r.estado === 'pendiente' || r.estado === 'aprobada') && !puedeCancelar(r, ahora) && r.fin > ahora,
    }));
  }, [reservas]);

  return {
    cargando: verificando || (!!perfil && cargando),
    reservas: filas,
    cancelacion,
    abrirCancelacion: (id: string) => {
      setError(null);
      setAviso(null);
      setCancelacion({ id, motivo: '' });
    },
    setMotivo: (motivo: string) => setCancelacion((c) => (c ? { ...c, motivo } : c)),
    confirmarCancelacion,
    cerrarCancelacion: () => setCancelacion(null),
    nuevaReserva: () => router.push('/'),
    error,
    aviso,
    guardando,
  };
}

export type MisReservasProps = ReturnType<typeof useMisReservas>;
