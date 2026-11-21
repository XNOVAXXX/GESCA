// Pruebas del microservicio de espacios con Supabase simulado (no se conecta a internet).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { cambiarCantidad, crearEspacio, eliminarItem, listarEspacios, reactivarEspacio } from './espacios.api';
import { supabase } from '@/compartido/supabase';

jest.mock('@/compartido/supabase', () => ({ supabase: { schema: jest.fn(), functions: { invoke: jest.fn() } } }));

const schema = supabase.schema as jest.Mock;
const invoke = supabase.functions.invoke as jest.Mock;

// Respuesta de error de una Edge Function, como la entrega supabase-js.
const errorDelServicio = (mensaje: string) => new FunctionsHttpError({ json: async () => ({ error: mensaje }) });

describe('API de espacios', () => {
  it('un nombre repetido da un mensaje claro (INSOFT-28)', async () => {
    invoke.mockResolvedValue({ data: null, error: errorDelServicio('Ya existe un espacio con ese nombre.') });

    await expect(crearEspacio({ nombre: 'Auditorio', tipo: 'auditorio', capacidad_max: 100 })).rejects.toThrow(
      'Ya existe un espacio con ese nombre.',
    );
  });

  it('los cambios pasan por svc-espacios con la acción indicada (INSOFT-31)', async () => {
    invoke.mockResolvedValue({ data: { id: 'e1', estado: 'activo' }, error: null });

    await reactivarEspacio('e1');
    expect(invoke).toHaveBeenCalledWith('svc-espacios', { body: { accion: 'reactivar', id: 'e1' } });
  });

  it('quitar un recurso ya pedido en reservas muestra el mensaje del servicio (INSOFT-30)', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: errorDelServicio('Este recurso ya se pidió en reservas. En lugar de quitarlo, deja su cantidad en 0.'),
    });

    await expect(eliminarItem('i1')).rejects.toThrow(/deja su cantidad en 0/);
  });

  it('cambiar la cantidad de un recurso devuelve el recurso actualizado', async () => {
    invoke.mockResolvedValue({ data: { id: 'i1', nombre: 'Silla', cantidad: 5 }, error: null });

    await expect(cambiarCantidad('i1', 5)).resolves.toEqual({ id: 'i1', nombre: 'Silla', cantidad: 5 });
    expect(invoke).toHaveBeenCalledWith('svc-espacios', { body: { accion: 'cambiar_cantidad', id: 'i1', cantidad: 5 } });
  });

  it('el catálogo trae los recursos de cada espacio ordenados por nombre', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'e1',
          nombre: 'Auditorio',
          items: [
            { id: 'b', nombre: 'Video beam', cantidad: 1 },
            { id: 'a', nombre: 'Micrófono', cantidad: 4 },
          ],
        },
      ],
      error: null,
    });
    schema.mockReturnValue({ from: () => ({ select: () => ({ order }) }) });

    const [espacio] = await listarEspacios();
    expect(espacio.items?.map((i) => i.nombre)).toEqual(['Micrófono', 'Video beam']);
  });
});
