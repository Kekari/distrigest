// Operaciones sencillas con fechas para el calendario.

// Nombres de los meses que utiliza el calendario.
export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

// Convierte una fecha al formato año-mes-día usado para guardar datos.
export const isoDate = (d) => d.toISOString().slice(0, 10);

// Suma días a una fecha, incluso cuando cambia el mes o el año.
export function addDays(value, days) {
  const d = new Date(value + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

// Prepara los días de un mes y los espacios para comenzar la semana en lunes.
export function monthDays(year, month) {
  const start = new Date(Date.UTC(year, month, 1, 12));
  const offset = (start.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  return [
    ...Array(offset).fill(null),
    ...Array.from({ length }, (_, i) => isoDate(new Date(Date.UTC(year, month, i + 1, 12))))
  ];
}

// Indica si una fecha cumple con el mínimo permitido.
export const isSelectable = (value, min = '') => !min || value >= min;
