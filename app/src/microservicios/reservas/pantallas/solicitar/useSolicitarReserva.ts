import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { mensajeDe } from '@/compartido/errores';
import { diasReservables, validarSolicitud } from '@/microservicios/reservas/reservas.reglas';
import { escucharOcupacion, ocupacionDelDia, radicarSolicitud } from '@/microservicios/reservas/reservas.api';
import { claveDia, diaCorto, hora } from '@/microservicios/reservas/reservas.formato';
import type { Franja } from '@/microservicios/reservas/reservas.tipos';
import { itemsDelEspacio, type Item } from '@/microservicios/espacios';
import { useSesion } from '@/microservicios/usuarios';

// Convierte "AAAA-MM-DD" + "HH:MM" en fecha local; null si el formato no es válido.
function aFecha(fecha: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const d = new Date(`${fecha}T${hora}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useSolicitarReserva() {
  const { espacioId = '', nombre = '' } = useLocalSearchParams<{ espacioId: string; nombre: string }>();
  const { perfil } = useSesion();

  const dias = useMemo(() => diasReservables(), []);
  const [fecha, setFecha] = useState(() => claveDia(dias[1] ?? dias[0]));
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivoUso, setMotivoUso] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [ocupadas, setOcupadas] = useState<Franja[]>([]);
  const [version, setVersion] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  // HU01: recursos que ofrece el espacio (micrófonos, sillas…), para pedirlos con la reserva.
  useEffect(() => {
    if (!espacioId) return;
    let vigente = true;
    itemsDelEspacio(espacioId)
      .then((lista) => {
        if (vigente) setItems(lista.filter((i) => i.cantidad > 0));
      })
      .catch(() => {
        if (vigente) setItems([]);
      });
    return () => {
      vigente = false;
    };
  }, [espacioId]);

  // INSOFT-36: si otra persona reserva este espacio, los horarios ocupados se actualizan solos.
  useEffect(
    () =>
      escucharOcupacion((id) => {
        if (!id || id === espacioId) setVersion((v) => v + 1);
      }),
    [espacioId],
  );

  // RF02 / INSOFT-32: horarios ya ocupados del espacio en el día elegido, para no pedir uno que se cruce (RN01).
  useEffect(() => {
    const dia = dias.find((d) => claveDia(d) === fecha);
    if (!espacioId || !dia) return;
    let vigente = true;
    ocupacionDelDia(espacioId, dia)
      .then((lista) => {
        if (vigente) setOcupadas(lista);
      })
      .catch(() => {
        if (vigente) setOcupadas([]);
      });
    return () => {
      vigente = false;
    };
  }, [espacioId, fecha, dias, version]);

  const enviar = async () => {
    setConfirmacion(null);
    const inicio = aFecha(fecha, horaInicio);
    const fin = aFecha(fecha, horaFin);
    if (!inicio || !fin) {
      setErrores(['Escribe las horas en formato HH:MM, por ejemplo 08:00.']);
      return;
    }

    const solicitud = {
      espacioId,
      inicio,
      fin,
      motivoUso,
      items: Object.entries(cantidades).map(([itemId, cantidad]) => ({ itemId, cantidad })),
    };
    const encontrados = validarSolicitud(solicitud);
    setErrores(encontrados);
    if (encontrados.length > 0) return; // HU01 escenario 2: el formulario sigue en edición

    // Solo un correo verificado puede radicar (RNF01). Después de verificar vuelve a este formulario.
    if (!perfil) {
      const volver = `/reservas/solicitar?espacioId=${encodeURIComponent(espacioId)}&nombre=${encodeURIComponent(nombre)}`;
      router.push({ pathname: '/acceso/verificar', params: { volver } });
      return;
    }

    setEnviando(true);
    try {
      const r = await radicarSolicitud(solicitud);
      setConfirmacion(
        r.bandeja === 'coordinador'
          ? 'Solicitud radicada. Requiere aprobación de Coordinación.'
          : 'Solicitud radicada en estado Pendiente.',
      );
      setMotivoUso('');
      setCantidades({});
      setVersion((v) => v + 1);
    } catch (e) {
      setErrores([mensajeDe(e, 'No se pudo radicar la solicitud.')]);
    } finally {
      setEnviando(false);
    }
  };

  return {
    nombreEspacio: nombre,
    dias: dias.map((d) => ({ clave: claveDia(d), texto: diaCorto(d) })),
    fecha,
    setFecha,
    ocupadas: ocupadas.map((f) => ({
      clave: `${f.inicio.toISOString()}-${f.estado}`,
      texto: `${hora(f.inicio)} a ${hora(f.fin)}`,
      estado: f.estado === 'aprobada' ? 'Aprobada' : 'Pendiente',
    })),
    horaInicio,
    setHoraInicio,
    horaFin,
    setHoraFin,
    motivoUso,
    setMotivoUso,
    errores,
    enviando,
    confirmacion,
    enviar,
    recursos: items.map((i) => ({ id: i.id, nombre: i.nombre, disponibles: i.cantidad, pedidos: cantidades[i.id] ?? 0 })),
    ajustarRecurso: (id: string, delta: number) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setCantidades((c) => {
        const nueva = Math.min(item.cantidad, Math.max(0, (c[id] ?? 0) + delta));
        const { [id]: _anterior, ...resto } = c;
        return nueva > 0 ? { ...resto, [id]: nueva } : resto;
      });
    },
    correoVerificado: perfil?.correo ?? null,
    verMisReservas: () => router.push('/reservas/mias'),
  };
}

export type SolicitarReservaProps = ReturnType<typeof useSolicitarReserva>;
