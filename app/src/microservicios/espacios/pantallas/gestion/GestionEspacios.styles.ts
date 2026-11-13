import { StyleSheet } from 'react-native';
import { colors, formulario, radius, spacing, typography } from '@/compartido/tema';

export const styles = StyleSheet.create({
  ...formulario,
  contenedor: {
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
  seccion: {
    ...typography.subtitulo,
    color: colors.primarioOscuro,
    marginBottom: spacing.sm,
  },
  formulario: {
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  opcion: {
    borderColor: colors.primario,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  opcionActiva: {
    backgroundColor: colors.primario,
  },
  textoOpcion: {
    ...typography.pequeno,
    color: colors.primario,
  },
  textoOpcionActiva: {
    color: colors.superficie,
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  botonAccion: {
    flexGrow: 1,
    marginTop: 0,
  },
  botonSecundario: {
    backgroundColor: colors.superficie,
    borderColor: colors.primario,
    borderWidth: 1,
  },
  textoSecundario: {
    color: colors.primario,
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
  tarjetaMantenimiento: {
    borderLeftColor: colors.advertencia,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nombre: {
    ...typography.subtitulo,
    color: colors.texto,
    flexShrink: 1,
  },
  estado: {
    ...typography.pequeno,
    color: colors.exito,
  },
  estadoMantenimiento: {
    color: colors.advertencia,
  },
  detalle: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginTop: spacing.xs,
  },
  motivo: {
    ...typography.pequeno,
    color: colors.advertencia,
    marginTop: spacing.xs,
  },
  panelMotivo: {
    marginTop: spacing.sm,
  },
  botonPequeno: {
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  botonContorno: {
    borderColor: colors.primario,
    borderWidth: 1,
  },
  botonAdvertencia: {
    backgroundColor: colors.advertencia,
  },
  botonExito: {
    backgroundColor: colors.exito,
  },
  textoBotonPequeno: {
    ...typography.pequeno,
    color: colors.superficie,
  },
});
