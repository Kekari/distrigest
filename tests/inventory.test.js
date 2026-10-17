import test from 'node:test';
import assert from 'node:assert/strict';
let inventory={};
try {inventory=await import('../inventory.js');}catch{}
const today='2026-10-17';
const stock=[
  {id:'expired',product:'Queso',sku:'Q',lot:'Q1',location:'Angol',expiry:'2026-10-15',quantity:18,minimum:30},
  {id:'lowOnly',product:'Aceite',sku:'A',lot:'A1',location:'Angol',expiry:'2027-06-15',quantity:24,minimum:60},
  {id:'both',product:'Leche',sku:'L',lot:'L1',location:'Temuco',expiry:'2026-10-28',quantity:85,minimum:100},
  {id:'soon',product:'Yogur',sku:'Y',lot:'Y1',location:'Temuco',expiry:'2026-10-23',quantity:156,minimum:50},
];
test('vencimientos excluye stock bajo sin riesgo de fecha y ordena por vencer antes de vencidos',()=>{
  assert.equal(typeof inventory.inventoryItems,'function');
  assert.deepEqual(inventory.inventoryItems(stock,{tab:'expiry'},today).map(s=>s.id),['soon','both','expired']);
  assert.equal(stock[0].id,'expired','no modifica el orden de los datos originales');
});
test('un lote próximo a vencer y bajo stock muestra Por vencer en la pestaña de vencimientos',()=>{
  assert.equal(typeof inventory.inventoryState,'function');
  assert.deepEqual(inventory.inventoryState(stock[2],'expiry',today),{label:'Por vencer',color:'amber'});
  assert.deepEqual(inventory.inventoryState(stock[0],'expiry',today),{label:'Vencido',color:'red'});
  assert.equal(inventory.inventoryState(stock[2],'low',today).label,'Stock bajo');
});
test('vencimientos mantiene filtros de búsqueda y bodega',()=>{
  assert.equal(typeof inventory.inventoryItems,'function');
  assert.deepEqual(inventory.inventoryItems(stock,{tab:'expiry',warehouse:'Temuco',query:'leche'},today).map(s=>s.id),['both']);
  assert.deepEqual(inventory.inventoryItems(stock,{tab:'expiry',warehouse:'Angol'},today).map(s=>s.id),['expired']);
});
