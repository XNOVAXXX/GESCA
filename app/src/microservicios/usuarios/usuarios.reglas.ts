// Reglas de acceso que se validan en pantalla antes de llamar a Supabase Auth.

export const LONGITUD_CODIGO = 6; // RNF01: código de verificación enviado al correo
export const DOMINIO_INSTITUCIONAL = '@pascualbravo.edu.co'; // RN05

export function validarCorreo(correo: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) ? null : 'Escribe un correo válido.';
}

export function validarCodigo(codigo: string): string | null {
  return new RegExp(`^\\d{${LONGITUD_CODIGO}}$`).test(codigo.trim())
    ? null
    : `El código tiene ${LONGITUD_CODIGO} dígitos.`;
}

// RN05: los correos externos necesitan aprobación de Coordinación.
export function esCorreoInstitucional(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
}
