import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import type { Espacio } from '@/microservicios/espacios/espacios.tipos';
import { listarEspacios } from '@/microservicios/espacios/espacios.api';
import { useSesion } from '@/microservicios/usuarios';

export function useDisponibilidad() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { perfil } = useSesion();

  useEffect(() => {
    let vigente = true;
    listarEspacios()
      .then((data) => {
        if (!vigente) return;
        setEspacios(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDe(e, 'No se pudieron cargar los espacios.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [version]);

  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);

  const solicitar = (espacio: Espacio) => {
    if (espacio.estado !== 'activo') return; // RN03
    router.push({ pathname: '/reservas/solicitar', params: { espacioId: espacio.id, nombre: espacio.nombre } });
  };

  const irACuenta = () => router.push(perfil ? '/panel' : '/acceso/ingresar');

  return {
    espacios,
    cargando,
    error,
    recargar,
    solicitar,
    textoCuenta: perfil ? `Hola, ${perfil.nombre.split(' ')[0]}` : 'Ingreso administrativo',
    irACuenta,
  };
}

export type DisponibilidadProps = ReturnType<typeof useDisponibilidad>;
