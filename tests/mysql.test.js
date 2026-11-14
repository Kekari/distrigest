import test from 'node:test';
import assert from 'node:assert/strict';
import { createPool } from '../server/connection.js';
import { createRepository } from '../server/repository.js';
import { createApp } from '../server/app.js';
import { receiveStock } from '../js/logica/calculos.js';

test(
  'MySQL real: API, recepción, documento, comisión, conflicto y rollback',
  { skip: process.env.MYSQL_TEST !== '1' },
  async (t) => {
    if (!process.env.DB_NAME?.endsWith('_pruebas'))
      throw new Error('Usa una base exclusiva cuyo nombre termine en _pruebas.');
    const pool = createPool();
    const repository = createRepository(pool);
    const original = await repository.read();
    t.after(async () => {
      try {
        const latest = await repository.read();
        await repository.write(original.state, latest.revision);
      } finally {
        await pool.end();
      }
    });
    const server = createApp(repository).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    t.after(
      () =>
        new Promise((resolve) => {
          server.close(resolve);
          server.closeAllConnections();
        })
    );
    const url = `http://127.0.0.1:${server.address().port}/api/state`;
    const current = await (await fetch(url)).json();
    const state = current.state;
    state.clients[0].name = 'Cliente persistido en MySQL';
    state.rate = 4;
    const order = state.orders[0];
    const entry = {
      order: order.id,
      product: order.product,
      sku: order.sku,
      category: order.category,
      lot: 'LOTE-' + crypto.randomUUID(),
      expiry: '2028-01-01',
      location: 'Temuco · A-01',
      received: 5,
      expected: order.quantity - order.received,
      minimum: 30,
      note: 'Prueba automatizada'
    };
    const result = receiveStock(state.stock, entry);
    state.stock = result.stock;
    order.received += 5;
    state.receipts.push({ ...entry, difference: result.difference, date: '2026-11-14' });
    state.documents.push({
      id: 'FACT-' + crypto.randomUUID(),
      type: 'Factura electrónica',
      client: state.clients[0].id,
      date: '2026-11-14',
      lines: [{ product: 'Producto ficticio', quantity: 2, price: 1000 }],
      status: 'Emitido · demo'
    });
    const write = (body) =>
      fetch(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-distrigest': '1' },
        body: JSON.stringify(body)
      });
    const response = await write(current);
    assert.equal(response.status, 200, await response.text());
    // Una conexión independiente comprueba que no se trata de datos en memoria.
    const secondPool = createPool();
    try {
      const persisted = await createRepository(secondPool).read();
      assert.equal(persisted.state.clients[0].name, 'Cliente persistido en MySQL');
      assert.equal(persisted.state.rate, 4);
      assert.equal(persisted.state.stock.find((x) => x.lot === entry.lot).quantity, 5);
      assert.equal(persisted.state.receipts.at(-1).received, 5);
      assert.equal(persisted.state.documents.at(-1).lines[0].price, 1000);
      assert.equal((await write(current)).status, 409);
      // Fuerza un error SQL después de eliminar filas: la transacción debe restaurarlas.
      const invalid = structuredClone(persisted.state);
      invalid.documents[0].reference = 'X'.repeat(200);
      await assert.rejects(repository.write(invalid, persisted.revision));
      assert.deepEqual(await repository.read(), persisted);
    } finally {
      await secondPool.end();
    }
  }
);
