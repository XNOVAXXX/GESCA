import { SolicitarReservaView } from '@/microservicios/reservas/pantallas/solicitar/SolicitarReserva.view';
import { useSolicitarReserva } from '@/microservicios/reservas/pantallas/solicitar/useSolicitarReserva';

export default function SolicitarReservaRoute() {
  return <SolicitarReservaView {...useSolicitarReserva()} />;
}
