// Pruebas del microservicio de espacios con Supabase simulado (no se conecta a internet).
import { cambiarCantidad, crearEspacio, eliminarItem, reactivarEspacio } from './espacios.api';
import { supabase } from '@/compartido/supabase';

jest.mock('@/compartido/supabase', () => ({ supabase: { schema: jest.fn() } }));

const schema = supabase.schema as jest.Mock;

describe('API de espacios', () => {
  it('un nombre repetido da un mensaje claro (INSOFT-28)', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });
    schema.mockReturnValue({ from: () => ({ insert: () => ({ select: () => ({ single }) }) }) });

    await expect(crearEspacio({ nombre: 'Auditorio', tipo: 'auditorio', capacidad_max: 100 })).rejects.toThrow(
      'Ya existe un espacio con ese nombre.',
    );
  });

  it('reactivar borra el motivo y falla si la base no devolvió la fila', async () => {
    const update = jest.fn().mockReturnValue({ eq: () => ({ select: jest.fn().mockResolvedValue({ data: [], error: null }) }) });
    schema.mockReturnValue({ from: () => ({ update }) });

    await expect(reactivarEspacio('e1')).rejects.toThrow('No se pudo reactivar el espacio.');
    expect(update).toHaveBeenCalledWith({ estado: 'activo', motivo_estado: null });
  });

  it('quitar un recurso ya pedido en reservas sugiere dejarlo en 0 (INSOFT-30)', async () => {
    const select = jest.fn().mockResolvedValue({ data: null, error: { code: '23503', message: 'fk' } });
    schema.mockReturnValue({ from: () => ({ delete: () => ({ eq: () => ({ select }) }) }) });

    await expect(eliminarItem('i1')).rejects.toThrow(/deja su cantidad en 0/);
  });

  it('cambiar la cantidad de un recurso devuelve el recurso actualizado', async () => {
    const update = jest.fn().mockReturnValue({
      eq: () => ({ select: jest.fn().mockResolvedValue({ data: [{ id: 'i1', nombre: 'Silla', cantidad: 5 }], error: null }) }),
    });
    schema.mockReturnValue({ from: () => ({ update }) });

    await expect(cambiarCantidad('i1', 5)).resolves.toEqual({ id: 'i1', nombre: 'Silla', cantidad: 5 });
    expect(update).toHaveBeenCalledWith({ cantidad: 5 });
  });
});
