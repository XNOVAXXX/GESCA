// Servicio que usa la pantalla "Solicitar reserva", con Supabase simulado.
import { FunctionsHttpError } from '@supabase/supabase-js';
import { radicarSolicitud } from './reservas.service';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));

const invoke = supabase.functions.invoke as jest.Mock;

describe('Solicitar reserva (HU01)', () => {
  it('3. un cruce de horario muestra un mensaje claro (RN01)', async () => {
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
