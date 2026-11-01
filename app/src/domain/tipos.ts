export type TipoEspacio =
  | 'auditorio'
  | 'sala_computo'
  | 'cancha'
  | 'laboratorio'
  | 'espacio_compartido';

export type EstadoEspacio = 'activo' | 'mantenimiento';

export type EstadoReserva = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export type Bandeja = 'administrador' | 'coordinador';

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  capacidad_max: number;
  estado: EstadoEspacio;
}

export interface SolicitudReserva {
  espacioId: string;
  inicio: Date;
  fin: Date;
  motivoUso: string;
}
