import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { BandejaProps } from './useBandeja';
import { styles } from '../Reservas.styles';

export function BandejaView(p: BandejaProps) {
  if (p.cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primario} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>{p.titulo}</Text>
      <Text style={styles.subtitulo}>Solicitudes pendientes, de la más próxima a la más lejana.</Text>

      {p.error && <Text style={styles.error}>{p.error}</Text>}
      {p.aviso && <Text style={styles.aviso}>{p.aviso}</Text>}

      {p.solicitudes.length === 0 && <Text style={styles.vacio}>No hay solicitudes pendientes.</Text>}

      {p.solicitudes.map((s) => (
        <View key={s.id} style={[styles.tarjeta, styles.tarjetaPendiente]}>
          <View style={styles.encabezado}>
            <Text style={styles.nombre}>{s.espacio}</Text>
            <Text style={styles.estado}>Pendiente</Text>
          </View>
          <Text style={styles.detalle}>{s.horario}</Text>
          <Text style={styles.detalle}>{s.solicitante}</Text>
          <Text style={styles.motivo}>Motivo: {s.motivoUso}</Text>
          {s.enMantenimiento && (
            <Text style={styles.advertencia}>El espacio está en mantenimiento: no se puede aprobar.</Text>
          )}

          {p.rechazo?.id === s.id ? (
            <View style={styles.panelMotivo}>
              <Text style={styles.etiqueta}>Justificación del rechazo</Text>
              <TextInput
                style={styles.campo}
                value={p.rechazo.motivo}
                onChangeText={p.setMotivo}
                placeholder="Ej. El espacio está reservado para un evento institucional"
                placeholderTextColor={colors.textoSuave}
                autoFocus
              />
              <View style={styles.acciones}>
                <Pressable
                  style={[styles.botonPequeno, styles.botonPeligro, p.guardando && styles.botonDeshabilitado]}
                  disabled={p.guardando}
                  onPress={p.confirmarRechazo}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonPequeno}>Confirmar rechazo</Text>
                </Pressable>
                <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={p.cerrarRechazo} accessibilityRole="button">
                  <Text style={[styles.textoBotonPequeno, styles.textoContorno]}>Volver</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.acciones}>
              {!s.enMantenimiento && (
                <Pressable
                  style={[styles.botonPequeno, styles.botonExito, p.guardando && styles.botonDeshabilitado]}
                  disabled={p.guardando}
                  onPress={() => p.aprobar(s.id)}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonPequeno}>Aprobar</Text>
                </Pressable>
              )}
              <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={() => p.abrirRechazo(s.id)} accessibilityRole="button">
                <Text style={[styles.textoBotonPequeno, styles.textoContorno]}>Rechazar</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
