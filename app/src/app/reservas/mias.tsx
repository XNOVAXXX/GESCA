import { MisReservasView } from '@/microservicios/reservas/pantallas/mis-reservas/MisReservas.view';
import { useMisReservas } from '@/microservicios/reservas/pantallas/mis-reservas/useMisReservas';

export default function MisReservasRoute() {
  return <MisReservasView {...useMisReservas()} />;
}
