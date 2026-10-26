// Diseño compartido por las pantallas de acceso (ingresar, verificar correo y panel).
import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  logo: {
    width: 277,
    height: 72,
    maxWidth: '100%',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  titulo: {
    ...typography.titulo,
    color: colors.primarioOscuro,
  },
  subtitulo: {
    ...typography.cuerpo,
    color: colors.textoSuave,
    marginBottom: spacing.lg,
  },
  etiqueta: {
    ...typography.pequeno,
    color: colors.texto,
    marginBottom: spacing.xs,
  },
  campo: {
    ...typography.cuerpo,
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    color: colors.texto,
  },
  campoCodigo: {
    ...typography.titulo,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    ...typography.pequeno,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  aviso: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginBottom: spacing.md,
  },
  boton: {
    backgroundColor: colors.primario,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  botonSecundario: {
    backgroundColor: colors.superficie,
    borderColor: colors.primario,
    borderWidth: 1,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    ...typography.subtitulo,
    color: colors.superficie,
  },
  textoBotonSecundario: {
    color: colors.primario,
  },
  enlace: {
    ...typography.pequeno,
    color: colors.primario,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderLeftColor: colors.acento,
    borderLeftWidth: 4,
    borderColor: colors.borde,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  nombre: {
    ...typography.subtitulo,
    color: colors.texto,
  },
  detalle: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginTop: spacing.xs,
  },
  rol: {
    ...typography.pequeno,
    color: colors.primarioOscuro,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
