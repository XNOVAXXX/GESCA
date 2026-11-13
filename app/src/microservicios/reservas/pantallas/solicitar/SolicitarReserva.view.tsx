import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { SolicitarReservaProps } from './useSolicitarReserva';
import { styles } from './SolicitarReserva.styles';

export function SolicitarReservaView(p: SolicitarReservaProps) {
  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Solicitar reserva</Text>
      <Text style={styles.subtitulo}>{p.nombreEspacio}</Text>
      {!p.correoVerificado && (
        <Text style={styles.aviso}>Al radicar te pediremos verificar tu correo con un código.</Text>
      )}

      <Text style={styles.etiqueta}>Fecha (AAAA-MM-DD)</Text>
      <TextInput style={styles.campo} value={p.fecha} onChangeText={p.setFecha} placeholder="2026-10-20" placeholderTextColor={colors.textoSuave} />

      <View style={styles.fila}>
        <View style={styles.columna}>
          <Text style={styles.etiqueta}>Hora inicio</Text>
          <TextInput style={styles.campo} value={p.horaInicio} onChangeText={p.setHoraInicio} placeholder="08:00" placeholderTextColor={colors.textoSuave} />
        </View>
        <View style={styles.columna}>
          <Text style={styles.etiqueta}>Hora fin (máx. 2 horas)</Text>
          <TextInput style={styles.campo} value={p.horaFin} onChangeText={p.setHoraFin} placeholder="10:00" placeholderTextColor={colors.textoSuave} />
        </View>
      </View>

      <Text style={styles.etiqueta}>Motivo de uso</Text>
      <TextInput
        style={[styles.campo, styles.campoMultilinea]}
        value={p.motivoUso}
        onChangeText={p.setMotivoUso}
        multiline
      />

      {p.errores.map((e) => (
        <Text key={e} style={styles.error}>
          {e}
        </Text>
      ))}
      {p.confirmacion && <Text style={styles.confirmacion}>{p.confirmacion}</Text>}

      <Pressable
        style={[styles.boton, p.enviando && styles.botonDeshabilitado]}
        disabled={p.enviando}
        onPress={p.enviar}
      >
        <Text style={styles.textoBoton}>
          {p.enviando ? 'Enviando…' : p.correoVerificado ? 'Radicar solicitud' : 'Verificar correo y radicar'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
