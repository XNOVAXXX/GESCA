// Estilos de formulario que comparten todas las pantallas (campos, errores y botones).
import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export const formulario = StyleSheet.create({
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
  error: {
    ...typography.pequeno,
    color: colors.error,
    marginBottom: spacing.sm,
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
