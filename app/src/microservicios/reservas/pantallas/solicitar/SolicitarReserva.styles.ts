import { StyleSheet } from 'react-native';
import { colors, formulario, spacing, typography } from '@/compartido/tema';

export const styles = StyleSheet.create({
  ...formulario,
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
  aviso: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
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
    ...formulario.error,
    marginBottom: spacing.xs,
  },
  confirmacion: {
    ...typography.cuerpo,
    color: colors.exito,
    marginBottom: spacing.md,
  },
});
