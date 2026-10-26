import { IngresarView } from '@/features/acceso/ingresar/Ingresar.view';
import { useIngresar } from '@/features/acceso/ingresar/useIngresar';

export default function IngresarRoute() {
  return <IngresarView {...useIngresar()} />;
}
