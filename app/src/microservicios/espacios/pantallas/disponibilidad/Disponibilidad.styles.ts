import { StyleSheet } from 'react-native';
import { colors, formulario, radius, spacing, typography } from '@/compartido/tema';

export const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
  },
  enlaces: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cuenta: {
    ...typography.pequeno,
    color: colors.primario,
  },
  filtros: {
    marginBottom: spacing.md,
  },
  etiqueta: formulario.etiqueta,
  campo: formulario.campo,
  chips: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  chipsEnvueltos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chipActivo: {
    backgroundColor: colors.primario,
  },
  textoChip: {
    ...typography.pequeno,
    color: colors.primario,
  },
  textoChipActivo: {
    color: colors.superficie,
  },
  ocupado: {
    ...typography.pequeno,
    color: colors.advertencia,
    marginTop: spacing.xs,
  },
  titulo: {
    ...typography.titulo,
    color: colors.primarioOscuro,
    marginBottom: spacing.md,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderLeftColor: colors.acento,
    borderLeftWidth: 4,
    borderColor: colors.borde,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tarjetaInactiva: {
    opacity: 0.55,
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
  estadoActivo: {
    ...typography.pequeno,
    color: colors.exito,
    marginTop: spacing.xs,
  },
  estadoMantenimiento: {
    ...typography.pequeno,
    color: colors.advertencia,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.cuerpo,
    color: colors.error,
    marginBottom: spacing.md,
  },
  vacio: {
    ...typography.cuerpo,
    color: colors.textoSuave,
  },
});
