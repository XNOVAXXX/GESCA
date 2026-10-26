import { Image, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { colors } from '@/theme';
import type { VerificarCorreoProps } from './useVerificarCorreo';
import { styles } from '../Acceso.styles';

export function VerificarCorreoView(p: VerificarCorreoProps) {
  return (
    <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
      <Image
        source={require('../../../../assets/logo-pascual-bravo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Institución Universitaria Pascual Bravo"
      />
      <Text style={styles.titulo}>Verifica tu correo</Text>

      {p.paso === 'correo' ? (
        <>
          <Text style={styles.subtitulo}>Te enviaremos un código para que puedas solicitar espacios. No necesitas contraseña.</Text>

          <Text style={styles.etiqueta}>Nombre completo</Text>
          <TextInput style={styles.campo} value={p.nombre} onChangeText={p.setNombre} autoComplete="name" />

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
            onSubmitEditing={p.pedirCodigo}
          />
          {p.requiereCoordinacion && (
            <Text style={styles.aviso}>
              Tu correo no es institucional: tus solicitudes requerirán aprobación de Coordinación.
            </Text>
          )}

          {p.error && <Text style={styles.error}>{p.error}</Text>}

          <Pressable
            style={[styles.boton, p.enviando && styles.botonDeshabilitado]}
            disabled={p.enviando}
            onPress={p.pedirCodigo}
            accessibilityRole="button"
          >
            <Text style={styles.textoBoton}>{p.enviando ? 'Enviando…' : 'Enviar código'}</Text>
          </Pressable>

          <Pressable onPress={p.irAIngresoAdministrativo} accessibilityRole="link">
            <Text style={styles.enlace}>Soy administrador o coordinador</Text>
          </Pressable>
        </>
      ) : (
        <>
          {p.aviso && <Text style={styles.subtitulo}>{p.aviso}</Text>}

          <Text style={styles.etiqueta}>Código</Text>
          <TextInput
            style={[styles.campo, styles.campoCodigo]}
            value={p.codigo}
            onChangeText={p.setCodigo}
            placeholder="000000"
            placeholderTextColor={colors.textoSuave}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            onSubmitEditing={p.confirmarCodigo}
          />

          {p.error && <Text style={styles.error}>{p.error}</Text>}

          <Pressable
            style={[styles.boton, p.enviando && styles.botonDeshabilitado]}
            disabled={p.enviando}
            onPress={p.confirmarCodigo}
            accessibilityRole="button"
          >
            <Text style={styles.textoBoton}>{p.enviando ? 'Verificando…' : 'Verificar'}</Text>
          </Pressable>
          <Pressable
            style={[styles.boton, styles.botonSecundario, p.enviando && styles.botonDeshabilitado]}
            disabled={p.enviando}
            onPress={p.pedirCodigo}
            accessibilityRole="button"
          >
            <Text style={[styles.textoBoton, styles.textoBotonSecundario]}>Reenviar código</Text>
          </Pressable>

          <Pressable onPress={p.cambiarCorreo} accessibilityRole="link">
            <Text style={styles.enlace}>Usar otro correo</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
