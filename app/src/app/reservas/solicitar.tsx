import { SolicitarReservaView } from '@/features/reservas/solicitar/SolicitarReserva.view';
import { useSolicitarReserva } from '@/features/reservas/solicitar/useSolicitarReserva';

export default function SolicitarReservaRoute() {
  return <SolicitarReservaView {...useSolicitarReserva()} />;
}
