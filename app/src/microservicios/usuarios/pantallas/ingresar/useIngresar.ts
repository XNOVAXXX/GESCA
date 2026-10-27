import { useState } from 'react';
import { router } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { validarCorreo } from '@/microservicios/usuarios/usuarios.reglas';
import { iniciarSesionConContrasena } from '@/microservicios/usuarios/usuarios.api';

// INSOFT-23: ingreso con contraseña para Administrador y Coordinador.
export function useIngresar() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ingresar = async () => {
    const errorCorreo = validarCorreo(correo);
    if (errorCorreo || !contrasena) {
      setError(errorCorreo ?? 'Escribe tu contraseña.');
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      await iniciarSesionConContrasena(correo, contrasena);
      setContrasena('');
      router.replace('/panel');
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo iniciar sesión.'));
    } finally {
      setEnviando(false);
    }
  };

  const irAVerificarCorreo = () => router.replace('/acceso/verificar');

  return { correo, setCorreo, contrasena, setContrasena, error, enviando, ingresar, irAVerificarCorreo };
}

export type IngresarProps = ReturnType<typeof useIngresar>;
