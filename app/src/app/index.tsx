// Las rutas solo unen la funcionalidad (hook) con la vista. No llevan lógica ni estilos.
import { DisponibilidadView } from '@/microservicios/espacios/pantallas/disponibilidad/Disponibilidad.view';
import { useDisponibilidad } from '@/microservicios/espacios/pantallas/disponibilidad/useDisponibilidad';

export default function DisponibilidadRoute() {
  return <DisponibilidadView {...useDisponibilidad()} />;
}
