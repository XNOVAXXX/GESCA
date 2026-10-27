import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { PanelProps } from './usePanel';
import { styles } from '../Acceso.styles';

export function PanelView(p: PanelProps) {
  if (p.cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primario} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Hola, {p.nombre}</Text>
      <Text style={styles.subtitulo}>Ya ingresaste a GESCA.</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.nombre}>{p.nombre}</Text>
        <Text style={styles.detalle}>{p.correo}</Text>
        <Text style={styles.rol}>{p.rol}</Text>
      </View>

      <Pressable style={styles.boton} onPress={p.verEspacios} accessibilityRole="button">
        <Text style={styles.textoBoton}>Ver espacios</Text>
      </Pressable>
      <Pressable style={[styles.boton, styles.botonSecundario]} onPress={p.salir} accessibilityRole="button">
        <Text style={[styles.textoBoton, styles.textoBotonSecundario]}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
