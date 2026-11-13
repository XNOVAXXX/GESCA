import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '@/compartido/tema';
import type { GestionEspaciosProps } from './useGestionEspacios';
import { styles } from './GestionEspacios.styles';

export function GestionEspaciosView(p: GestionEspaciosProps) {
  if (p.cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primario} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Espacios</Text>
      <Text style={styles.subtitulo}>
        Registra los espacios con su tipo y capacidad. Un espacio en mantenimiento no recibe solicitudes ni aprobaciones.
      </Text>

      <View style={styles.formulario}>
        <Text style={styles.seccion}>{p.editando ? 'Editar espacio' : 'Nuevo espacio'}</Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.campo}
          value={p.formulario.nombre}
          onChangeText={p.setNombre}
          placeholder="Ej. Auditorio principal"
          placeholderTextColor={colors.textoSuave}
        />

        <Text style={styles.etiqueta}>Tipo</Text>
        <View style={styles.opciones}>
          {p.tipos.map(({ tipo, nombre }) => {
            const activo = p.formulario.tipo === tipo;
            return (
              <Pressable
                key={tipo}
                style={[styles.opcion, activo && styles.opcionActiva]}
                onPress={() => p.setTipo(tipo)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[styles.textoOpcion, activo && styles.textoOpcionActiva]}>{nombre}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>Capacidad máxima</Text>
        <TextInput
          style={styles.campo}
          value={p.formulario.capacidad}
          onChangeText={p.setCapacidad}
          placeholder="Número de personas"
          placeholderTextColor={colors.textoSuave}
          keyboardType="number-pad"
        />

        <View style={styles.acciones}>
          <Pressable
            style={[styles.boton, styles.botonAccion, p.guardando && styles.botonDeshabilitado]}
            disabled={p.guardando}
            onPress={p.guardar}
            accessibilityRole="button"
          >
            <Text style={styles.textoBoton}>{p.editando ? 'Guardar cambios' : 'Registrar espacio'}</Text>
          </Pressable>
          {p.editando && (
            <Pressable style={[styles.boton, styles.botonAccion, styles.botonSecundario]} onPress={p.cancelarEdicion} accessibilityRole="button">
              <Text style={[styles.textoBoton, styles.textoSecundario]}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      </View>

      {p.error && <Text style={styles.error}>{p.error}</Text>}
      {p.aviso && <Text style={styles.aviso}>{p.aviso}</Text>}

      {p.espacios.length === 0 && <Text style={styles.vacio}>Todavía no hay espacios registrados.</Text>}

      {p.espacios.map((e) => (
        <View key={e.id} style={[styles.tarjeta, e.enMantenimiento && styles.tarjetaMantenimiento]}>
          <View style={styles.encabezado}>
            <Text style={styles.nombre}>{e.nombre}</Text>
            <Text style={[styles.estado, e.enMantenimiento && styles.estadoMantenimiento]}>{e.nombreEstado}</Text>
          </View>
          <Text style={styles.detalle}>
            {e.nombreTipo} · Capacidad {e.capacidad_max}
          </Text>
          {e.enMantenimiento && e.motivo_estado && <Text style={styles.motivo}>Motivo: {e.motivo_estado}</Text>}

          {p.mantenimiento?.id === e.id ? (
            <View style={styles.panelMotivo}>
              <Text style={styles.etiqueta}>Motivo del mantenimiento</Text>
              <TextInput
                style={styles.campo}
                value={p.mantenimiento.motivo}
                onChangeText={p.setMotivo}
                placeholder="Ej. Cambio de sillas"
                placeholderTextColor={colors.textoSuave}
                autoFocus
              />
              <View style={styles.acciones}>
                <Pressable
                  style={[styles.botonPequeno, styles.botonAdvertencia, p.guardando && styles.botonDeshabilitado]}
                  disabled={p.guardando}
                  onPress={p.confirmarMantenimiento}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonPequeno}>Confirmar mantenimiento</Text>
                </Pressable>
                <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={p.cancelarMantenimiento} accessibilityRole="button">
                  <Text style={[styles.textoBotonPequeno, styles.textoSecundario]}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.acciones}>
              <Pressable style={[styles.botonPequeno, styles.botonContorno]} onPress={() => p.editar(e)} accessibilityRole="button">
                <Text style={[styles.textoBotonPequeno, styles.textoSecundario]}>Editar</Text>
              </Pressable>
              {e.enMantenimiento ? (
                <Pressable
                  style={[styles.botonPequeno, styles.botonExito, p.guardando && styles.botonDeshabilitado]}
                  disabled={p.guardando}
                  onPress={() => p.reactivar(e)}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBotonPequeno}>Reactivar</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.botonPequeno, styles.botonAdvertencia]} onPress={() => p.abrirMantenimiento(e)} accessibilityRole="button">
                  <Text style={styles.textoBotonPequeno}>Poner en mantenimiento</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
