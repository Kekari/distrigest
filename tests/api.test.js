import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { validateState } from '../server/validation.js';
import { createInitialData } from '../js/datos/datos-iniciales.js';

async function fixture(t) {
  let current = { state: createInitialData(), revision: 1 };
  const repository = {
    async read() {
      return structuredClone(current);
    },
    async write(state, revision) {
      if (revision !== current.revision)
        throw Object.assign(new Error('Datos modificados. Recarga la página.'), { status: 409 });
      current = { state: structuredClone(state), revision: revision + 1 };
      return current.revision;
    }
  };
  const server = createApp(repository).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      })
  );
  return { url: `http://127.0.0.1:${server.address().port}`, repository };
}

test('API conserva un cambio y rechaza escrituras de una revisión antigua', async (t) => {
  const { url } = await fixture(t);
  const original = await (await fetch(url + '/api/state')).json();
  original.state.clients[0].name = 'Cliente de prueba';
  const write = (body) =>
    fetch(url + '/api/state', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-distrigest': '1' },
      body: JSON.stringify(body)
    });
  assert.equal((await write(original)).status, 200);
  assert.equal(
    (await (await fetch(url + '/api/state')).json()).state.clients[0].name,
    'Cliente de prueba'
  );
  assert.equal((await write(original)).status, 409);
});

test('API rechaza datos inválidos y solicitudes de otro origen', async (t) => {
  const { url } = await fixture(t);
  const body = await (await fetch(url + '/api/state')).json();
  const headers = { 'content-type': 'application/json', 'x-distrigest': '1' };
  body.state.stock[0].quantity = -1;
  assert.equal(
    (await fetch(url + '/api/state', { method: 'PUT', headers, body: JSON.stringify(body) }))
      .status,
    400
  );
  assert.equal(
    (
      await fetch(url + '/api/state', {
        method: 'PUT',
        headers: { ...headers, origin: 'https://example.org' },
        body: JSON.stringify(body)
      })
    ).status,
    403
  );
  assert.equal(
    (
      await fetch(url + '/api/state', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
    ).status,
    403
  );
});

test('no publica archivos privados y muestra fallos de base sin filtrar credenciales', async (t) => {
  const { url, repository } = await fixture(t);
  assert.equal((await fetch(url + '/server/index.js')).status, 404);
  assert.equal((await fetch(url + '/.env')).status, 404);
  assert.equal((await fetch(url + '/database/schema.sql')).status, 404);
  assert.match(await (await fetch(url + '/config.js')).text(), /\/api/);
  repository.read = async () => {
    throw new Error('password=privado');
  };
  const response = await fetch(url + '/api/state');
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /privado/);
});

test('validación rechaza relaciones rotas, lotes contradictorios y tasas fuera de rango', () => {
  assert.doesNotThrow(() => validateState(createInitialData()));
  for (const change of [
    (s) => (s.rate = 101),
    (s) => (s.sales[0].client = 'NO-EXISTE'),
    (s) => s.clients.push({ ...s.clients[0] }),
    (s) => s.stock.push({ ...s.stock[0], id: 'otro', expiry: '2027-01-01' }),
    (s) => (s.documents[0].lines[0].price = -5),
    (s) => (s.documents[0].lines = [null])
  ]) {
    const state = createInitialData();
    change(state);
    assert.throws(() => validateState(state));
  }
});

test('la API rechaza teléfonos inválidos de clientes y proveedores y acepta números chilenos', () => {
  for (const phone of ['12345', 'texto', '+1 987 654 3210', '9876543210']) {
    for (const entity of ['clients', 'suppliers']) {
      const state = createInitialData();
      state[entity][0].phone = phone;
      assert.throws(() => validateState(state), /teléfono/i, `${entity}: ${phone}`);
    }
  }
  for (const phone of ['+56 9 8765 4321', '+56 45 222 3040', '987654321']) {
    for (const entity of ['clients', 'suppliers']) {
      const state = createInitialData();
      state[entity][0].phone = phone;
      assert.doesNotThrow(() => validateState(state), `${entity}: ${phone}`);
    }
  }
});

test('la API no permite omitir el teléfono en un objeto alterado', () => {
  const state = createInitialData();
  delete state.clients[0].phone;
  assert.throws(() => validateState(state), /teléfono/i);
});
