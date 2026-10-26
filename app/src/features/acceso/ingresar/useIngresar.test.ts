// Pruebas de la lógica de la pantalla de ingreso, sin dibujar la pantalla.
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { iniciarSesionConContrasena } from '@/services/auth.service';
import { useIngresar } from './useIngresar';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/services/auth.service', () => ({ iniciarSesionConContrasena: jest.fn() }));

const iniciarSesion = iniciarSesionConContrasena as jest.Mock;

beforeEach(() => jest.clearAllMocks());

async function ingresarCon(correo: string, contrasena: string) {
  const { result } = await renderHook(() => useIngresar());
  await act(() => {
    result.current.setCorreo(correo);
    result.current.setContrasena(contrasena);
  });
  await act(() => result.current.ingresar());
  return result;
}

it('no llama al servidor si el correo no es válido', async () => {
  const result = await ingresarCon('laura', 'clave');

  expect(result.current.error).toBe('Escribe un correo válido.');
  expect(iniciarSesion).not.toHaveBeenCalled();
});

it('pide la contraseña si está vacía', async () => {
  const result = await ingresarCon('laura@pascualbravo.edu.co', '');

  expect(result.current.error).toBe('Escribe tu contraseña.');
  expect(iniciarSesion).not.toHaveBeenCalled();
});

it('con credenciales válidas lleva al panel y borra la contraseña', async () => {
  iniciarSesion.mockResolvedValue({ rol: 'admin' });
  const result = await ingresarCon('laura@pascualbravo.edu.co', 'clave');

  expect(router.replace).toHaveBeenCalledWith('/panel');
  expect(result.current.contrasena).toBe('');
  expect(result.current.error).toBeNull();
  expect(result.current.enviando).toBe(false);
});

it('con credenciales inválidas muestra el error del servicio y no navega', async () => {
  iniciarSesion.mockRejectedValue(new Error('Correo o contraseña incorrectos.'));
  const result = await ingresarCon('laura@pascualbravo.edu.co', 'mala');

  expect(result.current.error).toBe('Correo o contraseña incorrectos.');
  expect(router.replace).not.toHaveBeenCalled();
  expect(result.current.enviando).toBe(false);
});
