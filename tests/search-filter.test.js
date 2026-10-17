// Pruebas automáticas: verifican los resultados esperados de este módulo.
import test from 'node:test';
import assert from 'node:assert/strict';
let search = {};
try {
  search = await import('../js/logica/busquedas.js');
} catch {}
const choices = [
  { value: 'c1', label: 'Almacén Don Pedro' },
  { value: 'c2', label: 'Minimarket El Roble' },
  { value: 'c3', label: 'Restaurante La Araucana' }
];
test('la búsqueda encuentra fragmentos del nombre ignorando tildes y mayúsculas', () => {
  assert.equal(typeof search.matchingChoices, 'function');
  assert.deepEqual(search.matchingChoices(choices, '  ALMACEN  '), [choices[0]]);
  assert.deepEqual(search.matchingChoices(choices, 'roble'), [choices[1]]);
});
test('sin texto conserva la lista completa y sin coincidencias devuelve una lista vacía', () => {
  assert.equal(typeof search.matchingChoices, 'function');
  assert.deepEqual(search.matchingChoices(choices, ''), choices);
  assert.deepEqual(search.matchingChoices(choices, 'sin coincidencias'), []);
});
