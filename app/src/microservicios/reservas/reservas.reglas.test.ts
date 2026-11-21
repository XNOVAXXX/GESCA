// Reglas que usa la pantalla "Solicitar reserva".
import { diasReservables, puedeCancelar, validarJustificacion, validarSolicitud } from './reservas.reglas';

// Fecha fija para que las pruebas no dependan del día en que se corren.
const AHORA = new Date('2026-10-20T08:00:00');
const horas = (h: number) => new Date(AHORA.getTime() + h * 60 * 60 * 1000);

const solicitud = {
  espacioId: 'auditorio-1',
  inicio: horas(24),
  fin: horas(26),
  motivoUso: 'Clase de Ingeniería de Software II',
};

describe('Solicitar reserva (HU01)', () => {
  it('3. rechaza una reserva de más de 2 horas (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, fin: horas(26.5) }, AHORA);
    expect(errores).toContain('El límite máximo por evento es de 2 horas.');
  });

  it('4. rechaza reservar con más de 15 días de anticipación (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, inicio: horas(16 * 24), fin: horas(16 * 24 + 1) }, AHORA);
    expect(errores).toContain('Solo se puede reservar con máximo 15 días de anticipación.');
  });
});
describe('Cancelar una reserva (INSOFT-33)', () => {
  it('permite cancelar con 24 horas o más de anticipación (RN06)', () => {
    expect(puedeCancelar({ estado: 'aprobada', inicio: horas(24) }, AHORA)).toBe(true);
    expect(puedeCancelar({ estado: 'pendiente', inicio: horas(48) }, AHORA)).toBe(true);
  });

  it('no permite cancelar con menos de 24 horas ni una reserva ya cerrada', () => {
    expect(puedeCancelar({ estado: 'aprobada', inicio: horas(23) }, AHORA)).toBe(false);
    expect(puedeCancelar({ estado: 'rechazada', inicio: horas(48) }, AHORA)).toBe(false);
    expect(puedeCancelar({ estado: 'cancelada', inicio: horas(48) }, AHORA)).toBe(false);
  });

  it('exige justificación para cancelar o rechazar (RN04)', () => {
    expect(validarJustificacion('   ')).toBe('Escribe la justificación.');
    expect(validarJustificacion('Se aplazó el evento')).toBeNull();
  });
});

describe('Días reservables (RN06)', () => {
  it('ofrece desde hoy hasta 15 días después', () => {
    const dias = diasReservables(AHORA);
    expect(dias).toHaveLength(16);
    expect(dias[0].getDate()).toBe(20);
    expect(dias[15].getMonth()).toBe(10); // 4 de noviembre
    expect(dias[15].getDate()).toBe(4);
  });
});
