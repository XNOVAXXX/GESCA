import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { NOMBRE_TIPO, type Espacio, type TipoEspacio } from '@/microservicios/espacios/espacios.tipos';
import { listarEspacios } from '@/microservicios/espacios/espacios.api';
import { filtrarEspacios } from '@/microservicios/espacios/espacios.reglas';
import {
  claveDia,
  diaCorto,
  diasReservables,
  escucharOcupacion,
  hora,
  ocupacionEntre,
  type Franja,
} from '@/microservicios/reservas';
import { useSesion } from '@/microservicios/usuarios';

const TIPOS = Object.keys(NOMBRE_TIPO) as TipoEspacio[];

// RF02 / INSOFT-32: calendario de disponibilidad con filtros por tipo, capacidad y fecha.
// INSOFT-36: las franjas ocupadas se actualizan solas cuando alguien reserva.
export function useDisponibilidad() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { perfil } = useSesion();

  const dias = useMemo(() => diasReservables(), []);
  const [fecha, setFecha] = useState(() => claveDia(dias[0]));
  const [tipo, setTipo] = useState<TipoEspacio | null>(null);
  const [capacidad, setCapacidad] = useState('');
  const [ocupacion, setOcupacion] = useState<Franja[]>([]);
  const [versionOcupacion, setVersionOcupacion] = useState(0);

  useEffect(() => {
    let vigente = true;
    listarEspacios()
      .then((data) => {
        if (!vigente) return;
        setEspacios(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (vigente) setError(mensajeDe(e, 'No se pudieron cargar los espacios.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [version]);

  // Una sola consulta trae la ocupación del día para todos los espacios (RNF03).
  useEffect(() => {
    const dia = dias.find((d) => claveDia(d) === fecha);
    if (!dia) return;
    const hasta = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
    let vigente = true;
    ocupacionEntre(dia, hasta)
      .then((lista) => {
        if (vigente) setOcupacion(lista);
      })
      .catch(() => {
        if (vigente) setOcupacion([]);
      });
    return () => {
      vigente = false;
    };
  }, [fecha, dias, versionOcupacion]);

  useEffect(() => escucharOcupacion(() => setVersionOcupacion((v) => v + 1)), []);

  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
    setVersionOcupacion((v) => v + 1);
  }, []);

  const solicitar = (espacio: Espacio) => {
    if (espacio.estado !== 'activo') return; // RN03
    router.push({ pathname: '/reservas/solicitar', params: { espacioId: espacio.id, nombre: espacio.nombre } });
  };

  const irACuenta = () => router.push(perfil ? '/panel' : '/acceso/ingresar');

  const filas = useMemo(
    () =>
      filtrarEspacios(espacios, { tipo, capacidad }).map((e) => {
        const franjas = ocupacion.filter((f) => f.espacioId === e.id);
        return {
          ...e,
          nombreTipo: NOMBRE_TIPO[e.tipo],
          disponible: e.estado === 'activo',
          recursos: (e.items ?? []).filter((i) => i.cantidad > 0).map((i) => i.nombre).join(', '),
          ocupadas: franjas.map((f) => `${hora(f.inicio)}–${hora(f.fin)}${f.estado === 'pendiente' ? ' (pendiente)' : ''}`),
        };
      }),
    [espacios, tipo, capacidad, ocupacion],
  );

  return {
    espacios: filas,
    cargando,
    error,
    recargar,
    solicitar,
    textoCuenta: perfil ? `Hola, ${perfil.nombre.split(' ')[0]}` : 'Ingreso administrativo',
    irACuenta,
    verMisReservas: perfil ? () => router.push('/reservas/mias') : null,
    tipos: [{ tipo: null, nombre: 'Todos' }, ...TIPOS.map((t) => ({ tipo: t, nombre: NOMBRE_TIPO[t] }))],
    tipo,
    setTipo,
    capacidad,
    setCapacidad,
    dias: dias.map((d, i) => ({ clave: claveDia(d), texto: i === 0 ? 'Hoy' : diaCorto(d) })),
    fecha,
    setFecha,
  };
}

export type DisponibilidadProps = ReturnType<typeof useDisponibilidad>;
