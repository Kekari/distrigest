// Datos ficticios que se cargan al abrir el prototipo por primera vez.
// También se usan cuando se pulsa Restaurar datos de demostración.
export const createInitialData = () => ({
  // Clientes que se utilizan para probar registros y ventas.
  clients: [
    {
      id: 'CL-001',
      name: 'Almacén Don Pedro',
      rut: '76.123.456-0',
      giro: 'Almacén y abarrotes',
      address: 'Av. Alemania 0840, Temuco',
      contact: 'Pedro Muñoz',
      email: 'pedro@example.cl',
      phone: '+56 9 8765 4321',
      zone: 'Temuco',
      seller: 'Carolina Muñoz',
      status: 'Activo'
    },
    {
      id: 'CL-002',
      name: 'Minimarket El Roble',
      rut: '77.234.567-4',
      giro: 'Minimercado',
      address: 'O’Higgins 420, Angol',
      contact: 'María Soto',
      email: 'maria@example.cl',
      phone: '+56 9 7654 3210',
      zone: 'Angol',
      seller: 'Felipe Rojas',
      status: 'Activo'
    },
    {
      id: 'CL-003',
      name: 'Restaurante La Araucana',
      rut: '76.345.678-1',
      giro: 'Restaurante',
      address: 'Manuel Montt 782, Temuco',
      contact: 'Javiera Vidal',
      email: 'javiera@example.cl',
      phone: '+56 9 6543 2109',
      zone: 'Temuco',
      seller: 'Carolina Muñoz',
      status: 'Activo'
    },
    {
      id: 'CL-004',
      name: 'Comercial Los Copihues',
      rut: '77.456.789-5',
      giro: 'Venta de abarrotes',
      address: 'Balmaceda 180, Villarrica',
      contact: 'Andrés Pérez',
      email: 'andres@example.cl',
      phone: '+56 9 5432 1098',
      zone: 'Villarrica',
      seller: 'Diego Fuentes',
      status: 'Activo'
    },
    {
      id: 'CL-005',
      name: 'Botillería La Estación',
      rut: '76.567.890-0',
      giro: 'Botillería',
      address: 'Arturo Prat 665, Lautaro',
      contact: 'Valentina Díaz',
      email: 'vale@example.cl',
      phone: '+56 9 4321 0987',
      zone: 'Lautaro',
      seller: 'Felipe Rojas',
      status: 'Inactivo'
    },
    {
      id: 'CL-006',
      name: 'Casino Sabores del Sur',
      rut: '77.678.901-1',
      giro: 'Servicios de alimentación',
      address: 'Av. República 120, Angol',
      contact: 'Paula Castro',
      email: 'paula@example.cl',
      phone: '+56 9 3210 9876',
      zone: 'Angol',
      seller: 'Diego Fuentes',
      status: 'Activo'
    }
  ],
  // Proveedores con sus datos de contacto y condiciones comerciales.
  suppliers: [
    {
      id: 'PR-001',
      name: 'Lácteos del Sur SpA',
      rut: '76.111.222-8',
      contact: 'Daniela Torres',
      email: 'ventas@example.cl',
      phone: '+56 45 222 3040',
      terms: 'Crédito a 30 días',
      delivery: '48 horas',
      status: 'Activo'
    },
    {
      id: 'PR-002',
      name: 'Alimentos Austral Ltda.',
      rut: '77.222.333-1',
      contact: 'Rodrigo Lagos',
      email: 'contacto@example.cl',
      phone: '+56 45 233 4050',
      terms: 'Crédito a 45 días',
      delivery: '72 horas',
      status: 'Activo'
    },
    {
      id: 'PR-003',
      name: 'Distribuidora Andes SpA',
      rut: '76.333.444-9',
      contact: 'Camila Reyes',
      email: 'pedidos@example.cl',
      phone: '+56 2 2444 5060',
      terms: 'Contado',
      delivery: '24 horas',
      status: 'Activo'
    }
  ],
  // Lotes disponibles en las bodegas, con cantidades y fechas de vencimiento.
  stock: [
    {
      id: 'ST-01',
      sku: 'LAC-001',
      product: 'Leche entera 1 L',
      category: 'Lácteos',
      lot: 'LS-2610',
      expiry: '2026-10-28',
      location: 'Temuco · A-01',
      quantity: 85,
      minimum: 100
    },
    {
      id: 'ST-02',
      sku: 'ARR-002',
      product: 'Arroz grado 1 · 1 kg',
      category: 'Abarrotes',
      lot: 'AR-0926',
      expiry: '2027-09-30',
      location: 'Temuco · B-03',
      quantity: 420,
      minimum: 100
    },
    {
      id: 'ST-03',
      sku: 'ACE-003',
      product: 'Aceite vegetal 1 L',
      category: 'Abarrotes',
      lot: 'AV-1026',
      expiry: '2027-06-15',
      location: 'Angol · A-02',
      quantity: 24,
      minimum: 60
    },
    {
      id: 'ST-04',
      sku: 'YOG-004',
      product: 'Yogur natural 125 g',
      category: 'Lácteos',
      lot: 'YN-1012',
      expiry: '2026-10-23',
      location: 'Temuco · F-01',
      quantity: 156,
      minimum: 50
    },
    {
      id: 'ST-05',
      sku: 'FIC-005',
      product: 'Fideos espirales 400 g',
      category: 'Abarrotes',
      lot: 'FE-0826',
      expiry: '2027-08-31',
      location: 'Angol · B-01',
      quantity: 350,
      minimum: 80
    },
    {
      id: 'ST-06',
      sku: 'CON-006',
      product: 'Atún al agua 160 g',
      category: 'Conservas',
      lot: 'AA-0726',
      expiry: '2028-07-31',
      location: 'Temuco · C-02',
      quantity: 180,
      minimum: 50
    },
    {
      id: 'ST-07',
      sku: 'QUE-007',
      product: 'Queso laminado 500 g',
      category: 'Lácteos',
      lot: 'QL-0926',
      expiry: '2026-10-15',
      location: 'Angol · F-01',
      quantity: 18,
      minimum: 30
    },
    {
      id: 'ST-08',
      sku: 'BEB-008',
      product: 'Agua mineral 1,5 L',
      category: 'Bebidas',
      lot: 'AM-1026',
      expiry: '2027-10-01',
      location: 'Temuco · D-02',
      quantity: 560,
      minimum: 120
    }
  ],
  // Órdenes de compra de ejemplo para probar la recepción.
  orders: [
    {
      id: 'OC-2026-084',
      supplier: 'PR-001',
      product: 'Leche entera 1 L',
      sku: 'LAC-001',
      category: 'Lácteos',
      quantity: 240,
      received: 0,
      price: 890
    },
    {
      id: 'OC-2026-085',
      supplier: 'PR-002',
      product: 'Arroz grado 1 · 1 kg',
      sku: 'ARR-002',
      category: 'Abarrotes',
      quantity: 500,
      received: 100,
      price: 1190
    },
    {
      id: 'OC-2026-086',
      supplier: 'PR-003',
      product: 'Aceite vegetal 1 L',
      sku: 'ACE-003',
      category: 'Abarrotes',
      quantity: 180,
      received: 0,
      price: 1750
    }
  ],
  // Ventas históricas que alimentan los reportes y las comisiones.
  sales: [
    {
      id: 'V-0841',
      date: '2026-10-17',
      client: 'CL-001',
      seller: 'Carolina Muñoz',
      product: 'Arroz grado 1 · 1 kg',
      quantity: 120,
      price: 1490,
      paid: 1
    },
    {
      id: 'V-0842',
      date: '2026-10-17',
      client: 'CL-002',
      seller: 'Felipe Rojas',
      product: 'Leche entera 1 L',
      quantity: 96,
      price: 1090,
      paid: 1
    },
    {
      id: 'V-0843',
      date: '2026-10-16',
      client: 'CL-003',
      seller: 'Carolina Muñoz',
      product: 'Aceite vegetal 1 L',
      quantity: 48,
      price: 2290,
      paid: 0.5
    },
    {
      id: 'V-0844',
      date: '2026-10-16',
      client: 'CL-004',
      seller: 'Diego Fuentes',
      product: 'Atún al agua 160 g',
      quantity: 144,
      price: 1590,
      paid: 0
    },
    {
      id: 'V-0845',
      date: '2026-10-15',
      client: 'CL-006',
      seller: 'Diego Fuentes',
      product: 'Arroz grado 1 · 1 kg',
      quantity: 240,
      price: 1490,
      paid: 1
    },
    {
      id: 'V-0846',
      date: '2026-10-14',
      client: 'CL-002',
      seller: 'Felipe Rojas',
      product: 'Fideos espirales 400 g',
      quantity: 300,
      price: 790,
      paid: 1
    },
    {
      id: 'V-0847',
      date: '2026-10-13',
      client: 'CL-001',
      seller: 'Carolina Muñoz',
      product: 'Agua mineral 1,5 L',
      quantity: 180,
      price: 890,
      paid: 0.5
    },
    {
      id: 'V-0848',
      date: '2026-10-12',
      client: 'CL-004',
      seller: 'Diego Fuentes',
      product: 'Leche entera 1 L',
      quantity: 192,
      price: 1090,
      paid: 1
    },
    {
      id: 'V-0837',
      date: '2026-09-28',
      client: 'CL-006',
      seller: 'Diego Fuentes',
      product: 'Atún al agua 160 g',
      quantity: 100,
      price: 1590,
      paid: 1
    }
  ],
  // Documentos simulados que aparecen en el listado inicial.
  documents: [
    {
      id: 'DEMO-001',
      type: 'Factura electrónica',
      client: 'CL-001',
      date: '2026-10-17',
      lines: [{ product: 'Arroz grado 1 · 1 kg', quantity: 120, price: 1490 }],
      status: 'Emitido · demo'
    },
    {
      id: 'DEMO-002',
      type: 'Guía de despacho',
      client: 'CL-002',
      date: '2026-10-17',
      lines: [{ product: 'Leche entera 1 L', quantity: 96, price: 1090 }],
      status: 'Emitido · demo'
    },
    {
      id: 'DEMO-003',
      type: 'Factura electrónica',
      client: 'CL-003',
      date: '2026-10-16',
      lines: [{ product: 'Aceite vegetal 1 L', quantity: 48, price: 2290 }],
      status: 'Emitido · demo'
    }
  ],
  // Las nuevas recepciones se irán agregando a esta lista.
  receipts: [],
  rate: 3
});
