import { createInitialData } from '../js/datos/datos-iniciales.js';

// Comprueba datos y relaciones antes de enviar cualquier cambio a MySQL.
export function validateState(state) {
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (!state || typeof state !== 'object') fail('Datos inválidos.');
  const keys = Object.keys(createInitialData()).filter((k) => k !== 'rate');
  const ids = {};
  for (const key of keys) {
    if (!Array.isArray(state[key]) || state[key].length > 10000) fail(`Lista inválida: ${key}.`);
    ids[key] = new Set();
    for (const row of state[key]) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) fail(`Registro inválido: ${key}.`);
      if (key !== 'receipts') {
        if (typeof row.id !== 'string' || !row.id || row.id.length > 100 || ids[key].has(row.id))
          fail(`Identificador inválido o repetido: ${key}.`);
        ids[key].add(row.id);
      }
      for (const value of Object.values(row))
        if (typeof value === 'string' && value.length > 2000) fail('Texto demasiado largo.');
    }
  }
  if (!Number.isFinite(state.rate) || state.rate < 0 || state.rate > 100)
    fail('La tasa debe estar entre 0 y 100 %.');
  const number = (n, min = 0) => {
    if (!Number.isSafeInteger(n) || n < min) fail('Cantidad o monto inválido.');
  };
  const required = (row, fields) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) fail('Registro inválido.');
    for (const f of fields)
      if (typeof row[f] !== 'string' || !row[f].trim()) fail(`Campo requerido: ${f}.`);
  };
  const date = (value) => {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value
    )
      fail('Fecha inválida.');
  };
  for (const key of ['clients', 'suppliers']) {
    const ruts = new Set();
    for (const row of state[key]) {
      required(row, ['name', 'rut', 'contact', 'email', 'status']);
      required(
        row,
        key === 'clients' ? ['giro', 'address', 'zone', 'seller'] : ['terms', 'delivery']
      );
      const rut = row.rut.replace(/[.\s-]/g, '').toUpperCase();
      if (ruts.has(rut)) fail('RUT repetido.');
      ruts.add(rut);
      if (!['Activo', 'Inactivo'].includes(row.status)) fail('Estado inválido.');
    }
  }
  const lots = new Map();
  for (const row of state.stock) {
    required(row, ['product', 'lot', 'location', 'sku', 'category']);
    number(row.quantity);
    number(row.minimum);
    date(row.expiry);
    const key = JSON.stringify([row.product, row.lot]);
    if (lots.has(key) && lots.get(key) !== row.expiry)
      fail('El lote tiene vencimientos contradictorios.');
    lots.set(key, row.expiry);
  }
  for (const row of state.orders) {
    required(row, ['product', 'sku', 'category']);
    if (!ids.suppliers.has(row.supplier)) fail('Proveedor inexistente.');
    number(row.quantity, 1);
    number(row.received);
    number(row.price, 1);
    if (row.received > row.quantity) fail('Recepción superior a la orden.');
  }
  for (const row of state.sales) {
    if (!ids.clients.has(row.client)) fail('Cliente inexistente.');
    required(row, ['seller', 'product']);
    date(row.date);
    number(row.quantity, 1);
    number(row.price, 1);
    if (!Number.isFinite(row.paid) || row.paid < 0 || row.paid > 1) fail('Cobranza inválida.');
  }
  for (const row of state.documents) {
    if (!ids.clients.has(row.client)) fail('Cliente inexistente.');
    date(row.date);
    required(row, ['status']);
    if (!['Factura electrónica', 'Guía de despacho', 'Nota de crédito'].includes(row.type))
      fail('Tipo inválido.');
    if (!Array.isArray(row.lines) || !row.lines.length || row.lines.length > 1000)
      fail('Detalle inválido.');
    for (const item of row.lines) {
      required(item, ['product']);
      number(item.quantity, 1);
      number(item.price, 1);
    }
    if (
      row.type === 'Nota de crédito' &&
      !state.documents.some(
        (d) => d.id === row.reference && d.type === 'Factura electrónica' && d.client === row.client
      )
    )
      fail('Referencia inválida.');
  }
  for (const row of state.receipts) {
    if (!ids.orders.has(row.order)) fail('Orden inexistente.');
    required(row, ['product', 'sku', 'category', 'lot', 'location']);
    date(row.expiry);
    date(row.date);
    number(row.received, 1);
    number(row.expected, 1);
    number(row.minimum);
    if (row.received > row.expected || row.difference !== row.received - row.expected)
      fail('Diferencia de recepción inválida.');
  }
  return state;
}
