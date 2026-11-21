// Pruebas de las reglas del catálogo de espacios (INSOFT-28 y HU02 / INSOFT-29).
import { filtrarEspacios, mismoNombre, validarEspacio, validarItem, validarMotivo } from './espacios.reglas';

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

describe('Recursos y calendario (INSOFT-30 y 32)', () => {
  it('un recurso necesita nombre y una cantidad de 1 o más', () => {
    expect(validarItem('', '2')).toBe('Escribe el nombre del recurso.');
    expect(validarItem('Micrófono', '0')).toMatch(/1 o más/);
    expect(validarItem('Micrófono', 'dos')).toMatch(/1 o más/);
    expect(validarItem('Micrófono', '4')).toBeNull();
  });

  it('filtra por tipo y capacidad mínima', () => {
    const espacios = [
      { id: 'a', tipo: 'auditorio', capacidad_max: 200 },
      { id: 'b', tipo: 'sala_computo', capacidad_max: 30 },
      { id: 'c', tipo: 'sala_computo', capacidad_max: 20 },
    ];
    expect(filtrarEspacios(espacios, { tipo: 'sala_computo', capacidad: '' }).map((e) => e.id)).toEqual(['b', 'c']);
    expect(filtrarEspacios(espacios, { tipo: null, capacidad: '25' }).map((e) => e.id)).toEqual(['a', 'b']);
    expect(filtrarEspacios(espacios, { tipo: null, capacidad: 'abc' })).toHaveLength(3);
  });
});
