export type TipoEspacio = 'auditorio' | 'sala_computo' | 'cancha' | 'laboratorio' | 'espacio_compartido';

export type EstadoEspacio = 'activo' | 'mantenimiento';

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  capacidad_max: number;
  estado: EstadoEspacio;
}
