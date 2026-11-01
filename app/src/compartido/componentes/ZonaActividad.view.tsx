import type { ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from './ZonaActividad.styles';

interface Props {
  onActividad: () => void;
  children: ReactNode;
}

// Ocupa toda la pantalla y avisa cada vez que el usuario la toca.
export function ZonaActividad({ onActividad, children }: Props) {
  return (
    <View style={styles.zona} onTouchStart={onActividad}>
      {children}
    </View>
  );
}
