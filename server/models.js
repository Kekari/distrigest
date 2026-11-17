// Tablas con almacenamiento directo. Productos, lotes, inventario, órdenes y ventas
// se manejan con consultas que resuelven sus relaciones para la interfaz existente.
export const models = [
  {
    key: 'clients', table: 'clientes',
    fields: ['id','name','rut','giro','address','contact','email','phone','zone','seller','status']
  },
  {
    key: 'suppliers', table: 'proveedores',
    fields: ['id','name','rut','contact','email','phone','terms','delivery','status']
  },
  {
    key: 'documents', table: 'documentos',
    fields: ['id','type','client','date','lines','status','reference']
  },
  {
    key: 'receipts', table: 'recepciones',
    fields: ['order','product','sku','category','lot','expiry','location','received','expected','minimum','note','difference','date']
  }
];
