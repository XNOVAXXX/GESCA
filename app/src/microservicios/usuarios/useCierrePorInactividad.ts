import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { cerrarSesion } from './usuarios.api';
import { sesionInactiva } from './usuarios.reglas';
import { useSesion } from './useSesion';

// En la web también cuenta como actividad usar el ratón o el teclado.
const EVENTOS_WEB = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;
const REVISAR_CADA_MS = 30 * 1000;

// INSOFT-25 (RNF02): si quien tiene sesión no usa la app durante 15 minutos, se cierra la sesión.
export function useCierrePorInactividad() {
  const { perfil } = useSesion();
  const ultimaActividad = useRef(0);

  const registrarActividad = useCallback(() => {
    ultimaActividad.current = Date.now();
  }, []);

  useEffect(() => {
    if (!perfil) return;
    const rol = perfil.rol;
    ultimaActividad.current = Date.now();

    const revisar = async () => {
      if (!sesionInactiva(ultimaActividad.current)) return;
      // Primero se cierran las pantallas abiertas, para que su protección por rol no redirija sin el aviso.
      if (router.canDismiss()) router.dismissAll();
      router.replace({
        pathname: rol === 'solicitante' ? '/acceso/verificar' : '/acceso/ingresar',
        params: { motivo: 'inactividad' },
      });
      await cerrarSesion();
    };

    const intervalo = setInterval(revisar, REVISAR_CADA_MS);
    // Al volver a la app desde segundo plano se revisa de inmediato.
    const alCambiarEstado = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void revisar();
    });
    const documento = typeof document === 'undefined' ? null : document;
    EVENTOS_WEB.forEach((e) => documento?.addEventListener(e, registrarActividad, { passive: true }));

    return () => {
      clearInterval(intervalo);
      alCambiarEstado.remove();
      EVENTOS_WEB.forEach((e) => documento?.removeEventListener(e, registrarActividad));
    };
  }, [perfil, registrarActividad]);

  return { registrarActividad };
}
