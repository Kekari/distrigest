// Lista fija de tablas y columnas. Nunca se toman nombres SQL de la solicitud.
export const models = [
  {
    key: 'clients',
    table: 'clientes',
    fields: [
      'id',
      'name',
      'rut',
      'giro',
      'address',
      'contact',
      'email',
      'phone',
      'zone',
      'seller',
      'status'
    ]
  },
  {
    key: 'suppliers',
    table: 'proveedores',
    fields: ['id', 'name', 'rut', 'contact', 'email', 'phone', 'terms', 'delivery', 'status']
  },
  {
    key: 'stock',
    table: 'inventario',
    fields: ['id', 'sku', 'product', 'category', 'lot', 'expiry', 'location', 'quantity', 'minimum']
  },
  {
    key: 'orders',
    table: 'ordenes_compra',
    fields: ['id', 'supplier', 'product', 'sku', 'category', 'quantity', 'received', 'price']
  },
  {
    key: 'sales',
    table: 'ventas',
    fields: ['id', 'date', 'client', 'seller', 'product', 'quantity', 'price', 'paid']
  },
  {
    key: 'documents',
    table: 'documentos',
    fields: ['id', 'type', 'client', 'date', 'lines', 'status', 'reference']
  },
  {
    key: 'receipts',
    table: 'recepciones',
    fields: [
      'order',
      'product',
      'sku',
      'category',
      'lot',
      'expiry',
      'location',
      'received',
      'expected',
      'minimum',
      'note',
      'difference',
      'date'
    ]
  }
];
