// Regla que usa la pantalla "Verificar correo".
import { esCorreoInstitucional } from './usuarios.reglas';

describe('Verificar correo (INSOFT-24)', () => {
  it('4. un correo externo se marca para aprobación de Coordinación (RN05)', () => {
    expect(esCorreoInstitucional('visitante@gmail.com')).toBe(false);
    expect(esCorreoInstitucional('ana@pascualbravo.edu.co')).toBe(true);
  });
});
