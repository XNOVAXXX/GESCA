// Pruebas del microservicio de usuarios con Supabase simulado (no se conecta a internet).
import { iniciarSesionConContrasena, verificarCodigo } from './auth.service';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      verifyOtp: jest.fn(),
      getSession: jest.fn(),
    },
    schema: jest.fn(),
  },
}));

const auth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const schema = supabase.schema as jest.Mock;

describe('Acceso de usuarios', () => {
  it('5. una contraseña incorrecta da un error que no revela qué dato falló (INSOFT-23)', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } } as never);

    await expect(iniciarSesionConContrasena('laura@pascualbravo.edu.co', 'mala')).rejects.toThrow(
      'Correo o contraseña incorrectos.',
    );
  });

  it('6. el código de 6 dígitos correcto abre sesión como solicitante (INSOFT-24)', async () => {
    const solicitante = { id: 'u1', nombre: 'Ana Pérez', correo: 'ana@gmail.com', rol: 'solicitante' };
    auth.verifyOtp.mockResolvedValue({ error: null } as never);
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } } as never);
    const maybeSingle = jest.fn().mockResolvedValue({ data: solicitante, error: null });
    schema.mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    });

    await expect(verificarCodigo('ana@gmail.com', '123456')).resolves.toEqual(solicitante);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'ana@gmail.com', token: '123456', type: 'email' });
  });
});
