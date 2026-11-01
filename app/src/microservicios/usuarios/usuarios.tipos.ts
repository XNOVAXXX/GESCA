export type Rol = 'admin' | 'coordinador' | 'solicitante';

export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}
