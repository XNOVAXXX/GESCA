import { PanelView } from '@/features/acceso/panel/Panel.view';
import { usePanel } from '@/features/acceso/panel/usePanel';

export default function PanelRoute() {
  return <PanelView {...usePanel()} />;
}
