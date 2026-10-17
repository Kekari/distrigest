import test from 'node:test';
import assert from 'node:assert/strict';
let calendar={};
try {calendar=await import('../calendar-dates.mjs');}catch{}
test('febrero bisiesto ofrece 29 días con semana iniciando en lunes',()=>{
  assert.equal(typeof calendar.monthDays,'function');
  const days=calendar.monthDays(2028,1);
  assert.equal(days.filter(Boolean).length,29);
  assert.equal(days[1],'2028-02-01');
});
test('avanzar fechas cruza meses y años sin cambiar el día por zona horaria',()=>{
  assert.equal(typeof calendar.addDays,'function');
  assert.equal(calendar.addDays('2026-12-31',30),'2027-01-30');
});
test('los días anteriores al mínimo permanecen fuera de selección',()=>{
  assert.equal(typeof calendar.isSelectable,'function');
  assert.equal(calendar.isSelectable('2026-10-16','2026-10-17'),false);
  assert.equal(calendar.isSelectable('2026-10-17','2026-10-17'),true);
});
