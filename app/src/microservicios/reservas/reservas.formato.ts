// Cómo se muestran fechas y horas de las reservas (hora local del dispositivo).
const dos = (n: number) => String(n).padStart(2, '0');

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "08:00"
export const hora = (d: Date) => `${dos(d.getHours())}:${dos(d.getMinutes())}`;

// "lun 24 nov"
export const diaCorto = (d: Date) => `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;

// "lun 24 nov 2026, 08:00 a 10:00"
export const franja = (inicio: Date, fin: Date) =>
  `${diaCorto(inicio)} ${inicio.getFullYear()}, ${hora(inicio)} a ${hora(fin)}`;

// "2026-11-24", para comparar días sin depender de la hora.
export const claveDia = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
