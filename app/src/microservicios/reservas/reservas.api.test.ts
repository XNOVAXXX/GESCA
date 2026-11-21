// Servicio que usa la pantalla "Solicitar reserva", con Supabase simulado.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { aprobar, cancelar, misReservas, ocupacionDelDia, radicarSolicitud, rechazar } from './reservas.api';
import { supabase } from '@/compartido/supabase';

jest.mock('@/compartido/supabase', () => ({ supabase: { functions: { invoke: jest.fn() }, schema: jest.fn() } }));

const invoke = supabase.functions.invoke as jest.Mock;
const schema = supabase.schema as unknown as jest.Mock;

// Simula supabase.schema('reservas').from(...).update(...).eq(...).select(...) y .rpc(...).
function simularBD(resultado: { data: unknown; error: unknown }) {
  const consulta = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(resultado),
  };
  const rpc = jest.fn().mockResolvedValue(resultado);
  schema.mockReturnValue({ from: jest.fn().mockReturnValue(consulta), rpc });
  return { consulta, rpc };
}

describe('Solicitar reserva (HU01)', () => {
  it('5. un cruce de horario muestra un mensaje claro (RN01)', async () => {
    const respuesta = { json: async () => ({ error: 'El espacio ya está reservado en esa franja horaria.' }) };
    invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(respuesta) });

    await expect(
      radicarSolicitud({
        espacioId: 'auditorio-1',
        inicio: new Date('2026-10-21T08:00:00'),
        fin: new Date('2026-10-21T10:00:00'),
        motivoUso: 'Clase',
      }),
    ).rejects.toThrow('El espacio ya está reservado en esa franja horaria.');
  });
});
describe('Mis reservas y bandejas (INSOFT-32, 33, 40, 41)', () => {
  it('convierte las reservas de la base de datos en fechas', async () => {
    simularBD({
      data: [
        {
          id: 'r1',
          espacio_id: 'e1',
          espacio_nombre: 'Auditorio',
          inicio: '2026-11-24T13:00:00Z',
          fin: '2026-11-24T15:00:00Z',
          motivo_uso: 'Clase',
          estado: 'aprobada',
          bandeja: 'administrador',
          motivo_decision: null,
        },
      ],
      error: null,
    });
    const [r] = await misReservas();
    expect(r.espacioNombre).toBe('Auditorio');
    expect(r.inicio.toISOString()).toBe('2026-11-24T13:00:00.000Z');
    expect(r.estado).toBe('aprobada');
  });

  it('aprobar cambia el estado a aprobada', async () => {
    const { consulta } = simularBD({ data: [{ id: 'r1' }], error: null });
    await aprobar('r1');
    expect(consulta.update).toHaveBeenCalledWith({ estado: 'aprobada', motivo_decision: null });
    expect(consulta.eq).toHaveBeenCalledWith('id', 'r1');
  });

  it('rechazar envía la justificación sin espacios sobrantes', async () => {
    const { consulta } = simularBD({ data: [{ id: 'r1' }], error: null });
    await rechazar('r1', '  Evento institucional  ');
    expect(consulta.update).toHaveBeenCalledWith({ estado: 'rechazada', motivo_decision: 'Evento institucional' });
  });

  it('muestra el mensaje de la base de datos cuando faltan menos de 24 horas', async () => {
    simularBD({
      data: null,
      error: { code: 'P0001', message: 'Solo se puede cancelar con mínimo 24 horas de anticipación.' },
    });
    await expect(cancelar('r1', 'Ya no se necesita')).rejects.toThrow(
      'Solo se puede cancelar con mínimo 24 horas de anticipación.',
    );
  });

  it('avisa cuando la reserva no se pudo cambiar por permisos', async () => {
    simularBD({ data: [], error: null });
    await expect(aprobar('r1')).rejects.toThrow('No tienes permiso para cambiar esta reserva o ya no existe.');
  });

  it('la ocupación del día solo trae el espacio pedido, ordenada por hora', async () => {
    const { rpc } = simularBD({
      data: [
        { espacio_id: 'e1', inicio: '2026-11-24T18:00:00Z', fin: '2026-11-24T19:00:00Z', estado: 'pendiente' },
        { espacio_id: 'e2', inicio: '2026-11-24T14:00:00Z', fin: '2026-11-24T15:00:00Z', estado: 'aprobada' },
        { espacio_id: 'e1', inicio: '2026-11-24T13:00:00Z', fin: '2026-11-24T15:00:00Z', estado: 'aprobada' },
      ],
      error: null,
    });
    const franjas = await ocupacionDelDia('e1', new Date(2026, 10, 24));
    expect(rpc).toHaveBeenCalledWith('ocupacion', expect.objectContaining({ p_desde: expect.any(String) }));
    expect(franjas.map((f) => f.estado)).toEqual(['aprobada', 'pendiente']);
  });
});
