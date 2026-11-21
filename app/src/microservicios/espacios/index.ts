// Lo que el microservicio de espacios ofrece a los demás. Otros microservicios solo importan desde aquí.
export type { DatosEspacio, Espacio, EstadoEspacio, Item, TipoEspacio } from './espacios.tipos';
export { itemsDelEspacio } from './espacios.api';
export { NOMBRE_ESTADO, NOMBRE_TIPO } from './espacios.tipos';
