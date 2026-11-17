import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidChileanPhone } from '../js/logica/validaciones.js';

test('acepta celulares y teléfonos fijos chilenos con formato nacional o +56', () => {
  for (const phone of [
    '+56 9 8765 4321',
    '987654321',
    '+56987654321',
    '+56 45 222 3040',
    '45 222 3040',
    '+56 2 2444 5060'
  ])
    assert.equal(isValidChileanPhone(phone), true, phone);
});
test('rechaza texto, dígitos insuficientes o excesivos y códigos internacionales ajenos', () => {
  for (const phone of [
    'letras',
    '123',
    '+1 987 654 3210',
    '9876543210',
    '987-abc-321',
    '+56 9 1234 567'
  ])
    assert.equal(isValidChileanPhone(phone), false, phone);
});
test('el teléfono es opcional; si se ingresa debe ser chileno y válido', () => {
  assert.equal(isValidChileanPhone(''), true);
  assert.equal(isValidChileanPhone('   '), true);
});
