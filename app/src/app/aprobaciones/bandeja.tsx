import { BandejaView } from '@/microservicios/reservas/pantallas/bandeja/Bandeja.view';
import { useBandeja } from '@/microservicios/reservas/pantallas/bandeja/useBandeja';

export default function BandejaRoute() {
  return <BandejaView {...useBandeja()} />;
}
