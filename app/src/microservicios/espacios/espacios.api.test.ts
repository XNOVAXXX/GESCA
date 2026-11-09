// Pruebas del microservicio de espacios con Supabase simulado (no se conecta a internet).
import { crearEspacio, reactivarEspacio } from './espacios.api';
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
});
