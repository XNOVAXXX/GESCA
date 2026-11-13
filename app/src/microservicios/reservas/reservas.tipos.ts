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
