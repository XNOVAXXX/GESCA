// Pruebas de las reglas del catálogo de espacios (INSOFT-28 y HU02 / INSOFT-29).
import { mismoNombre, validarEspacio, validarMotivo } from './espacios.reglas';

describe('Gestión de espacios', () => {
  it('pide nombre y una capacidad máxima entera mayor que 0 (INSOFT-28)', () => {
    expect(validarEspacio('', '30')).toBe('Escribe el nombre del espacio.');
    expect(validarEspacio('Auditorio', '0')).toMatch(/mayor que 0/);
    expect(validarEspacio('Auditorio', '12.5')).toMatch(/mayor que 0/);
    expect(validarEspacio('Auditorio', '120')).toBeNull();
  });

  it('no deja poner un espacio en mantenimiento sin motivo (HU02)', () => {
    expect(validarMotivo('   ')).toMatch(/motivo/);
    expect(validarMotivo('Cambio de sillas')).toBeNull();
  });

  it('considera repetido un nombre que solo cambia en mayúsculas o espacios', () => {
    expect(mismoNombre(' auditorio principal ', 'Auditorio Principal')).toBe(true);
    expect(mismoNombre('Sala 101', 'Sala 102')).toBe(false);
  });
});
