export type Rol = 'admin' | 'coordinador' | 'solicitante';

export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}

export const AVISO_INACTIVIDAD = 'Tu sesión se cerró porque pasaron 15 minutos sin actividad.';

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: 'Administrador de Espacios',
  coordinador: 'Coordinación / Laboratorio',
  solicitante: 'Solicitante',
};
