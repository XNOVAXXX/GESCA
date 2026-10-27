// Microservicio de USUARIOS: Supabase Auth + tabla usuarios.perfiles (RNF01, RN05).
// Administrador y Coordinador entran con contraseña; el solicitante, con un código al correo.
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/compartido/supabase';
import type { Perfil } from './usuarios.tipos';

const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos.';

export async function iniciarSesionConContrasena(correo: string, contrasena: string): Promise<Perfil> {
  const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena });
  // Mismo mensaje para cualquier fallo: no revela si el correo existe.
  if (error) throw new Error(CREDENCIALES_INVALIDAS);

  const perfil = await obtenerPerfil();
  if (!perfil) {
    await supabase.auth.signOut();
    throw new Error(CREDENCIALES_INVALIDAS);
  }
  if (perfil.rol === 'solicitante') {
    await supabase.auth.signOut();
    throw new Error('Este ingreso es para Administración y Coordinación. Para reservar, verifica tu correo con un código.');
  }
  return perfil;
}

// Envía un código de 6 dígitos al correo. Si el correo es nuevo, crea el usuario como solicitante.
export async function enviarCodigo(correo: string, nombre: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: correo.trim().toLowerCase(),
    options: { shouldCreateUser: true, data: { nombre: nombre.trim() } },
  });
  if (error?.status === 429) throw new Error('Ya enviamos un código hace poco. Espera un momento y vuelve a intentarlo.');
  if (error) throw new Error('No se pudo enviar el código. Revisa el correo e inténtalo de nuevo.');
}

export async function verificarCodigo(correo: string, codigo: string): Promise<Perfil> {
  const { error } = await supabase.auth.verifyOtp({
    email: correo.trim().toLowerCase(),
    token: codigo.trim(),
    type: 'email',
  });
  if (error) throw new Error('El código no es válido o ya venció. Pide uno nuevo.');

  const perfil = await obtenerPerfil();
  if (!perfil) throw new Error('No encontramos tu perfil. Inténtalo de nuevo.');
  return perfil;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  const { data: sesion } = await supabase.auth.getSession();
  const id = sesion.session?.user.id;
  if (!id) return null;

  const { data, error } = await supabase
    .schema('usuarios')
    .from('perfiles')
    .select('id, nombre, correo, rol')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('No se pudo cargar tu perfil.');
  return data as Perfil | null;
}

// Avisa cada vez que la sesión empieza o termina. Devuelve la función para dejar de escuchar.
export function escucharSesion(alCambiar: (haySesion: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion: Session | null) => alCambiar(!!sesion));
  return () => data.subscription.unsubscribe();
}
