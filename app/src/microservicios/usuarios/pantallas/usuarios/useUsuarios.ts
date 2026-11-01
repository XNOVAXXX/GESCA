import { useEffect, useMemo, useState } from 'react';
import { mensajeDe } from '@/compartido/errores';
import { cambiarRol, listarPerfiles } from '@/microservicios/usuarios/usuarios.api';
import { NOMBRE_ROL, type Perfil, type Rol } from '@/microservicios/usuarios/usuarios.tipos';
import { useRequiereRol } from '@/microservicios/usuarios/useRequiereRol';

const SOLO_ADMIN = ['admin'] as const;
const ROLES: readonly Rol[] = ['admin', 'coordinador', 'solicitante'];

// INSOFT-27: el administrador asigna el rol Administrador, Coordinador o Solicitante.
export function useUsuarios() {
  const { perfil, cargando: verificando } = useRequiereRol(SOLO_ADMIN);
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    if (!perfil) return;
    let vigente = true;
    listarPerfiles()
      .then((lista) => {
        if (vigente) setUsuarios(lista);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDe(e, 'No se pudieron cargar los usuarios.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [perfil]);

  const asignar = async (usuario: Perfil, rol: Rol) => {
    if (usuario.rol === rol) return;
    setError(null);
    setAviso(null);
    setGuardando(usuario.id);
    try {
      await cambiarRol(usuario.id, rol);
      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, rol } : u)));
      setAviso(`${usuario.nombre} ahora es ${NOMBRE_ROL[rol]}.`);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo cambiar el rol.'));
    } finally {
      setGuardando(null);
    }
  };

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios;
    return usuarios.filter((u) => u.nombre.toLowerCase().includes(texto) || u.correo.includes(texto));
  }, [usuarios, busqueda]);

  return {
    cargando: verificando || cargando,
    usuarios: filtrados,
    idPropio: perfil?.id ?? '',
    roles: ROLES.map((rol) => ({ rol, nombre: NOMBRE_ROL[rol] })),
    busqueda,
    setBusqueda,
    error,
    aviso,
    guardando,
    asignar,
  };
}

export type UsuariosProps = ReturnType<typeof useUsuarios>;
