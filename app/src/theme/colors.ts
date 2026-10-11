// Paleta institucional de la I.U. Pascual Bravo (RNF05).
const institucional = {
  blanco: '#FFFFFF',
  negro: '#000000',
  gris: '#666666',
  azul: '#1E87F0',
  azulNoche: '#001B33',
  celeste: '#3FB8FD',
} as const;

export const colors = {
  primario: institucional.azul,
  primarioOscuro: institucional.azulNoche,
  acento: institucional.celeste,
  fondo: institucional.blanco,
  superficie: institucional.blanco,
  texto: institucional.negro,
  textoSuave: institucional.gris,
  borde: '#66666633', // gris institucional al 20 %
  // Colores de estado (no hacen parte de la paleta; solo para mensajes de éxito, alerta y error).
  exito: '#2E7D32',
  advertencia: '#B26A00',
  error: '#C62828',
} as const;
