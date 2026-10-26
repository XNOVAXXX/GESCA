// Pruebas del microservicio de usuarios con Supabase simulado (no se conecta a internet).
import { enviarCodigo, iniciarSesionConContrasena, obtenerPerfil, verificarCodigo } from './auth.service';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    schema: jest.fn(),
  },
}));

const auth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const schema = supabase.schema as jest.Mock;

const ID = 'usuario-1';
const perfilAdmin = { id: ID, nombre: 'Laura Admin', correo: 'laura@pascualbravo.edu.co', rol: 'admin' };

// Simula la consulta usuarios.perfiles → select → eq → maybeSingle.
function perfilEnBaseDeDatos(perfil: object | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: perfil, error: null });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  schema.mockReturnValue({ from: jest.fn(() => ({ select })) });
  return { eq };
}

function haySesion(id: string | null) {
  auth.getSession.mockResolvedValue({ data: { session: id ? { user: { id } } : null } } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  auth.signOut.mockResolvedValue({ error: null } as never);
});

describe('iniciarSesionConContrasena (INSOFT-23)', () => {
  it('con credenciales válidas devuelve el perfil con su rol', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    haySesion(ID);
    perfilEnBaseDeDatos(perfilAdmin);

    await expect(iniciarSesionConContrasena(' laura@pascualbravo.edu.co ', 'clave')).resolves.toEqual(perfilAdmin);
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'laura@pascualbravo.edu.co', password: 'clave' });
  });

  it('con credenciales inválidas muestra un error que no revela qué dato falló', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } } as never);

    await expect(iniciarSesionConContrasena('laura@pascualbravo.edu.co', 'mala')).rejects.toThrow(
      'Correo o contraseña incorrectos.',
    );
  });

  it('un solicitante no puede entrar por el ingreso administrativo y se cierra su sesión', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    haySesion(ID);
    perfilEnBaseDeDatos({ ...perfilAdmin, rol: 'solicitante' });

    await expect(iniciarSesionConContrasena('ana@pascualbravo.edu.co', 'clave')).rejects.toThrow(
      'Este ingreso es para Administración y Coordinación',
    );
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('si el usuario no tiene perfil, cierra la sesión y da el mismo error genérico', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null } as never);
    haySesion(ID);
    perfilEnBaseDeDatos(null);

    await expect(iniciarSesionConContrasena('x@pascualbravo.edu.co', 'clave')).rejects.toThrow(
      'Correo o contraseña incorrectos.',
    );
    expect(auth.signOut).toHaveBeenCalled();
  });
});

describe('enviarCodigo (INSOFT-24)', () => {
  it('pide el código creando al usuario si es nuevo, con su nombre', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null } as never);

    await enviarCodigo(' Ana@Gmail.com ', ' Ana Pérez ');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@gmail.com',
      options: { shouldCreateUser: true, data: { nombre: 'Ana Pérez' } },
    });
  });

  it('avisa cuando se piden códigos muy seguido', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { status: 429 } } as never);

    await expect(enviarCodigo('ana@gmail.com', 'Ana')).rejects.toThrow('Espera un momento');
  });

  it('da un mensaje claro si el envío falla', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: { status: 500 } } as never);

    await expect(enviarCodigo('ana@gmail.com', 'Ana')).rejects.toThrow('No se pudo enviar el código');
  });
});

describe('verificarCodigo (INSOFT-24)', () => {
  it('con el código correcto queda con sesión de solicitante', async () => {
    const solicitante = { ...perfilAdmin, rol: 'solicitante', correo: 'ana@gmail.com' };
    auth.verifyOtp.mockResolvedValue({ error: null } as never);
    haySesion(ID);
    perfilEnBaseDeDatos(solicitante);

    await expect(verificarCodigo('ana@gmail.com', ' 123456 ')).resolves.toEqual(solicitante);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'ana@gmail.com', token: '123456', type: 'email' });
  });

  it('con un código incorrecto o vencido no abre sesión', async () => {
    auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } } as never);

    await expect(verificarCodigo('ana@gmail.com', '000000')).rejects.toThrow('El código no es válido o ya venció');
    expect(schema).not.toHaveBeenCalled();
  });
});

describe('obtenerPerfil', () => {
  it('sin sesión devuelve null y no consulta la base de datos', async () => {
    haySesion(null);

    await expect(obtenerPerfil()).resolves.toBeNull();
    expect(schema).not.toHaveBeenCalled();
  });

  it('consulta el perfil del usuario de la sesión en el esquema usuarios', async () => {
    haySesion(ID);
    const { eq } = perfilEnBaseDeDatos(perfilAdmin);

    await obtenerPerfil();
    expect(schema).toHaveBeenCalledWith('usuarios');
    expect(eq).toHaveBeenCalledWith('id', ID);
  });
});
