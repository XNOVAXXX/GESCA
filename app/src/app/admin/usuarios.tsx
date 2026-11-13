import { UsuariosView } from '@/microservicios/usuarios/pantallas/usuarios/Usuarios.view';
import { useUsuarios } from '@/microservicios/usuarios/pantallas/usuarios/useUsuarios';

export default function UsuariosRoute() {
  return <UsuariosView {...useUsuarios()} />;
}
