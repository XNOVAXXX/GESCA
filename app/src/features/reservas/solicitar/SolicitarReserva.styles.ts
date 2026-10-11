import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
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
  campoMultilinea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columna: {
    flex: 1,
  },
  error: {
    ...typography.pequeno,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  confirmacion: {
    ...typography.cuerpo,
    color: colors.exito,
    marginBottom: spacing.md,
  },
  boton: {
    backgroundColor: colors.primario,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    ...typography.subtitulo,
    color: colors.superficie,
  },
});
