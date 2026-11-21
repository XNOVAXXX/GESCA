// Lo que el microservicio de reservas ofrece a los demás. Otros microservicios solo importan desde aquí.
export type { Bandeja, EstadoReserva, Franja, Reserva, SolicitudPendiente, SolicitudReserva } from './reservas.tipos';
export { NOMBRE_BANDEJA, NOMBRE_ESTADO_RESERVA } from './reservas.tipos';
// El calendario de disponibilidad (microservicio de espacios) usa la ocupación pública y su aviso en tiempo real.
export { escucharOcupacion, ocupacionEntre } from './reservas.api';
export { claveDia, diaCorto, hora } from './reservas.formato';
export { diasReservables } from './reservas.reglas';
