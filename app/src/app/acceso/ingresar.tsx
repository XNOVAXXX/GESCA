import { IngresarView } from '@/microservicios/usuarios/pantallas/ingresar/Ingresar.view';
import { useIngresar } from '@/microservicios/usuarios/pantallas/ingresar/useIngresar';

export default function IngresarRoute() {
  return <IngresarView {...useIngresar()} />;
}
