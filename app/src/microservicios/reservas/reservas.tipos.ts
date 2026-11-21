export type EstadoReserva = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

// RN05: quién aprueba la solicitud.
export type Bandeja = 'administrador' | 'coordinador';

export interface SolicitudReserva {
  espacioId: string;
  inicio: Date;
  fin: Date;
  motivoUso: string;
}

export interface ResultadoRadicacion {
  id: string;
  estado: EstadoReserva;
  bandeja: Bandeja;
}

// Una reserva del usuario de la sesión (INSOFT-32).
export interface Reserva {
  id: string;
  espacioId: string;
  espacioNombre: string;
  inicio: Date;
  fin: Date;
  motivoUso: string;
  estado: EstadoReserva;
  bandeja: Bandeja;
  motivoDecision: string | null;
}

// Una solicitud que espera decisión en la bandeja del Administrador o del Coordinador (INSOFT-40/41).
export interface SolicitudPendiente {
  id: string;
  espacioNombre: string;
  espacioEnMantenimiento: boolean;
  inicio: Date;
  fin: Date;
  motivoUso: string;
  responsableNombre: string;
  responsableCorreo: string;
  bandeja: Bandeja;
}

// Franja ocupada de un espacio, sin datos personales (RF02).
export interface Franja {
  inicio: Date;
  fin: Date;
  estado: EstadoReserva;
}

export type Decision = 'aprobada' | 'rechazada' | 'cancelada';

export const NOMBRE_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export const NOMBRE_BANDEJA: Record<Bandeja, string> = {
  administrador: 'Administración',
  coordinador: 'Coordinación',
};
