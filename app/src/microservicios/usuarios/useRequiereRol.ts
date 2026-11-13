import { useEffect } from 'react';
import { router } from 'expo-router';
import type { Rol } from './usuarios.tipos';
import { useSesion } from './useSesion';

// INSOFT-26: protege una pantalla. Sin sesión lleva al ingreso; con un rol no permitido, al panel.
export function useRequiereRol(permitidos: readonly Rol[]) {
  const { perfil, cargando } = useSesion();
  const permitido = !!perfil && permitidos.includes(perfil.rol);

  useEffect(() => {
    if (cargando) return;
    if (!perfil) router.replace('/acceso/ingresar');
    else if (!permitidos.includes(perfil.rol)) router.replace('/panel');
  }, [cargando, perfil, permitidos]);

  return { perfil: permitido ? perfil : null, cargando: cargando || !permitido };
}
