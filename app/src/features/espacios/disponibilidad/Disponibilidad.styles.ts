import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
  },
  logo: {
    width: 277,
    height: 72,
    maxWidth: '100%',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  cuenta: {
    ...typography.pequeno,
    color: colors.primario,
    textAlign: 'right',
    marginBottom: spacing.sm,
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
