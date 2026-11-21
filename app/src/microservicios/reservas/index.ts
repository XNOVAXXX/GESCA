// Lo que el microservicio de reservas ofrece a los demás. Otros microservicios solo importan desde aquí.
export type { Bandeja, EstadoReserva, Reserva, SolicitudPendiente, SolicitudReserva } from './reservas.tipos';
export { NOMBRE_BANDEJA, NOMBRE_ESTADO_RESERVA } from './reservas.tipos';
