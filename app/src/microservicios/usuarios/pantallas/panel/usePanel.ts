import { router } from 'expo-router';
import { cerrarSesion } from '@/microservicios/usuarios/usuarios.api';
import { NOMBRE_ROL } from '@/microservicios/usuarios/usuarios.tipos';
import { useRequiereRol } from '@/microservicios/usuarios/useRequiereRol';

const TODOS = ['admin', 'coordinador', 'solicitante'] as const;

// INSOFT-26: panel después de ingresar. Cada rol ve solo las opciones que le corresponden.
// Las bandejas de aprobación llegan con la épica de aprobaciones.
export function usePanel() {
  const { perfil, cargando } = useRequiereRol(TODOS);

  const salir = async () => {
    await cerrarSesion();
    router.replace('/');
  };

  return {
    cargando,
    nombre: perfil?.nombre ?? '',
    correo: perfil?.correo ?? '',
    rol: perfil ? NOMBRE_ROL[perfil.rol] : '',
    puedeGestionarUsuarios: perfil?.rol === 'admin',
    salir,
    verEspacios: () => router.push('/'),
    gestionarUsuarios: () => router.push('/admin/usuarios'),
  };
}

export type PanelProps = ReturnType<typeof usePanel>;
