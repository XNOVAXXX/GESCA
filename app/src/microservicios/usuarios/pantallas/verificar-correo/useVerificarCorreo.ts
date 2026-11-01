import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { esCorreoInstitucional, validarCodigo, validarCorreo } from '@/microservicios/usuarios/usuarios.reglas';
import { enviarCodigo, verificarCodigo } from '@/microservicios/usuarios/usuarios.api';

type Paso = 'correo' | 'codigo';

// INSOFT-24: el solicitante verifica su correo con un código de 6 dígitos, sin contraseña.
export function useVerificarCorreo() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();

  const [paso, setPaso] = useState<Paso>('correo');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const pedirCodigo = async () => {
    const errorCorreo = validarCorreo(correo);
    if (!nombre.trim() || errorCorreo) {
      setError(!nombre.trim() ? 'Escribe tu nombre completo.' : errorCorreo);
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      await enviarCodigo(correo, nombre);
      setCodigo('');
      setPaso('codigo');
      setAviso(`Enviamos un código de 6 dígitos a ${correo.trim().toLowerCase()}.`);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo enviar el código.'));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCodigo = async () => {
    const errorCodigo = validarCodigo(codigo);
    if (errorCodigo) {
      setError(errorCodigo);
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const perfil = await verificarCodigo(correo, codigo);
      if (perfil.rol !== 'solicitante') router.replace('/panel');
      else if (volver) router.replace(volver as never);
      else router.replace('/');
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo verificar el código.'));
    } finally {
      setEnviando(false);
    }
  };

  const cambiarCorreo = () => {
    setPaso('correo');
    setCodigo('');
    setError(null);
    setAviso(null);
  };

  // RN05: el dominio del correo verificado decide quién aprueba las solicitudes.
  const requiereCoordinacion = correo.trim() !== '' && !validarCorreo(correo) && !esCorreoInstitucional(correo);

  const irAIngresoAdministrativo = () => router.replace('/acceso/ingresar');

  return {
    paso,
    nombre,
    setNombre,
    correo,
    setCorreo,
    codigo,
    setCodigo,
    error,
    aviso,
    enviando,
    requiereCoordinacion,
    pedirCodigo,
    confirmarCodigo,
    cambiarCorreo,
    irAIngresoAdministrativo,
  };
}

export type VerificarCorreoProps = ReturnType<typeof useVerificarCorreo>;
