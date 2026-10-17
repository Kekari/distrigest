// Dibujos SVG utilizados en botones, menús e indicadores.
const icons = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  box: 'm21 8-9 5-9-5 M12 22V13 M3 8l9-5 9 5v10l-9 4-9-4z M7 5l10 5',
  truck:
    'M1 3h14v12H1z M15 8h4l3 4v3h-7 M8 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h6',
  chart: 'M3 3v18h18 M7 14v3 M12 10v7 M17 6v11',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6 M20 12h-5v5h5 M16 14.5h1',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  search: 'm21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  down: 'm6 9 6 6 6-6',
  calendar: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18',
  download: 'M12 3v12 m-5-5 5 5 5-5 M5 16v5h14v-5',
  alert: 'm12 3 10 18H2z M12 9v4 M12 17h.01',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12 M6 18 18 6',
  edit: 'm16 3 5 5-12 12-6 1 1-6z M14 5l5 5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  building: 'M4 21V3h12v18 M16 9h5v12 M8 7h4 M8 11h4 M8 15h4 M8 21v-3h4v3',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  logout: 'M9 3H3v18h6 M10 12h12 m-5-5 5 5-5 5'
};
export const icon = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.box}"/></svg>`;
