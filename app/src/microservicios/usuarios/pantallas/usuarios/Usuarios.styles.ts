import { StyleSheet } from 'react-native';
import { colors, formulario, radius, spacing, typography } from '@/compartido/tema';

export const styles = StyleSheet.create({
  ...formulario,
  contenedor: {
    flex: 1,
    backgroundColor: colors.fondo,
    padding: spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  titulo: {
    ...typography.titulo,
    color: colors.primarioOscuro,
  },
  subtitulo: {
    ...typography.cuerpo,
    color: colors.textoSuave,
    marginBottom: spacing.md,
  },
  aviso: {
    ...typography.pequeno,
    color: colors.exito,
    marginBottom: spacing.sm,
  },
  vacio: {
    ...typography.cuerpo,
    color: colors.textoSuave,
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
  nombre: {
    ...typography.subtitulo,
    color: colors.texto,
  },
  propio: {
    ...typography.pequeno,
    color: colors.textoSuave,
  },
  detalle: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginTop: spacing.xs,
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  rol: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  rolActivo: {
    backgroundColor: colors.primario,
  },
  textoRol: {
    ...typography.pequeno,
    color: colors.primario,
  },
  textoRolActivo: {
    color: colors.superficie,
  },
});
