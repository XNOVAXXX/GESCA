import { PanelView } from '@/microservicios/usuarios/pantallas/panel/Panel.view';
import { usePanel } from '@/microservicios/usuarios/pantallas/panel/usePanel';

export default function PanelRoute() {
  return <PanelView {...usePanel()} />;
}
