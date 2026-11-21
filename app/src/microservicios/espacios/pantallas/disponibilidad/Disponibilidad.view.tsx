import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Logo } from '@/compartido/componentes/Logo.view';
import { colors } from '@/compartido/tema';
import type { DisponibilidadProps } from './useDisponibilidad';
import { styles } from './Disponibilidad.styles';

function Filtros(p: DisponibilidadProps) {
  return (
    <View style={styles.filtros}>
      <Text style={styles.etiqueta}>Día</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {p.dias.map((d) => {
          const activo = d.clave === p.fecha;
          return (
            <Pressable
              key={d.clave}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => p.setFecha(d.clave)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <Text style={[styles.textoChip, activo && styles.textoChipActivo]}>{d.texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.etiqueta}>Tipo de espacio</Text>
      <View style={styles.chipsEnvueltos}>
        {p.tipos.map((t) => {
          const activo = t.tipo === p.tipo;
          return (
            <Pressable
              key={t.nombre}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => p.setTipo(t.tipo)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <Text style={[styles.textoChip, activo && styles.textoChipActivo]}>{t.nombre}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.etiqueta}>Capacidad mínima</Text>
      <TextInput
        style={styles.campo}
        value={p.capacidad}
        onChangeText={p.setCapacidad}
        placeholder="Número de personas"
        placeholderTextColor={colors.textoSuave}
        keyboardType="number-pad"
      />
    </View>
  );
}

export function DisponibilidadView(p: DisponibilidadProps) {
  return (
    <View style={styles.contenedor}>
      <Logo />
      <View style={styles.enlaces}>
        {p.verMisReservas && (
          <Pressable onPress={p.verMisReservas} accessibilityRole="link">
            <Text style={styles.cuenta}>Mis reservas</Text>
          </Pressable>
        )}
        <Pressable onPress={p.irACuenta} accessibilityRole="link">
          <Text style={styles.cuenta}>{p.textoCuenta}</Text>
        </Pressable>
      </View>
      <Text style={styles.titulo}>Disponibilidad de espacios</Text>
      {p.error && <Text style={styles.error}>{p.error}</Text>}
      {p.cargando ? (
        <ActivityIndicator color={colors.primario} />
      ) : (
        <FlatList
          data={p.espacios}
          keyExtractor={(e) => e.id}
          onRefresh={p.recargar}
          refreshing={p.cargando}
          ListHeaderComponent={<Filtros {...p} />}
          ListEmptyComponent={<Text style={styles.vacio}>Ningún espacio cumple los filtros.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.tarjeta, !item.disponible && styles.tarjetaInactiva]}
              disabled={!item.disponible}
              onPress={() => p.solicitar(item)}
              accessibilityRole="button"
              accessibilityState={{ disabled: !item.disponible }}
            >
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                {item.nombreTipo} · Capacidad {item.capacidad_max}
              </Text>
              {item.recursos !== '' && <Text style={styles.detalle}>Recursos: {item.recursos}</Text>}
              {item.disponible ? (
                item.ocupadas.length === 0 ? (
                  <Text style={styles.estadoActivo}>Libre todo el día · Toca para reservar</Text>
                ) : (
                  <Text style={styles.ocupado}>Ocupado: {item.ocupadas.join(', ')} · Toca para reservar</Text>
                )
              ) : (
                <Text style={styles.estadoMantenimiento}>
                  Bloqueado: en mantenimiento{item.motivo_estado ? ` (${item.motivo_estado})` : ''}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
