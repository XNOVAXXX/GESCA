import { VerificarCorreoView } from '@/microservicios/usuarios/pantallas/verificar-correo/VerificarCorreo.view';
import { useVerificarCorreo } from '@/microservicios/usuarios/pantallas/verificar-correo/useVerificarCorreo';

export default function VerificarCorreoRoute() {
  return <VerificarCorreoView {...useVerificarCorreo()} />;
}
