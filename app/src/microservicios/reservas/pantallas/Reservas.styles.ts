// Diseño compartido por "Mis reservas" y la bandeja de aprobación.
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
  aviso: {
    ...typography.pequeno,
    color: colors.exito,
    marginBottom: spacing.sm,
  },
  vacio: {
    ...typography.cuerpo,
    color: colors.textoSuave,
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
  tarjetaAprobada: {
    borderLeftColor: colors.exito,
  },
  tarjetaPendiente: {
    borderLeftColor: colors.primario,
  },
  tarjetaInactiva: {
    borderLeftColor: colors.textoSuave,
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
    fontWeight: '600',
    color: colors.primario,
  },
  estadoAprobada: {
    color: colors.exito,
  },
  estadoInactiva: {
    color: colors.textoSuave,
  },
  detalle: {
    ...typography.pequeno,
    color: colors.textoSuave,
    marginTop: spacing.xs,
  },
  motivo: {
    ...typography.pequeno,
    color: colors.texto,
    marginTop: spacing.xs,
  },
  advertencia: {
    ...typography.pequeno,
    color: colors.advertencia,
    marginTop: spacing.xs,
  },
  panelMotivo: {
    marginTop: spacing.sm,
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  botonExito: {
    backgroundColor: colors.exito,
  },
  botonPeligro: {
    backgroundColor: colors.error,
  },
  textoBotonPequeno: {
    ...typography.pequeno,
    color: colors.superficie,
  },
  textoContorno: {
    color: colors.primario,
  },
  botonSecundario: {
    backgroundColor: colors.superficie,
    borderColor: colors.primario,
    borderWidth: 1,
  },
  textoSecundario: {
    color: colors.primario,
  },
});
