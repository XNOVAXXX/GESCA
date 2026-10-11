import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
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
      </Stack>
    </>
  );
}
