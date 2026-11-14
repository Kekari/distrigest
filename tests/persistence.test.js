import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../js/datos/persistencia.js';

test('modo MySQL carga la API y espera confirmación antes de actualizar la revisión', async () => {
  let calls = [];
  const storage = createStorage({
    api: '/api',
    request: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => (options ? { revision: 3 } : { state: { rate: 3 }, revision: 2 })
      };
    }
  });
  assert.deepEqual(await storage.load(), { rate: 3 });
  await storage.save({ rate: 5 });
  assert.equal(JSON.parse(calls[1].options.body).revision, 2);
  assert.equal(calls[1].options.headers['x-distrigest'], '1');
  await storage.save({ rate: 6 });
  assert.equal(JSON.parse(calls[2].options.body).revision, 3);
});
test('un fallo de MySQL no se convierte en almacenamiento local ni en éxito', async () => {
  const storage = createStorage({
    api: '/api',
    request: async () => ({ ok: false, json: async () => ({ error: 'No se pudo guardar.' }) }),
    local: {
      getItem() {
        throw new Error('No debe leer localStorage');
      }
    }
  });
  await assert.rejects(storage.load(), /No se pudo guardar/);
  await assert.rejects(storage.save({ rate: 3 }), /No se pudo guardar/);
});
test('modo estático mantiene los datos del navegador', async () => {
  const values = new Map();
  const storage = createStorage({
    local: { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) }
  });
  assert.equal(await storage.load(), null);
  await storage.save({ rate: 8 });
  assert.deepEqual(await storage.load(), { rate: 8 });
});
