import { StyleSheet } from 'react-native';
import { colors, formulario, radius, spacing, typography } from '@/compartido/tema';

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
  dias: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  dia: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  diaActivo: {
    backgroundColor: colors.primario,
  },
  textoDia: {
    ...typography.pequeno,
    color: colors.primario,
  },
  textoDiaActivo: {
    color: colors.superficie,
  },
  ocupacion: {
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  libre: {
    ...typography.pequeno,
    color: colors.exito,
  },
  ocupada: {
    ...typography.pequeno,
    color: colors.advertencia,
  },
  botonSecundario: {
    backgroundColor: colors.superficie,
    borderColor: colors.primario,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  textoSecundario: {
    color: colors.primario,
  },
  confirmacion: {
    ...typography.cuerpo,
    color: colors.exito,
    marginBottom: spacing.md,
  },
  filaRecurso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nombreRecurso: {
    ...typography.cuerpo,
    color: colors.texto,
    flexShrink: 1,
  },
  disponibles: {
    ...typography.pequeno,
    color: colors.textoSuave,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  botonContador: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: radius.sm,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoContador: {
    ...typography.subtitulo,
    color: colors.primario,
  },
  cantidad: {
    ...typography.subtitulo,
    color: colors.texto,
    minWidth: 24,
    textAlign: 'center',
  },
});
