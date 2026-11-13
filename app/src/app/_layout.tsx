import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ZonaActividad } from '@/compartido/componentes/ZonaActividad.view';
import { colors } from '@/compartido/tema';
import { useCierrePorInactividad } from '@/microservicios/usuarios';

export default function RootLayout() {
  const { registrarActividad } = useCierrePorInactividad();

  return (
    <ZonaActividad onActividad={registrarActividad}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primarioOscuro },
          headerTintColor: colors.superficie,
          contentStyle: { backgroundColor: colors.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'GESCA' }} />
        <Stack.Screen name="reservas/solicitar" options={{ title: 'Nueva reserva' }} />
        <Stack.Screen name="acceso/ingresar" options={{ title: 'Ingresar' }} />
        <Stack.Screen name="acceso/verificar" options={{ title: 'Verificar correo' }} />
        <Stack.Screen name="panel" options={{ title: 'Mi panel' }} />
        <Stack.Screen name="admin/usuarios" options={{ title: 'Usuarios y roles' }} />
        <Stack.Screen name="admin/espacios" options={{ title: 'Gestionar espacios' }} />
      </Stack>
    </ZonaActividad>
  );
}
