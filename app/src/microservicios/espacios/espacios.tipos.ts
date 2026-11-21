export type TipoEspacio = 'auditorio' | 'sala_computo' | 'cancha' | 'laboratorio' | 'espacio_compartido';

export type EstadoEspacio = 'activo' | 'mantenimiento';

export interface Espacio {
  id: string;
  nombre: string;
  tipo: TipoEspacio;
  capacidad_max: number;
  estado: EstadoEspacio;
  motivo_estado?: string | null;
  items?: Item[];
}

// Recurso o mobiliario de un espacio: micrófonos, sillas, computadores (INSOFT-30).
export interface Item {
  id: string;
  nombre: string;
  cantidad: number;
}

// Datos que el administrador escribe para crear o editar un espacio (INSOFT-28).
export interface DatosEspacio {
  nombre: string;
  tipo: TipoEspacio;
  capacidad_max: number;
}

export const NOMBRE_TIPO: Record<TipoEspacio, string> = {
  auditorio: 'Auditorio',
  sala_computo: 'Sala de cómputo',
  cancha: 'Cancha',
  laboratorio: 'Laboratorio',
  espacio_compartido: 'Espacio compartido',
};

export const NOMBRE_ESTADO: Record<EstadoEspacio, string> = {
  activo: 'Activo',
  mantenimiento: 'En mantenimiento',
};
