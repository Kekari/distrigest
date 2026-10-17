import test from 'node:test';
import assert from 'node:assert/strict';
let domain = {};
try { domain = await import('../domain.js'); } catch {}
test('recepción parcial aumenta solo las unidades recibidas y registra diferencia', () => {
  assert.equal(typeof domain.receiveStock, 'function');
  const result = domain.receiveStock([], { product:'Leche', lot:'L01', location:'Temuco · A1', expiry:'2026-11-20', expected:100, received:85, minimum:20 });
  assert.equal(result.stock[0].quantity,85);
  assert.equal(result.difference,-15);
});
test('recepción inválida no cambia el inventario', () => {
  assert.equal(typeof domain.receiveStock, 'function');
  assert.throws(()=>domain.receiveStock([], {received:-1,expected:10}), /cantidad/i);
});
test('comisión se calcula sobre venta neta efectivamente cobrada', () => {
  assert.equal(typeof domain.commission, 'function');
  assert.equal(domain.commission(1000000,0.5,3),15000);
});
test('documentos calculan IVA en pesos enteros', () => {
  assert.equal(typeof domain.totals, 'function');
  assert.deepEqual(domain.totals([{quantity:3,price:1234}]),{net:3702,tax:703,total:4405});
});
test('alertas distinguen vencidos y fechas próximas usando días calendario', () => {
  assert.equal(typeof domain.stockStatus, 'function');
  assert.equal(domain.stockStatus({quantity:100,minimum:20,expiry:'2026-10-16'},'2026-10-17').expiry,'Vencido');
  assert.equal(domain.stockStatus({quantity:10,minimum:20,expiry:'2026-11-01'},'2026-10-17').low,true);
});
test('un mismo lote no permite fechas de vencimiento contradictorias', () => {
  assert.throws(()=>domain.receiveStock([{product:'Leche',lot:'L01',location:'Temuco',expiry:'2026-11-20',quantity:10}],{product:'Leche',lot:'L01',location:'Angol',expiry:'2026-12-20',received:10,expected:10}),/vencimiento/i);
});
