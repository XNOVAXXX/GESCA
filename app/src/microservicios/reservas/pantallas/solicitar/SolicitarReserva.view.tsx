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

      <Text style={styles.etiqueta}>Día (máximo 15 días de anticipación)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
        {p.dias.map((d) => {
          const activo = d.clave === p.fecha;
          return (
            <Pressable
              key={d.clave}
              style={[styles.dia, activo && styles.diaActivo]}
              onPress={() => p.setFecha(d.clave)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <Text style={[styles.textoDia, activo && styles.textoDiaActivo]}>{d.texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.ocupacion}>
        <Text style={styles.etiqueta}>Horarios ocupados ese día</Text>
        {p.ocupadas.length === 0 ? (
          <Text style={styles.libre}>El espacio está libre todo el día.</Text>
        ) : (
          p.ocupadas.map((f) => (
            <Text key={f.clave} style={styles.ocupada}>
              {f.texto} · {f.estado}
            </Text>
          ))
        )}
      </View>

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

      {p.recursos.length > 0 && (
        <View style={styles.ocupacion}>
          <Text style={styles.etiqueta}>Recursos (opcional)</Text>
          {p.recursos.map((r) => (
            <View key={r.id} style={styles.filaRecurso}>
              <Text style={styles.nombreRecurso}>
                {r.nombre} <Text style={styles.disponibles}>({r.disponibles} disponibles)</Text>
              </Text>
              <View style={styles.contador}>
                <Pressable
                  style={styles.botonContador}
                  disabled={r.pedidos === 0}
                  onPress={() => p.ajustarRecurso(r.id, -1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pedir una unidad menos de ${r.nombre}`}
                >
                  <Text style={styles.textoContador}>−</Text>
                </Pressable>
                <Text style={styles.cantidad}>{r.pedidos}</Text>
                <Pressable
                  style={styles.botonContador}
                  disabled={r.pedidos >= r.disponibles}
                  onPress={() => p.ajustarRecurso(r.id, 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pedir una unidad más de ${r.nombre}`}
                >
                  <Text style={styles.textoContador}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

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
      {p.confirmacion && (
        <View>
          <Text style={styles.confirmacion}>{p.confirmacion}</Text>
          <Pressable style={[styles.boton, styles.botonSecundario]} onPress={p.verMisReservas} accessibilityRole="button">
            <Text style={[styles.textoBoton, styles.textoSecundario]}>Ver mis reservas</Text>
          </Pressable>
        </View>
      )}

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
