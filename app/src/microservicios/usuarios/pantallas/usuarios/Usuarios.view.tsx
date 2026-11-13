import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { UsuariosProps } from './useUsuarios';
import { styles } from './Usuarios.styles';

export function UsuariosView(p: UsuariosProps) {
  if (p.cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primario} />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Usuarios y roles</Text>
      <Text style={styles.subtitulo}>
        Los usuarios nuevos entran como Solicitante. Asigna Coordinador o Administrador a quien apruebe reservas.
      </Text>

      <TextInput
        style={styles.campo}
        value={p.busqueda}
        onChangeText={p.setBusqueda}
        placeholder="Buscar por nombre o correo"
        placeholderTextColor={colors.textoSuave}
        autoCapitalize="none"
      />

      {p.error && <Text style={styles.error}>{p.error}</Text>}
      {p.aviso && <Text style={styles.aviso}>{p.aviso}</Text>}

      <FlatList
        data={p.usuarios}
        keyExtractor={(u) => u.id}
        ListEmptyComponent={<Text style={styles.vacio}>No hay usuarios que coincidan.</Text>}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <Text style={styles.nombre}>
              {item.nombre}
              {item.id === p.idPropio && <Text style={styles.propio}> (tú)</Text>}
            </Text>
            <Text style={styles.detalle}>{item.correo}</Text>
            <View style={styles.roles}>
              {p.roles.map(({ rol, nombre }) => {
                const activo = item.rol === rol;
                return (
                  <Pressable
                    key={rol}
                    style={[styles.rol, activo && styles.rolActivo]}
                    disabled={activo || p.guardando === item.id}
                    onPress={() => p.asignar(item, rol)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                  >
                    <Text style={[styles.textoRol, activo && styles.textoRolActivo]}>{nombre}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </View>
  );
}
