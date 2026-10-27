import { Image } from 'react-native';
import { styles } from './Logo.styles';

export function Logo() {
  return (
    <Image
      source={require('../../../assets/logo-pascual-bravo.png')}
      style={styles.logo}
      resizeMode="contain"
      accessibilityLabel="Institución Universitaria Pascual Bravo"
    />
  );
}
