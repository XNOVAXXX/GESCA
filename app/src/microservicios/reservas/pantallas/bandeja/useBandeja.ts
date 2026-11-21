import { useEffect, useMemo, useState } from 'react';
import { mensajeDe } from '@/compartido/errores';
import { aprobar, bandejaPendiente, rechazar } from '@/microservicios/reservas/reservas.api';
import { franja } from '@/microservicios/reservas/reservas.formato';
import { validarJustificacion } from '@/microservicios/reservas/reservas.reglas';
import { NOMBRE_BANDEJA, type SolicitudPendiente } from '@/microservicios/reservas/reservas.tipos';
import { useRequiereRol } from '@/microservicios/usuarios';

const APRUEBAN = ['admin', 'coordinador'] as const;

// INSOFT-37 (bandeja del Administrador) e INSOFT-38 / HU03 (bandeja del Coordinador).
// Cada rol ve solo las solicitudes que le enruta RN05; rechazar exige justificación (RN04).
export function useBandeja() {
  const { perfil, cargando: verificando } = useRequiereRol(APRUEBAN);
  const [solicitudes, setSolicitudes] = useState<SolicitudPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rechazo, setRechazo] = useState<{ id: string; motivo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    let vigente = true;
    bandejaPendiente()
      .then((lista) => {
        if (vigente) setSolicitudes(lista);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDe(e, 'No se pudo cargar la bandeja.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [perfil]);

  // Al decidir, la solicitud sale de la bandeja.
  const decidir = async (id: string, accion: () => Promise<void>, mensaje: string) => {
    setError(null);
    setAviso(null);
    setGuardando(true);
    try {
      await accion();
      setSolicitudes((lista) => lista.filter((s) => s.id !== id));
      setRechazo(null);
      setAviso(mensaje);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo guardar la decisión.'));
    } finally {
      setGuardando(false);
    }
  };

  const aprobarSolicitud = (id: string) => void decidir(id, () => aprobar(id), 'Solicitud aprobada.');

  const confirmarRechazo = () => {
    if (!rechazo) return;
    const invalido = validarJustificacion(rechazo.motivo);
    if (invalido) {
      setAviso(null);
      setError(invalido);
      return;
    }
    const { id, motivo } = rechazo;
    void decidir(id, () => rechazar(id, motivo), 'Solicitud rechazada. El solicitante verá la justificación.');
  };

  const filas = useMemo(
    () =>
      solicitudes.map((s) => ({
        id: s.id,
        espacio: s.espacioNombre,
        horario: franja(s.inicio, s.fin),
        motivoUso: s.motivoUso,
        recursos: s.recursos,
        solicitante: `${s.responsableNombre} · ${s.responsableCorreo}`,
        enMantenimiento: s.espacioEnMantenimiento,
      })),
    [solicitudes],
  );

  const bandeja = perfil?.rol === 'coordinador' ? 'coordinador' : 'administrador';

  return {
    cargando: verificando || cargando,
    titulo: `Bandeja de ${NOMBRE_BANDEJA[bandeja]}`,
    solicitudes: filas,
    aprobar: aprobarSolicitud,
    rechazo,
    abrirRechazo: (id: string) => {
      setError(null);
      setAviso(null);
      setRechazo({ id, motivo: '' });
    },
    setMotivo: (motivo: string) => setRechazo((r) => (r ? { ...r, motivo } : r)),
    confirmarRechazo,
    cerrarRechazo: () => setRechazo(null),
    error,
    aviso,
    guardando,
  };
}

export type BandejaProps = ReturnType<typeof useBandeja>;
