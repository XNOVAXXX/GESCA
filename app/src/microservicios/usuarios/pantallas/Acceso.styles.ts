// Diseño compartido por las pantallas de acceso (ingresar, verificar correo y panel).
import { StyleSheet } from 'react-native';
import { colors, formulario, radius, spacing, typography } from '@/compartido/tema';

export const styles = StyleSheet.create({
  ...formulario,
  contenedor: {
    flexGrow: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
  campoCodigo: {
    ...typography.titulo,
    letterSpacing: 8,
    textAlign: 'center',
  },
  aviso: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginBottom: spacing.md,
  },
  botonSecundario: {
    backgroundColor: colors.superficie,
    borderColor: colors.primario,
    borderWidth: 1,
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
