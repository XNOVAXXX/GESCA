import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { MisReservasProps } from './useMisReservas';
import { styles } from '../Reservas.styles';

type Fila = MisReservasProps['reservas'][number];

const estiloTarjeta = (f: Fila) =>
  f.estado === 'aprobada' ? styles.tarjetaAprobada : f.estado === 'pendiente' ? styles.tarjetaPendiente : styles.tarjetaInactiva;

const estiloEstado = (f: Fila) =>
  f.estado === 'aprobada' ? styles.estadoAprobada : f.estado === 'pendiente' ? null : styles.estadoInactiva;

export function MisReservasView(p: MisReservasProps) {
  if (p.cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primario} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Mis reservas</Text>
      <Text style={styles.subtitulo}>
        Consulta el estado de tus solicitudes. Puedes cancelar con mínimo 24 horas de anticipación.
      </Text>

      {p.error && <Text style={styles.error}>{p.error}</Text>}
      {p.aviso && <Text style={styles.aviso}>{p.aviso}</Text>}

      {p.reservas.length === 0 && <Text style={styles.vacio}>Todavía no tienes reservas.</Text>}

      {p.reservas.map((r) => (
        <View key={r.id} style={[styles.tarjeta, estiloTarjeta(r)]}>
          <View style={styles.encabezado}>
            <Text style={styles.nombre}>{r.espacio}</Text>
            <Text style={[styles.estado, estiloEstado(r)]}>{r.nombreEstado}</Text>
          </View>
          <Text style={styles.detalle}>{r.horario}</Text>
          <Text style={styles.detalle}>
            {r.motivoUso} · Aprueba {r.aprueba}
          </Text>
          {r.recursos && <Text style={styles.detalle}>Recursos: {r.recursos}</Text>}
          {r.motivoDecision && <Text style={styles.motivo}>Justificación: {r.motivoDecision}</Text>}
          {r.sinCancelacion && (
            <Text style={styles.advertencia}>Faltan menos de 24 horas: ya no se puede cancelar.</Text>
          )}

          {p.cancelacion?.id === r.id ? (
            <View style={styles.panelMotivo}>
              <Text style={styles.etiqueta}>¿Por qué cancelas?</Text>
              <TextInput
                style={styles.campo}
                value={p.cancelacion.motivo}
                onChangeText={p.setMotivo}
                placeholder="Ej. Se aplazó la actividad"
                placeholderTextColor={colors.textoSuave}
                autoFocus
              />
              <View style={styles.acciones}>
                <Pressable
                  style={[styles.botonPequeno, styles.botonPeligro, p.guardando && styles.botonDeshabilitado]}
                  disabled={p.guardando}
                  onPress={p.confirmarCancelacion}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonPequeno}>Confirmar cancelación</Text>
                </Pressable>
                <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={p.cerrarCancelacion} accessibilityRole="button">
                  <Text style={[styles.textoBotonPequeno, styles.textoContorno]}>Volver</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            r.cancelable && (
              <View style={styles.acciones}>
                <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={() => p.abrirCancelacion(r.id)} accessibilityRole="button">
                  <Text style={[styles.textoBotonPequeno, styles.textoContorno]}>Cancelar reserva</Text>
                </Pressable>
              </View>
            )
          )}
        </View>
      ))}

      <Pressable style={styles.boton} onPress={p.nuevaReserva} accessibilityRole="button">
        <Text style={styles.textoBoton}>Nueva reserva</Text>
      </Pressable>
    </ScrollView>
  );
}
