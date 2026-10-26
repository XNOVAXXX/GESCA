import {
  bandejaDestino,
  esCorreoInstitucional,
  puedeCancelar,
  validarCodigo,
  validarCorreo,
  validarSolicitud,
} from './reglas';

// Fecha fija para que las pruebas no dependan del día en que se corren.
const AHORA = new Date('2026-10-20T08:00:00');
const horas = (h: number) => new Date(AHORA.getTime() + h * 60 * 60 * 1000);

const solicitudValida = {
  espacioId: 'auditorio-1',
  inicio: horas(24),
  fin: horas(26),
  motivoUso: 'Clase de Ingeniería de Software II',
};

describe('validarSolicitud (HU01, RN06)', () => {
  it('acepta una solicitud dentro de 15 días, de 2 horas y con motivo', () => {
    expect(validarSolicitud(solicitudValida, AHORA)).toEqual([]);
  });

  it('rechaza más de 2 horas continuas (HU01 escenario 2)', () => {
    const errores = validarSolicitud({ ...solicitudValida, fin: horas(26.5) }, AHORA);
    expect(errores).toContain('El límite máximo por evento es de 2 horas.');
  });

  it('acepta exactamente 2 horas', () => {
    expect(validarSolicitud({ ...solicitudValida, fin: horas(26) }, AHORA)).toEqual([]);
  });

  it('rechaza una hora de fin anterior o igual a la de inicio', () => {
    const errores = validarSolicitud({ ...solicitudValida, fin: horas(24) }, AHORA);
    expect(errores).toContain('La hora de fin debe ser posterior a la de inicio.');
  });

  it('rechaza reservas en el pasado', () => {
    const errores = validarSolicitud({ ...solicitudValida, inicio: horas(-1), fin: horas(1) }, AHORA);
    expect(errores).toContain('La reserva debe ser en el futuro.');
  });

  it('rechaza reservas con más de 15 días de anticipación', () => {
    const errores = validarSolicitud({ ...solicitudValida, inicio: horas(16 * 24), fin: horas(16 * 24 + 1) }, AHORA);
    expect(errores).toContain('Solo se puede reservar con máximo 15 días de anticipación.');
  });

  it('exige el motivo de uso y el espacio', () => {
    const errores = validarSolicitud({ ...solicitudValida, espacioId: '', motivoUso: '   ' }, AHORA);
    expect(errores).toEqual(expect.arrayContaining(['Selecciona un espacio.', 'Indica el motivo de uso.']));
  });
});

describe('puedeCancelar (RN06: mínimo 24 horas antes)', () => {
  it('permite cancelar con 24 horas o más', () => {
    expect(puedeCancelar(horas(24), AHORA)).toBe(true);
    expect(puedeCancelar(horas(48), AHORA)).toBe(true);
  });

  it('no permite cancelar con menos de 24 horas', () => {
    expect(puedeCancelar(horas(23.9), AHORA)).toBe(false);
  });
});

describe('bandejaDestino (RN05)', () => {
  it('un espacio estándar con correo institucional va al Administrador', () => {
    expect(bandejaDestino('auditorio', 'ana@pascualbravo.edu.co')).toBe('administrador');
  });

  it('laboratorios y espacios compartidos van al Coordinador', () => {
    expect(bandejaDestino('laboratorio', 'ana@pascualbravo.edu.co')).toBe('coordinador');
    expect(bandejaDestino('espacio_compartido', 'ana@pascualbravo.edu.co')).toBe('coordinador');
  });

  it('un correo externo va al Coordinador aunque el espacio sea estándar', () => {
    expect(bandejaDestino('cancha', 'ana@gmail.com')).toBe('coordinador');
  });

  it('no se deja engañar por mayúsculas ni espacios', () => {
    expect(bandejaDestino('auditorio', '  ANA@PascualBravo.edu.co ')).toBe('administrador');
  });
});

describe('validarCorreo', () => {
  it.each(['ana@pascualbravo.edu.co', 'visitante@gmail.com'])('acepta %s', (correo) => {
    expect(validarCorreo(correo)).toBeNull();
  });

  it.each(['', 'ana', 'ana@', 'ana@dominio', 'ana perez@gmail.com'])('rechaza "%s"', (correo) => {
    expect(validarCorreo(correo)).toBe('Escribe un correo válido.');
  });
});

describe('validarCodigo (código de 6 dígitos)', () => {
  it('acepta 6 dígitos', () => {
    expect(validarCodigo('123456')).toBeNull();
    expect(validarCodigo(' 123456 ')).toBeNull();
  });

  it.each(['12345', '1234567', '12a456', ''])('rechaza "%s"', (codigo) => {
    expect(validarCodigo(codigo)).toBe('El código tiene 6 dígitos.');
  });
});

describe('esCorreoInstitucional', () => {
  it('reconoce el dominio de la institución', () => {
    expect(esCorreoInstitucional('juan@pascualbravo.edu.co')).toBe(true);
    expect(esCorreoInstitucional('juan@gmail.com')).toBe(false);
    expect(esCorreoInstitucional('juan@pascualbravo.edu.co.falso.com')).toBe(false);
  });
});
