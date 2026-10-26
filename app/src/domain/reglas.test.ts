import { bandejaDestino, puedeCancelar, validarSolicitud } from './reglas';

// Fecha fija para que las pruebas no dependan del día en que se corren.
const AHORA = new Date('2026-10-20T08:00:00');
const horas = (h: number) => new Date(AHORA.getTime() + h * 60 * 60 * 1000);

const solicitud = {
  espacioId: 'auditorio-1',
  inicio: horas(24),
  fin: horas(26),
  motivoUso: 'Clase de Ingeniería de Software II',
};

describe('Reglas de negocio', () => {
  it('1. rechaza una reserva de más de 2 horas (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, fin: horas(26.5) }, AHORA);
    expect(errores).toContain('El límite máximo por evento es de 2 horas.');
  });

  it('2. rechaza reservar con más de 15 días de anticipación (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, inicio: horas(16 * 24), fin: horas(16 * 24 + 1) }, AHORA);
    expect(errores).toContain('Solo se puede reservar con máximo 15 días de anticipación.');
  });

  it('3. no deja cancelar con menos de 24 horas de anticipación (RN06)', () => {
    expect(puedeCancelar(horas(23.9), AHORA)).toBe(false);
  });

  it('4. un correo externo va a la bandeja de Coordinación (RN05)', () => {
    expect(bandejaDestino('auditorio', 'visitante@gmail.com')).toBe('coordinador');
  });
});
