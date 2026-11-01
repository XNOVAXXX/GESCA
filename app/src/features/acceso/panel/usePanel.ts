import { useEffect } from 'react';
import { router } from 'expo-router';
import { cerrarSesion } from '@/services/auth.service';
import { useSesion } from '../useSesion';

const NOMBRE_ROL = {
  admin: 'Administrador de Espacios',
  coordinador: 'Coordinación / Laboratorio',
  solicitante: 'Solicitante',
} as const;

// Panel inicial después de ingresar. Las bandejas de cada rol llegan con la épica de aprobaciones.
export function usePanel() {
  const { perfil, cargando } = useSesion();

  useEffect(() => {
    if (!cargando && !perfil) router.replace('/acceso/ingresar');
  }, [cargando, perfil]);

  const salir = async () => {
    await cerrarSesion();
    router.replace('/');
  };

  const verEspacios = () => router.push('/');

  return {
    cargando,
    nombre: perfil?.nombre ?? '',
    correo: perfil?.correo ?? '',
    rol: perfil ? NOMBRE_ROL[perfil.rol] : '',
    salir,
    verEspacios,
  };
}

export type PanelProps = ReturnType<typeof usePanel>;
