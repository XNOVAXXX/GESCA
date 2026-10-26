// Reglas que usan las pantallas "Solicitar reserva" y "Verificar correo".
import { esCorreoInstitucional, validarSolicitud } from './reglas';

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
  it('1. rechaza una reserva de más de 2 horas (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, fin: horas(26.5) }, AHORA);
    expect(errores).toContain('El límite máximo por evento es de 2 horas.');
  });

  it('2. rechaza reservar con más de 15 días de anticipación (RN06)', () => {
    const errores = validarSolicitud({ ...solicitud, inicio: horas(16 * 24), fin: horas(16 * 24 + 1) }, AHORA);
    expect(errores).toContain('Solo se puede reservar con máximo 15 días de anticipación.');
  });
});

describe('Verificar correo (INSOFT-24)', () => {
  it('4. un correo externo se marca para aprobación de Coordinación (RN05)', () => {
    expect(esCorreoInstitucional('visitante@gmail.com')).toBe(false);
    expect(esCorreoInstitucional('ana@pascualbravo.edu.co')).toBe(true);
  });
});
