import { VerificarCorreoView } from '@/features/acceso/verificar-correo/VerificarCorreo.view';
import { useVerificarCorreo } from '@/features/acceso/verificar-correo/useVerificarCorreo';

export default function VerificarCorreoRoute() {
  return <VerificarCorreoView {...useVerificarCorreo()} />;
}
