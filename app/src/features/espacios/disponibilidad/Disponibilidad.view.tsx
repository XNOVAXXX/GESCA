import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { DisponibilidadProps } from './useDisponibilidad';
import { styles } from './Disponibilidad.styles';

const NOMBRE_TIPO = {
  auditorio: 'Auditorio',
  sala_computo: 'Sala de cómputo',
  cancha: 'Cancha',
  laboratorio: 'Laboratorio',
  espacio_compartido: 'Espacio compartido',
} as const;

export function DisponibilidadView({ espacios, cargando, error, recargar, solicitar, textoCuenta, irACuenta }: DisponibilidadProps) {
  return (
    <View style={styles.contenedor}>
      <Image
        source={require('../../../../assets/logo-pascual-bravo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Institución Universitaria Pascual Bravo"
      />
      <Pressable onPress={irACuenta} accessibilityRole="link">
        <Text style={styles.cuenta}>{textoCuenta}</Text>
      </Pressable>
      <Text style={styles.titulo}>Espacios disponibles</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {cargando ? (
        <ActivityIndicator color={colors.primario} />
      ) : (
        <FlatList
          data={espacios}
          keyExtractor={(e) => e.id}
          onRefresh={recargar}
          refreshing={cargando}
          ListEmptyComponent={<Text style={styles.vacio}>No hay espacios registrados.</Text>}
          renderItem={({ item }) => {
            const activo = item.estado === 'activo';
            return (
              <Pressable
                style={[styles.tarjeta, !activo && styles.tarjetaInactiva]}
                disabled={!activo}
                onPress={() => solicitar(item)}
              >
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.detalle}>
                  {NOMBRE_TIPO[item.tipo]} · Capacidad {item.capacidad_max}
                </Text>
                <Text style={activo ? styles.estadoActivo : styles.estadoMantenimiento}>
                  {activo ? 'Disponible' : 'En mantenimiento'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
