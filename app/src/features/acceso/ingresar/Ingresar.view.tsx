import { Image, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { colors } from '@/theme';
import type { IngresarProps } from './useIngresar';
import { styles } from '../Acceso.styles';

export function IngresarView(p: IngresarProps) {
  return (
    <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
      <Image
        source={require('../../../../assets/logo-pascual-bravo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Institución Universitaria Pascual Bravo"
      />
      <Text style={styles.titulo}>Ingreso administrativo</Text>
      <Text style={styles.subtitulo}>Para Administración de Espacios y Coordinación.</Text>

      <Text style={styles.etiqueta}>Correo</Text>
      <TextInput
        style={styles.campo}
        value={p.correo}
        onChangeText={p.setCorreo}
        placeholder="nombre@pascualbravo.edu.co"
        placeholderTextColor={colors.textoSuave}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />

      <Text style={styles.etiqueta}>Contraseña</Text>
      <TextInput
        style={styles.campo}
        value={p.contrasena}
        onChangeText={p.setContrasena}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={p.ingresar}
      />

      {p.error && <Text style={styles.error}>{p.error}</Text>}

      <Pressable
        style={[styles.boton, p.enviando && styles.botonDeshabilitado]}
        disabled={p.enviando}
        onPress={p.ingresar}
        accessibilityRole="button"
      >
        <Text style={styles.textoBoton}>{p.enviando ? 'Ingresando…' : 'Ingresar'}</Text>
      </Pressable>

      <Pressable onPress={p.irAVerificarCorreo} accessibilityRole="link">
        <Text style={styles.enlace}>¿Vas a reservar un espacio? Verifica tu correo con un código</Text>
      </Pressable>
    </ScrollView>
  );
}
