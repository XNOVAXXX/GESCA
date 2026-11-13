import { useEffect, useMemo, useState } from 'react';
import { mensajeDe } from '@/compartido/errores';
import {
  crearEspacio,
  editarEspacio,
  listarEspacios,
  ponerEnMantenimiento,
  reactivarEspacio,
} from '@/microservicios/espacios/espacios.api';
import { mismoNombre, validarEspacio, validarMotivo } from '@/microservicios/espacios/espacios.reglas';
import { NOMBRE_ESTADO, NOMBRE_TIPO, type Espacio, type TipoEspacio } from '@/microservicios/espacios/espacios.tipos';
import { useRequiereRol } from '@/microservicios/usuarios';

const SOLO_ADMIN = ['admin'] as const;
const TIPOS = Object.keys(NOMBRE_TIPO) as TipoEspacio[];

interface Formulario {
  id: string | null; // null = espacio nuevo
  nombre: string;
  tipo: TipoEspacio;
  capacidad: string;
}

const VACIO: Formulario = { id: null, nombre: '', tipo: 'auditorio', capacidad: '' };

// INSOFT-28 (registrar, editar, listar e inhabilitar espacios) y HU02 / INSOFT-29 (mantenimiento con motivo).
export function useGestionEspacios() {
  const { perfil, cargando: verificando } = useRequiereRol(SOLO_ADMIN);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const [mantenimiento, setMantenimiento] = useState<{ id: string; motivo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    let vigente = true;
    listarEspacios()
      .then((lista) => {
        if (vigente) setEspacios(lista);
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
  }, [perfil]);

  const reemplazar = (espacio: Espacio) =>
    setEspacios((lista) =>
      [...lista.filter((e) => e.id !== espacio.id), espacio].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );

  const ejecutar = async (accion: () => Promise<string>) => {
    setError(null);
    setAviso(null);
    setGuardando(true);
    try {
      setAviso(await accion());
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo guardar el cambio.'));
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    const { id, nombre, tipo, capacidad } = formulario;
    const invalido = validarEspacio(nombre, capacidad);
    if (invalido) {
      setAviso(null);
      setError(invalido);
      return;
    }
    if (espacios.some((e) => e.id !== id && mismoNombre(e.nombre, nombre))) {
      setAviso(null);
      setError('Ya existe un espacio con ese nombre.');
      return;
    }
    const datos = { nombre, tipo, capacidad_max: Number(capacidad) };
    void ejecutar(async () => {
      const espacio = id ? await editarEspacio(id, datos) : await crearEspacio(datos);
      reemplazar(espacio);
      setFormulario(VACIO);
      return id ? `Se guardaron los cambios de ${espacio.nombre}.` : `${espacio.nombre} quedó registrado.`;
    });
  };

  const editar = (espacio: Espacio) => {
    setError(null);
    setAviso(null);
    setMantenimiento(null);
    setFormulario({
      id: espacio.id,
      nombre: espacio.nombre,
      tipo: espacio.tipo,
      capacidad: String(espacio.capacidad_max),
    });
  };

  const confirmarMantenimiento = () => {
    if (!mantenimiento) return;
    const invalido = validarMotivo(mantenimiento.motivo);
    if (invalido) {
      setAviso(null);
      setError(invalido);
      return;
    }
    void ejecutar(async () => {
      const espacio = await ponerEnMantenimiento(mantenimiento.id, mantenimiento.motivo);
      reemplazar(espacio);
      setMantenimiento(null);
      return `${espacio.nombre} quedó en mantenimiento y no recibe reservas.`;
    });
  };

  const reactivar = (espacio: Espacio) =>
    void ejecutar(async () => {
      const actualizado = await reactivarEspacio(espacio.id);
      reemplazar(actualizado);
      return `${actualizado.nombre} vuelve a recibir reservas.`;
    });

  const filas = useMemo(
    () =>
      espacios.map((e) => ({
        ...e,
        nombreTipo: NOMBRE_TIPO[e.tipo],
        nombreEstado: NOMBRE_ESTADO[e.estado],
        enMantenimiento: e.estado === 'mantenimiento',
      })),
    [espacios],
  );

  return {
    cargando: verificando || cargando,
    espacios: filas,
    tipos: TIPOS.map((tipo) => ({ tipo, nombre: NOMBRE_TIPO[tipo] })),
    formulario,
    editando: formulario.id !== null,
    setNombre: (nombre: string) => setFormulario((f) => ({ ...f, nombre })),
    setTipo: (tipo: TipoEspacio) => setFormulario((f) => ({ ...f, tipo })),
    setCapacidad: (capacidad: string) => setFormulario((f) => ({ ...f, capacidad })),
    guardar,
    cancelarEdicion: () => setFormulario(VACIO),
    editar,
    mantenimiento,
    abrirMantenimiento: (espacio: Espacio) => {
      setError(null);
      setAviso(null);
      setMantenimiento({ id: espacio.id, motivo: '' });
    },
    setMotivo: (motivo: string) => setMantenimiento((m) => (m ? { ...m, motivo } : m)),
    confirmarMantenimiento,
    cancelarMantenimiento: () => setMantenimiento(null),
    reactivar,
    error,
    aviso,
    guardando,
  };
}

export type GestionEspaciosProps = ReturnType<typeof useGestionEspacios>;
