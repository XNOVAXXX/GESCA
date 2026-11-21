// Microservicio de ESPACIOS (INSOFT-31): crea, edita y cambia el estado de los espacios y sus recursos.
// Solo un administrador puede hacerlo: lo garantiza la RLS de la base de datos, porque este servicio
// trabaja con la sesión de quien llama. Aquí se validan los datos y se traducen los errores.
import { clienteDelUsuario, cors, type ErrorBD, leerCuerpo, responder } from '../_compartido/http.ts';

const COLUMNAS = 'id, nombre, tipo, capacidad_max, estado, motivo_estado';
const COLUMNAS_ITEM = 'id, nombre, cantidad';
const TIPOS = ['auditorio', 'sala_computo', 'cancha', 'laboratorio', 'espacio_compartido'];

type Peticion =
  | { accion: 'crear_espacio'; nombre?: string; tipo?: string; capacidad_max?: number }
  | { accion: 'editar_espacio'; id?: string; nombre?: string; tipo?: string; capacidad_max?: number }
  | { accion: 'mantenimiento'; id?: string; motivo?: string }
  | { accion: 'reactivar'; id?: string }
  | { accion: 'crear_item'; espacio_id?: string; nombre?: string; cantidad?: number }
  | { accion: 'cambiar_cantidad'; id?: string; cantidad?: number }
  | { accion: 'eliminar_item'; id?: string };

function mensajeDeError(e: ErrorBD, porDefecto: string): string {
  if (e.code === '23505') return e.message.includes('items') ? 'Ese espacio ya tiene un recurso con ese nombre.' : 'Ya existe un espacio con ese nombre.';
  if (e.code === '23503') return 'Este recurso ya se pidió en reservas. En lugar de quitarlo, deja su cantidad en 0.';
  if (e.code === '23514') {
    if (e.message.includes('mantenimiento_con_motivo')) return 'Indica el motivo del mantenimiento.';
    return 'Revisa los datos: el nombre es obligatorio y las cantidades no pueden ser negativas.';
  }
  if (e.code === '42501') return 'Solo un administrador puede gestionar espacios.';
  return porDefecto;
}

type Validacion =
  | { error: string; datos?: undefined }
  | { error?: undefined; datos: { nombre: string; tipo: string; capacidad_max: number } };

function datosEspacio(p: { nombre?: string; tipo?: string; capacidad_max?: number }): Validacion {
  const nombre = p.nombre?.trim() ?? '';
  const capacidad = Number(p.capacidad_max);
  if (!nombre) return { error: 'Escribe el nombre del espacio.' };
  if (!p.tipo || !TIPOS.includes(p.tipo)) return { error: 'Elige un tipo de espacio válido.' };
  if (!Number.isInteger(capacidad) || capacidad <= 0) return { error: 'La capacidad máxima debe ser un número entero mayor que 0.' };
  return { datos: { nombre, tipo: p.tipo, capacidad_max: capacidad } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' });

  const supabase = clienteDelUsuario(req);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return responder(401, { error: 'Debes ingresar como administrador.' });

  const p = await leerCuerpo<Peticion>(req);
  if (!p?.accion) return responder(400, { error: 'Solicitud inválida.' });

  const espacios = supabase.schema('espacios').from('espacios');
  const items = supabase.schema('espacios').from('items');

  // La RLS no da error cuando quien escribe no es admin: simplemente no toca filas.
  const unaFila = <T>(data: T[] | null, mensaje: string) =>
    data && data.length > 0 ? responder(200, data[0]) : responder(403, { error: mensaje });

  switch (p.accion) {
    case 'crear_espacio': {
      const v = datosEspacio(p);
      if (v.error !== undefined) return responder(400, { error: v.error });
      const { data, error } = await espacios.insert(v.datos).select(COLUMNAS);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo crear el espacio.') });
      return unaFila(data, 'Solo un administrador puede gestionar espacios.');
    }
    case 'editar_espacio': {
      const v = datosEspacio(p);
      if (!p.id) return responder(400, { error: 'Falta el espacio.' });
      if (v.error !== undefined) return responder(400, { error: v.error });
      const { data, error } = await espacios.update(v.datos).eq('id', p.id).select(COLUMNAS);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo guardar el espacio.') });
      return unaFila(data, 'No se pudo guardar el espacio.');
    }
    case 'mantenimiento': {
      // HU02: el motivo es obligatorio (mínimo 5 caracteres).
      const motivo = p.motivo?.trim() ?? '';
      if (!p.id) return responder(400, { error: 'Falta el espacio.' });
      if (motivo.length < 5) return responder(400, { error: 'Indica el motivo del mantenimiento (mínimo 5 caracteres).' });
      const { data, error } = await espacios
        .update({ estado: 'mantenimiento', motivo_estado: motivo })
        .eq('id', p.id)
        .select(COLUMNAS);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo cambiar el estado.') });
      return unaFila(data, 'No se pudo cambiar el estado.');
    }
    case 'reactivar': {
      if (!p.id) return responder(400, { error: 'Falta el espacio.' });
      const { data, error } = await espacios.update({ estado: 'activo', motivo_estado: null }).eq('id', p.id).select(COLUMNAS);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo reactivar el espacio.') });
      return unaFila(data, 'No se pudo reactivar el espacio.');
    }
    case 'crear_item': {
      const nombre = p.nombre?.trim() ?? '';
      const cantidad = Number(p.cantidad);
      if (!p.espacio_id) return responder(400, { error: 'Falta el espacio.' });
      if (!nombre) return responder(400, { error: 'Escribe el nombre del recurso.' });
      if (!Number.isInteger(cantidad) || cantidad < 1) return responder(400, { error: 'La cantidad debe ser un número entero de 1 o más.' });
      const { data, error } = await items.insert({ espacio_id: p.espacio_id, nombre, cantidad }).select(COLUMNAS_ITEM);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo agregar el recurso.') });
      return unaFila(data, 'Solo un administrador puede gestionar recursos.');
    }
    case 'cambiar_cantidad': {
      const cantidad = Number(p.cantidad);
      if (!p.id) return responder(400, { error: 'Falta el recurso.' });
      if (!Number.isInteger(cantidad) || cantidad < 0) return responder(400, { error: 'La cantidad no puede ser negativa.' });
      const { data, error } = await items.update({ cantidad }).eq('id', p.id).select(COLUMNAS_ITEM);
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo cambiar la cantidad.') });
      return unaFila(data, 'No se pudo cambiar la cantidad.');
    }
    case 'eliminar_item': {
      if (!p.id) return responder(400, { error: 'Falta el recurso.' });
      const { data, error } = await items.delete().eq('id', p.id).select('id');
      if (error) return responder(409, { error: mensajeDeError(error, 'No se pudo quitar el recurso.') });
      return unaFila(data, 'No se pudo quitar el recurso.');
    }
    default:
      return responder(400, { error: 'Acción desconocida.' });
  }
});
