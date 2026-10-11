// Las rutas solo unen la funcionalidad (hook) con la vista. No llevan lógica ni estilos.
import { DisponibilidadView } from '@/features/espacios/disponibilidad/Disponibilidad.view';
import { useDisponibilidad } from '@/features/espacios/disponibilidad/useDisponibilidad';

export default function DisponibilidadRoute() {
  return <DisponibilidadView {...useDisponibilidad()} />;
}
