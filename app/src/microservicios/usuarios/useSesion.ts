import { useEffect, useState } from 'react';
import type { Perfil } from './usuarios.tipos';
import { escucharSesion, obtenerPerfil } from './usuarios.api';

// Perfil del usuario con sesión activa (null si nadie ha ingresado). Se actualiza solo
// cuando alguien inicia o cierra sesión.
export function useSesion() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => escucharSesion(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let vigente = true;
    obtenerPerfil()
      .then((p) => {
        if (vigente) setPerfil(p);
      })
      .catch(() => {
        if (vigente) setPerfil(null);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [version]);

  return { perfil, cargando };
}
