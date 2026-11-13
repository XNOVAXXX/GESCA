import { GestionEspaciosView } from '@/microservicios/espacios/pantallas/gestion/GestionEspacios.view';
import { useGestionEspacios } from '@/microservicios/espacios/pantallas/gestion/useGestionEspacios';

export default function GestionEspaciosRoute() {
  return <GestionEspaciosView {...useGestionEspacios()} />;
}
