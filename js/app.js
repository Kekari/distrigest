// Punto de entrada: conecta las pantallas, los formularios y los datos del prototipo.
import { createInitialData as seed } from './datos/datos-iniciales.js';
import { icon } from './componentes/iconos.js';
import { searchSelect } from './componentes/filtro-buscador.js';
import { inventoryItems, inventoryState } from './logica/inventario.js';
import { datePicker } from './componentes/calendario.js';
import { receiveStock, commission, totals, stockStatus } from './logica/calculos.js';

// Muestra los montos en pesos chilenos y sin decimales.
const money = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(n);

// Da formato a las cantidades para que sean más fáciles de leer.
const num = (n) => new Intl.NumberFormat('es-CL').format(n);

// Convierte caracteres especiales para mostrar texto sin interpretarlo como HTML.
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

// Obtiene la fecha actual de Chile.
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

// Presenta una fecha con el nombre del mes en español.
const date = (s) =>
  new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(s + 'T12:00:00Z'));

// Crea una etiqueta de estado, como Por vencer o Stock bajo.
const tag = (label, color = 'green') =>
  `<span class="tag ${color}"><span class="dot"></span>${esc(label)}</span>`;

// Crea un botón con icono y con el nombre de la acción que debe ejecutar.
const btn = (label, action, primary = false, ic = 'plus') =>
  `<button class="btn ${primary ? 'primary' : ''}" data-action="${action}">${icon(ic, 15)}${label}</button>`;

// Nombre usado para guardar los datos del prototipo en este navegador.
const STORAGE = 'distrigest-demo-v1';

// Carga los datos guardados. Si no existen o hay un problema, usa los datos de ejemplo.
let db;
let storageWarning = false;
try {
  db = JSON.parse(localStorage.getItem(STORAGE)) || seed();
  if (!Array.isArray(db.clients) || !Array.isArray(db.stock)) db = seed();
} catch {
  db = seed();
  storageWarning = true;
}

// Guarda la pantalla actual, la búsqueda y los filtros seleccionados.
let route = location.hash.slice(1) || 'dashboard',
  query = '',
  filter = {},
  inventoryTab = 'all';

// Relaciona cada pantalla con su título y su icono.
const routes = {
  dashboard: ['Centro de operaciones', 'grid'],
  clients: ['Clientes', 'users'],
  receiving: ['Recepción de mercadería', 'truck'],
  inventory: ['Inventario', 'box'],
  alerts: ['Centro de alertas', 'bell'],
  documents: ['Documentos tributarios', 'file'],
  suppliers: ['Proveedores', 'building'],
  reports: ['Reportes de ventas', 'chart'],
  commissions: ['Comisiones', 'wallet']
};

// Obtiene los vendedores actuales e históricos, sin repetir nombres.
const sellers = () => [
  ...new Set([...db.clients.map((x) => x.seller), ...db.sales.map((x) => x.seller)])
];

// Busca un cliente por su identificador.
const client = (id) =>
  db.clients.find((x) => x.id === id) || { name: 'Cliente no encontrado', zone: '—' };

// Busca un proveedor por su identificador.
const supplier = (id) =>
  db.suppliers.find((x) => x.id === id) || { name: 'Proveedor no encontrado' };

// Guarda los cambios en localStorage para conservarlos al recargar la página.
const save = () => {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(db));
  } catch {
    storageWarning = true;
    toast('Los cambios están en memoria: el navegador no permite guardarlos.');
  }
};

// Muestra por unos segundos un aviso con el resultado de una acción.
function toast(msg) {
  const el = document.querySelector('#toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
}

// Cambia de pantalla y limpia la búsqueda y los filtros anteriores.
function go(next) {
  if (!routes[next]) next = 'dashboard';
  route = next;
  query = '';
  filter = {};
  location.hash = next;
  render();
  window.scrollTo(0, 0);
}

// Revisa los lotes y prepara las alertas de stock bajo y vencimiento.
const alertItems = () =>
  db.stock.flatMap((s) => {
    const status = stockStatus(s, today());
    const list = [];
    if (status.expiry !== 'Vigente')
      list.push({
        title: status.expiry === 'Vencido' ? 'Lote vencido' : 'Próximo a vencer',
        description: `${s.product} · Lote ${s.lot}`,
        detail:
          status.days < 0
            ? `Venció el ${date(s.expiry)}`
            : `Vence el ${date(s.expiry)} · ${status.days} días`,
        red: status.days < 0,
        stock: s
      });
    if (status.low)
      list.push({
        title: 'Stock bajo el mínimo',
        description: `${s.product} · ${s.location}`,
        detail: `${s.quantity} unidades disponibles · mínimo ${s.minimum}`,
        red: false,
        stock: s
      });
    return list;
  });

// Construye la estructura común: menú lateral, encabezado y área de contenido.
function shell() {
  const alerts = alertItems();
  return `<aside class="sidebar" id="sidebar"><div class="brand"><div class="brandmark">${icon('box', 24)}</div><div><div class="brandname">DistriGest<span style="color:#75a6f9">.</span></div><small>GESTIÓN EMPRESARIAL</small></div></div><div class="workspace-card"><span>${icon('building', 18)}</span><div><strong>DistriSur Araucanía</strong><small>Espacio de trabajo</small></div></div><nav aria-label="Navegación principal"><div class="nav-label">OPERACIONES</div>${[
    ['dashboard', 'Resumen general'],
    ['clients', 'Clientes'],
    ['receiving', 'Recepción de mercadería'],
    ['inventory', 'Inventario'],
    ['alerts', 'Alertas']
  ]
    .map(([key, label]) => nav(key, label, key === 'alerts' ? alerts.length : null))
    .join('')}<div class="nav-label">GESTIÓN COMERCIAL</div>${[
    ['documents', 'Documentos'],
    ['suppliers', 'Proveedores'],
    ['reports', 'Reportes de ventas'],
    ['commissions', 'Comisiones']
  ]
    .map(([key, label]) => nav(key, label))
    .join(
      ''
    )}</nav><div class="sidebar-bottom"><div class="sidebar-note"><strong>Tu espacio de demostración</strong><p>Explora los módulos con datos de ejemplo y prueba cada flujo.</p><button data-action="about">Conocer el prototipo →</button></div><div class="company">DistriSur Araucanía SpA</div><div class="company-location">Temuco · Angol, Chile</div><div class="version"><span class="dot"></span>Corporate · v2.0</div></div></aside><div class="shell"><header class="topbar"><div class="breadcrumb"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Abrir navegación">${icon('menu')}</button>${icon('building', 15)}<span>DistriSur Araucanía</span><span style="color:#bac4d1">/</span><strong>${routes[route][0]}</strong></div><div class="top-actions"><span class="demo-pill">ENTORNO DE DEMOSTRACIÓN</span><button class="icon-btn" data-go="alerts" aria-label="Ver alertas">${icon('bell', 19)}${alerts.length ? '<span class="notification-dot"></span>' : ''}</button><div class="profile"><div class="avatar">AD</div><div><div class="profile-name">Administrador</div><div class="profile-role">Vista de demostración</div></div></div></div></header><main id="content" tabindex="-1">${storageWarning ? '<div class="notice amber">El almacenamiento local no está disponible. Los cambios se conservarán solo mientras esta página esté abierta.</div>' : ''}<div id="page-content"></div><footer class="footer"><span>© 2026 <strong>DistriGest</strong> · Desarrollado para DistriSur Araucanía SpA</span><span>Datos ficticios · Guardado en este navegador <button class="text-btn" style="display:inline;font-size:9px;margin-left:10px" data-action="about">Acerca del prototipo</button></span></footer></main></div>`;
}

// Dibuja una opción del menú y marca la pantalla seleccionada.
function nav(key, label, count) {
  return `<button class="nav-item ${route === key ? 'active' : ''}" data-go="${key}" ${route === key ? 'aria-current="page"' : ''}>${icon(routes[key][1], 18)}<span>${label}</span>${count ? `<span class="count">${count}</span>` : ''}</button>`;
}

// Crea el título, la descripción y los botones superiores de una pantalla.
function heading(title, sub, actions = '', eyebrow = 'GESTIÓN DISTRISUR') {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div><div class="actions">${actions}</div></div>`;
}

// Dibuja una tarjeta con un indicador y su explicación.
function stat(label, value, note, ic = 'chart', color = '') {
  return `<article class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${color}">${icon(ic, 17)}</span></div><div class="stat-value numeric">${value}</div><div class="stat-note">${note}</div></article>`;
}

// Crea una opción de una lista desplegable.
const option = (value, label, selected) =>
  `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;

// Crea una lista desplegable para filtrar información.
const select = (name, label, values, selected = '') =>
  `<select data-filter="${name}" aria-label="${label}">${option('', label, selected)}${values.map((v) => option(typeof v === 'string' ? v : v.id, typeof v === 'string' ? v : v.name, selected)).join('')}</select>`;

// Crea el campo de búsqueda de las tablas.
const search = (placeholder) =>
  `<div class="search-field">${icon('search', 15)}<input type="search" id="search" placeholder="${placeholder}" aria-label="${placeholder}" value="${esc(query)}"></div>`;

// Construye una tabla. Si no hay filas, muestra el mensaje Sin resultados.
function table(headers, rows, empty = 'No hay resultados para los filtros seleccionados.') {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}"><div class="empty">${icon('search', 30)}<h3>Sin resultados</h3>${empty}</div></td></tr>`}</tbody></table></div>`;
}

// Crea el botón para editar un cliente o un proveedor.
const rowEdit = (type, id) =>
  `<button class="icon-btn" data-action="edit-${type}" data-id="${id}" aria-label="Editar ${type === 'client' ? 'cliente' : 'proveedor'}">${icon('edit', 15)}</button>`;

// Busca coincidencias en los campos indicados de una lista.
function filtered(items, fields) {
  const q = query.toLocaleLowerCase('es');
  return items.filter(
    (x) => !q || fields.some((k) => String(x[k]).toLocaleLowerCase('es').includes(q))
  );
}

// Filtra las ventas por mes, vendedor, cliente, producto y zona.
const currentSales = () =>
  db.sales.filter(
    (x) =>
      x.date.startsWith(filter.month || '2026-10') &&
      (!filter.client || x.client === filter.client) &&
      (!filter.seller || x.seller === filter.seller) &&
      (!filter.product || x.product === filter.product) &&
      (!filter.zone || client(x.client).zone === filter.zone)
  );

// Dibuja el gráfico de ventas con los datos de la semana de demostración.
function chart(sales) {
  const labels = ['Lun 12', 'Mar 13', 'Mié 14', 'Jue 15', 'Vie 16', 'Sáb 17'];
  const vals = labels.map((_, i) =>
    sales
      .filter((s) => s.date === `2026-10-${i + 12}`)
      .reduce((a, s) => a + s.quantity * s.price, 0)
  );
  const max = Math.max(...vals, 1);
  const points = vals.map((v, i) => [47 + i * 99, 166 - (v / max) * 127]);
  const path = points.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' ');
  return `<div class="chart"><svg class="graph" viewBox="0 0 590 210" role="img" aria-label="Ventas netas del 12 al 17 de octubre de 2026"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity=".19"/><stop offset="100%" stop-color="#3b82f6" stop-opacity=".01"/></linearGradient></defs>${[0, 1, 2, 3].map((i) => `<line class="gridline" x1="45" x2="558" y1="${39 + i * 42.3}" y2="${39 + i * 42.3}"/><text x="0" y="${42 + i * 42.3}">${Math.round((max * (1 - i / 3)) / 1000)} mil</text>`).join('')}<path d="${path} L542,168 L47,168 Z" fill="url(#area)"/><path d="${path}" fill="none" stroke="#3b82f6" stroke-width="2.6" stroke-linejoin="round"/>${points.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.5" fill="white" stroke="#3b82f6" stroke-width="2"><title>${labels[i]}: ${money(vals[i])}</title></circle><text text-anchor="middle" x="${x}" y="194">${labels[i]}</text>`).join('')}</svg><div class="chart-footer"><span>Valores netos en pesos chilenos</span><span>12 – 17 de octubre, 2026</span></div></div>`;
}

// Pantalla de inicio: indicadores, gráfico, alertas y documentos recientes.
function dashboard() {
  const sales = db.sales.filter((s) => s.date.startsWith('2026-10'));
  const total = sales.reduce((a, s) => a + s.price * s.quantity, 0);
  const alerts = alertItems();
  const low = db.stock.filter((s) => stockStatus(s, today()).low).length;
  const docs = db.documents.slice(-5).reverse();
  return (
    heading(
      'Resumen general',
      'La información que necesitas para gestionar tu operación.',
      `${btn('Octubre de 2026', 'period', false, 'calendar')}`,
      'DISTRISUR ARAUCANÍA'
    ) +
    `<section class="operations-hero"><div class="hero-copy"><div class="hero-kicker"><span class="dot"></span>CENTRO DE OPERACIONES</div><h2>Gestiona tu operación diaria.</h2><p>Revisa el inventario de Temuco y Angol o registra una nueva recepción de mercadería.</p></div><div class="hero-actions">${btn('Registrar recepción', 'new-receipt', true, 'plus')}${btn('Ver inventario', 'open-inventory', false, 'arrow')}</div></section><div class="stats">${stat('Ventas netas del mes', money(total), `${sales.length} ventas registradas en octubre`, 'chart')}${stat('Clientes activos', num(db.clients.filter((c) => c.status === 'Activo').length), `${db.clients.length} clientes en la base de demostración`, 'users', 'green')}${stat('Unidades en inventario', num(db.stock.reduce((a, s) => a + s.quantity, 0)), `${db.stock.length} lotes · 2 bodegas conectadas`, 'box', 'purple')}${stat('Alertas de inventario', alerts.length, `${low} lotes bajo el stock mínimo`, 'alert', 'amber')}</div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h2>Evolución de ventas</h2><p>Un vistazo a la actividad comercial de la semana</p></div><div class="chart-legend"><span><i class="legend-box"></i>Ventas netas</span></div></div>${chart(sales)}</section><section class="panel"><div class="panel-header"><div><h2>Requieren tu atención</h2><p>Alertas que ayudan a anticiparte</p></div><span class="tag amber">${alerts.length} alertas</span></div><div class="alert-list">${
      alerts
        .slice(0, 3)
        .map(
          (a) =>
            `<div class="alert-item"><span class="alert-symbol ${a.red ? 'red' : ''}">${icon(a.red ? 'clock' : 'alert', 16)}</span><div><div class="alert-title">${a.title}</div><div class="alert-description">${esc(a.description)}</div><div class="alert-description">${esc(a.detail)}</div></div></div>`
        )
        .join('') || '<div class="empty">No hay alertas de inventario.</div>'
    }</div><div class="alert-footer"><button class="text-btn" data-go="alerts">Revisar todas las alertas ${icon('arrow', 14)}</button></div></section></div><section class="panel"><div class="panel-header"><div><h2>Documentos recientes</h2><p>Últimos movimientos de facturación y despacho</p></div><button class="text-btn" data-go="documents">Ver documentos ${icon('arrow', 14)}</button></div>${table(
      ['Documento', 'Cliente', 'Fecha', 'Monto total', 'Estado', ''],
      docs.map((d) => [
        `<span class="id">${d.id}</span><small>${d.type}</small>`,
        `<strong>${esc(client(d.client).name)}</strong>`,
        date(d.date),
        `<strong class="numeric">${money(totals(d.lines).total)}</strong>`,
        tag('Emitido · demo'),
        `<button class="icon-btn" data-action="view-document" data-id="${d.id}" aria-label="Ver documento ${d.id}">${icon('arrow', 15)}</button>`
      ])
    )}<div class="table-footer"><span>Mostrando ${docs.length} de ${db.documents.length} documentos</span><span>Última actividad de demostración</span></div></section><section class="section-gap"><div class="notice">${icon('info', 17)}<span><strong>Un espacio para explorar.</strong> Este prototipo utiliza datos ficticios. Puedes registrar, editar y probar los flujos; tus cambios se guardan en este navegador.</span></div></section>`
  );
}

// Pantalla del listado de clientes y sus filtros.
function clientsPage() {
  const items = filtered(db.clients, ['name', 'rut', 'contact']).filter(
    (c) =>
      (!filter.zone || c.zone === filter.zone) && (!filter.status || c.status === filter.status)
  );
  return (
    heading(
      'Clientes',
      'Una relación más cercana empieza con información organizada.',
      btn('Nuevo cliente', 'new-client', true),
      'DIRECTORIO COMERCIAL'
    ) +
    `<section class="panel"><div class="toolbar">${search('Buscar por nombre, RUT o contacto…')}<div class="filters">${searchSelect('zone', 'Todas las zonas', ['Temuco', 'Angol', 'Villarrica', 'Lautaro'], filter.zone)}${select('status', 'Todos los estados', ['Activo', 'Inactivo'], filter.status)}</div></div>${table(
      ['Cliente / RUT', 'Contacto', 'Zona', 'Vendedor asignado', 'Estado', 'Acciones'],
      items.map((c) => [
        `<strong>${esc(c.name)}</strong><small>${esc(c.rut)}</small>`,
        `${esc(c.contact)}<small>${esc(c.email)}</small>`,
        esc(c.zone),
        esc(c.seller),
        tag(c.status, c.status === 'Activo' ? 'green' : 'gray'),
        rowEdit('client', c.id)
      ])
    )}<div class="table-footer"><span>${items.length} clientes encontrados</span><span>Datos de demostración</span></div></section>`
  );
}

// Pantalla del listado de proveedores y sus condiciones comerciales.
function suppliersPage() {
  const items = filtered(db.suppliers, ['name', 'rut', 'contact']);
  return (
    heading(
      'Proveedores',
      'Conecta el abastecimiento con las condiciones de cada proveedor.',
      btn('Nuevo proveedor', 'new-supplier', true),
      'ABASTECIMIENTO'
    ) +
    `<section class="panel"><div class="toolbar">${search('Buscar proveedor, RUT o contacto…')}<span class="subtitle">${db.suppliers.length} proveedores registrados</span></div>${table(
      ['Proveedor / RUT', 'Contacto', 'Condiciones comerciales', 'Plazo de entrega', 'Estado', ''],
      items.map((s) => [
        `<strong>${esc(s.name)}</strong><small>${esc(s.rut)}</small>`,
        `${esc(s.contact)}<small>${esc(s.email)}</small>`,
        esc(s.terms),
        esc(s.delivery),
        tag(s.status, s.status === 'Activo' ? 'green' : 'gray'),
        rowEdit('supplier', s.id)
      ])
    )}</section>`
  );
}

// Pantalla del inventario por producto, lote, ubicación y vencimiento.
function inventoryPage() {
  const items = inventoryItems(
    db.stock,
    { tab: inventoryTab, query, warehouse: filter.warehouse },
    today()
  );
  return (
    heading(
      'Inventario',
      'Visibilidad por producto, lote y ubicación en Temuco y Angol.',
      btn('Registrar recepción', 'new-receipt', true),
      'CONTROL DE EXISTENCIAS'
    ) +
    `<div class="stats">${stat('Unidades disponibles', num(db.stock.reduce((a, s) => a + s.quantity, 0)), 'Existencias registradas en ambas bodegas', 'box')}${stat('Productos diferentes', new Set(db.stock.map((s) => s.sku)).size, 'Catálogo de demostración', 'grid', 'purple')}${stat('Lotes con stock bajo', db.stock.filter((s) => stockStatus(s, today()).low).length, 'Según el mínimo definido por lote', 'alert', 'amber')}${stat('Lotes por revisar', db.stock.filter((s) => stockStatus(s, today()).expiry !== 'Vigente').length, 'Vencidos o próximos a vencer en 30 días', 'clock', 'amber')}</div><section class="panel"><div class="tabs">${[
      ['all', 'Todos los lotes'],
      ['low', 'Stock bajo'],
      ['expiry', 'Vencimientos']
    ]
      .map(
        ([k, l]) =>
          `<button class="tab ${inventoryTab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`
      )
      .join(
        ''
      )}</div><div class="toolbar">${search('Buscar producto, SKU o lote…')}<div class="filters">${select('warehouse', 'Todas las bodegas', ['Temuco', 'Angol'], filter.warehouse)}${btn('Exportar', 'export-stock', false, 'download')}</div></div>${table(
      ['Producto / SKU', 'Lote', 'Ubicación', 'Vencimiento', 'Existencias', 'Estado'],
      items.map((s) => {
        const status = stockStatus(s, today());
        return [
          `<div class="product-cell"><span class="product-icon">${icon('box', 17)}</span><div><strong>${esc(s.product)}</strong><small>${esc(s.sku)} · ${esc(s.category)}</small></div></div>`,
          esc(s.lot),
          esc(s.location),
          `${date(s.expiry)}<small>${status.days < 0 ? 'Vencido' : status.days + ' días restantes'}</small>`,
          `<strong>${num(s.quantity)} un.</strong><small>Mínimo: ${s.minimum} un.</small>`,
          tag(
            inventoryState(s, inventoryTab, today()).label,
            inventoryState(s, inventoryTab, today()).color
          )
        ];
      })
    )}<div class="table-footer"><span>${items.length} lotes encontrados</span><span>${inventoryTab === 'expiry' ? 'Por vencer: fecha más cercana primero · Luego, lotes vencidos' : 'FEFO: revisar primero los lotes de vencimiento más cercano'}</span></div></section>`
  );
}

// Formulario para recibir mercadería contra una orden de compra.
function receivingPage() {
  const order =
    db.orders.find((o) => o.id === filter.order) ||
    db.orders.find((o) => o.received < o.quantity) ||
    db.orders[0];
  return (
    heading(
      'Recepción de mercadería',
      'Contrasta lo recibido con tu orden de compra y actualiza las existencias.',
      '',
      'ABASTECIMIENTO'
    ) +
    `<div class="receipt-layout"><section class="panel"><div class="panel-header"><div><h2>Registrar una recepción</h2><p>1. Selecciona la orden · 2. Revisa el lote · 3. Confirma</p></div><span class="tag gray">${icon('truck', 13)}Bodega</span></div><form class="padded" id="receive-form"><div class="form-grid"><div class="field full"><label for="order">Orden de compra</label><select id="order" name="order" data-order>${db.orders.map((o) => option(o.id, `${o.id} · ${supplier(o.supplier).name}${o.received >= o.quantity ? ' · Completa' : ''}`, order.id)).join('')}</select></div><div class="field full"><div class="notice" style="margin:0"><span><strong>${esc(order.product)}</strong><br>Solicitado: ${order.quantity} un. · Recibido antes: ${order.received} un. · Pendiente: <strong>${order.quantity - order.received} un.</strong></span></div></div><div class="field"><label for="lot">Número de lote</label><input id="lot" name="lot" required maxlength="40" placeholder="Ej. LS-2610-B"></div><div class="field"><label for="expiry">Fecha de vencimiento</label>${datePicker({ id: 'expiry', name: 'expiry', min: today() })}</div><div class="field"><label for="received">Cantidad recibida (unidades)</label><input id="received" name="received" type="number" min="1" max="${order.quantity - order.received}" step="1" required placeholder="0"></div><div class="field"><label for="location">Bodega y ubicación</label><select id="location" name="location">${['Temuco · A-01', 'Temuco · B-03', 'Temuco · F-01', 'Angol · A-02', 'Angol · B-01', 'Angol · F-01'].map((v) => option(v, v)).join('')}</select></div><div class="field full"><label for="note">Observaciones de la recepción</label><textarea id="note" name="note" rows="2" maxlength="300" placeholder="Diferencias, embalaje u otra observación…"></textarea></div></div><div class="form-error" role="alert" id="receive-error"></div><div class="modal-footer"><button class="btn primary" type="submit" ${order.received >= order.quantity ? 'disabled' : ''}>${icon('check', 16)}Revisar y confirmar</button></div></form></section><div><section class="panel"><div class="panel-header"><h2>Orden seleccionada</h2></div><div class="padded" style="padding-top:0"><dl class="detail-list"><div><dt>Número de orden</dt><dd>${order.id}</dd></div><div><dt>Estado</dt><dd>${tag(order.received >= order.quantity ? 'Completa' : order.received ? 'Parcial' : 'Pendiente', order.received >= order.quantity ? 'green' : 'amber')}</dd></div><div style="grid-column:1/-1"><dt>Proveedor</dt><dd>${esc(supplier(order.supplier).name)}</dd></div><div><dt>Precio neto unitario</dt><dd>${money(order.price)}</dd></div><div><dt>Total solicitado</dt><dd>${money(order.quantity * order.price)}</dd></div></dl></div></section><div class="notice section-gap">${icon('info', 18)}<span>Una recepción parcial conserva el saldo pendiente. Al confirmar, las unidades recibidas se sumarán al producto, lote y ubicación indicados.</span></div><section class="panel"><div class="panel-header"><h2>Últimas recepciones</h2></div>${
      db.receipts.length
        ? db.receipts
            .slice(-3)
            .reverse()
            .map(
              (r) =>
                `<div class="padded" style="padding-top:0"><strong style="font-size:11px">${esc(r.order)} · ${r.received} unidades</strong><div class="subtitle">Lote ${esc(r.lot)} · Diferencia ${r.difference}</div></div>`
            )
            .join('')
        : '<div class="empty" style="padding:25px">Aún no registras recepciones.<br>Comienza con una orden de compra.</div>'
    }</section></div></div>`
  );
}

// Pantalla de alertas de stock mínimo y productos vencidos o por vencer.
function alertsPage() {
  const items = alertItems().filter(
    (a) =>
      !filter.type ||
      (filter.type === 'Vencidos'
        ? a.red
        : filter.type === 'Stock bajo'
          ? a.title === 'Stock bajo el mínimo'
          : a.title === 'Próximo a vencer')
  );
  return (
    heading(
      'Centro de alertas',
      'Prioriza el reabastecimiento y reduce las pérdidas por vencimiento.',
      btn('Ver inventario', 'open-inventory', false, 'box'),
      'SEGUIMIENTO DE INVENTARIO'
    ) +
    `<div class="notice">${icon('info', 18)}<span>Alertas calculadas con la fecha de hoy (${date(today())}). Se considera próximo a vencer un lote con 30 días o menos. Los lotes vencidos se señalan para revisión.</span></div><section class="panel"><div class="toolbar"><h2>Alertas activas <span class="tag amber" style="margin-left:8px">${items.length}</span></h2>${select('type', 'Todos los tipos', ['Stock bajo', 'Próximos a vencer', 'Vencidos'], filter.type)}</div>${table(
      ['Prioridad', 'Producto / Lote', 'Ubicación', 'Detalle', 'Acción'],
      items.map((a) => [
        tag(a.title, a.red ? 'red' : 'amber'),
        `<strong>${esc(a.stock.product)}</strong><small>Lote ${esc(a.stock.lot)}</small>`,
        esc(a.stock.location),
        esc(a.detail),
        `<button class="text-btn" data-action="locate-stock" data-id="${a.stock.id}">Revisar ${icon('arrow', 14)}</button>`
      ])
    )}</section>`
  );
}

// Pantalla de facturas, guías y notas de crédito de demostración.
function documentsPage() {
  const docs = filtered(
    db.documents.map((d) => ({ ...d, clientName: client(d.client).name })),
    ['id', 'clientName']
  )
    .filter((d) => !filter.type || d.type === filter.type)
    .reverse();
  return (
    heading(
      'Documentos tributarios',
      'Consulta y crea documentos para recorrer el proceso de facturación.',
      btn('Nuevo documento', 'new-document', true),
      'GESTIÓN DOCUMENTAL'
    ) +
    `<div class="notice amber">${icon('info', 18)}<span><strong>Emisión de demostración.</strong> El proveedor DTE está simulado. Estos documentos no tienen validez tributaria ni se envían al SII.</span></div><section class="panel"><div class="toolbar">${search('Buscar documento o cliente…')}${select('type', 'Todos los documentos', ['Factura electrónica', 'Guía de despacho', 'Nota de crédito'], filter.type)}</div>${table(
      ['Documento', 'Cliente', 'Fecha', 'Neto', 'Total con IVA', 'Estado', ''],
      docs.map((d) => [
        `<span class="id">${d.id}</span><small>${d.type}${d.reference ? ' · Ref. ' + esc(d.reference) : ''}</small>`,
        `<strong>${esc(client(d.client).name)}</strong>`,
        date(d.date),
        money(totals(d.lines).net),
        `<strong>${money(totals(d.lines).total)}</strong>`,
        tag('Emitido · demo'),
        `<button class="icon-btn" data-action="view-document" data-id="${d.id}" aria-label="Ver ${d.id}">${icon('eye', 17)}</button>`
      ])
    )}</section>`
  );
}

// Reúne los filtros de fecha, vendedor, cliente, producto y zona.
function reportFilters(includeProduct = true) {
  return `<div class="filters">${datePicker({ id: 'report-period', name: 'month', mode: 'month', value: filter.month || '2026-10', label: 'Mes del reporte', filter: true })}${searchSelect('seller', 'Todos los vendedores', sellers(), filter.seller)}${includeProduct ? searchSelect('client', 'Todos los clientes', db.clients, filter.client) + searchSelect('product', 'Todos los productos', [...new Set(db.sales.map((s) => s.product))], filter.product) + searchSelect('zone', 'Todas las zonas', ['Temuco', 'Angol', 'Villarrica', 'Lautaro'], filter.zone) : ''}</div>`;
}

// Pantalla del reporte de ventas y sus indicadores.
function reportsPage() {
  const sales = currentSales();
  const net = sales.reduce((a, s) => a + s.quantity * s.price, 0);
  return (
    heading(
      'Reportes de ventas',
      'Transforma las ventas en información para tomar decisiones.',
      btn('Exportar CSV', 'export-sales', true, 'download'),
      'ANÁLISIS COMERCIAL'
    ) +
    `<section class="panel" style="margin-bottom:23px"><div class="toolbar">${reportFilters()}</div></section><div class="stats">${stat('Ventas netas', money(net), 'Total según los filtros seleccionados', 'chart')}${stat('Operaciones', sales.length, 'Ventas registradas en el período', 'file', 'purple')}${stat('Clientes atendidos', new Set(sales.map((s) => s.client)).size, 'Clientes únicos en los resultados', 'users', 'green')}${stat('Ticket neto promedio', money(sales.length ? net / sales.length : 0), 'Promedio por operación', 'wallet', 'amber')}</div><section class="panel"><div class="panel-header"><div><h2>Detalle de ventas</h2><p>Consulta por cliente, vendedor, producto y zona</p></div><span class="tag gray">${sales.length} resultados</span></div>${table(
      ['Fecha', 'Cliente / Zona', 'Vendedor', 'Producto', 'Cantidad', 'Venta neta', 'Cobranza'],
      sales.map((s) => [
        date(s.date),
        `<strong>${esc(client(s.client).name)}</strong><small>${esc(client(s.client).zone)}</small>`,
        esc(s.seller),
        esc(s.product),
        num(s.quantity),
        `<strong>${money(s.quantity * s.price)}</strong>`,
        tag(
          s.paid === 1 ? 'Cobrada' : s.paid ? 'Cobro parcial' : 'Pendiente',
          s.paid === 1 ? 'green' : 'amber'
        )
      ])
    )}</section>`
  );
}

// Pantalla que calcula las comisiones según lo efectivamente cobrado.
function commissionsPage() {
  const sales = currentSales();
  const net = sales.reduce((a, s) => a + s.price * s.quantity, 0);
  const paid = sales.reduce((a, s) => a + s.price * s.quantity * s.paid, 0);
  const rows = sellers()
    .filter((s) => !filter.seller || s === filter.seller)
    .map((name) => {
      const ss = sales.filter((s) => s.seller === name),
        net = ss.reduce((a, s) => a + s.price * s.quantity, 0),
        paid = ss.reduce((a, s) => a + s.price * s.quantity * s.paid, 0);
      return { name, net, paid, amount: commission(paid, 1, db.rate) };
    });
  return (
    heading(
      'Comisiones de vendedores',
      'Un cálculo transparente, conectado con las ventas y su cobranza.',
      btn('Exportar CSV', 'export-commissions', false, 'download'),
      'GESTIÓN COMERCIAL'
    ) +
    `<div class="notice">${icon('info', 18)}<span><strong>Regla de demostración:</strong> comisión = venta neta efectivamente cobrada × tasa. Los cobros parciales generan una comisión proporcional y las ventas sin cobro no generan comisión. Esta regla puede ajustarse al definir las condiciones del negocio.</span></div><section class="panel" style="margin-bottom:23px"><div class="toolbar">${reportFilters(false)}<div class="filters"><label for="rate" style="margin:0">Tasa de comisión</label><input class="rate-input" id="rate" type="number" min="0" max="100" step="0.1" value="${db.rate}" aria-label="Tasa de comisión porcentual"><span>%</span><button class="btn small" data-action="save-rate">Aplicar</button></div></div></section><div class="stats">${stat('Ventas netas del período', money(net), 'Antes de IVA', 'chart')}${stat('Monto neto cobrado', money(paid), 'Base para calcular las comisiones', 'wallet', 'green')}${stat('Por cobrar', money(net - paid), 'No genera comisión hasta su cobro', 'clock', 'amber')}${stat('Comisión calculada', money(rows.reduce((a, r) => a + r.amount, 0)), `Tasa de demostración: ${db.rate}%`, 'users', 'purple')}</div><section class="panel"><div class="panel-header"><h2>Liquidación preliminar por vendedor</h2><span class="tag gray">Simulación</span></div>${table(
      ['Vendedor', 'Ventas netas', 'Neto cobrado', 'Por cobrar', 'Tasa', 'Comisión'],
      rows.map((r) => [
        `<strong>${esc(r.name)}</strong>`,
        money(r.net),
        money(r.paid),
        money(r.net - r.paid),
        db.rate + '%',
        `<strong style="color:var(--primary)">${money(r.amount)}</strong>`
      ])
    )}</section>`
  );
}

// Dibuja la estructura general y después carga la pantalla actual.
function render() {
  if (!routes[route]) route = 'dashboard';
  document.querySelector('#app').innerHTML = shell();
  updatePage();
  document.title = `DistriGest · ${routes[route][0]}`;
}

// Actualiza solo el contenido de la pantalla seleccionada.
function updatePage() {
  const views = {
    dashboard,
    clients: clientsPage,
    suppliers: suppliersPage,
    inventory: inventoryPage,
    receiving: receivingPage,
    alerts: alertsPage,
    documents: documentsPage,
    reports: reportsPage,
    commissions: commissionsPage
  };
  document.querySelector('#page-content').innerHTML = views[route]();
}

// Crea un campo de formulario con su etiqueta.
function field(name, label, value = '', type = 'text', required = true, extra = '') {
  return `<div class="field"><label for="f-${name}">${label}${required ? ' *' : ''}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} maxlength="150" ${extra}></div>`;
}

// Crea un campo de formulario que permite elegir una opción.
function selectField(name, label, values, value, required = true) {
  return `<div class="field"><label for="f-${name}">${label}${required ? ' *' : ''}</label><select id="f-${name}" name="${name}" ${required ? 'required' : ''}>${values.map((v) => option(typeof v === 'string' ? v : v.id, typeof v === 'string' ? v : v.name, value)).join('')}</select></div>`;
}

// Guarda la función que se ejecutará al confirmar la ventana abierta.
let onModalSubmit = null;

// Abre una ventana para editar, revisar o confirmar información.
function openModal(title, body, submit = null, label = 'Guardar cambios') {
  const modal = document.querySelector('#modal');
  onModalSubmit = submit;
  modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${title}</h2><button class="icon-btn" data-action="close" aria-label="Cerrar">${icon('close', 18)}</button></div><form id="modal-form" class="modal-body">${body}<div class="form-error" role="alert" id="modal-error"></div><div class="modal-footer"><button type="button" class="btn" data-action="close">${submit ? 'Cancelar' : 'Cerrar'}</button>${submit ? `<button type="submit" class="btn primary">${icon('check', 15)}${label}</button>` : ''}</div></form>`;
  modal.setAttribute('aria-labelledby', 'modal-title');
  if (!modal.open) modal.showModal();
}

// Abre el formulario de cliente y valida el RUT antes de guardar.
function editClient(id) {
  const c = db.clients.find((c) => c.id === id) || {};
  openModal(
    c.id ? 'Editar cliente' : 'Nuevo cliente',
    `<p class="inline-help" style="margin:0 0 19px">Completa la información comercial. Los campos con * son obligatorios.</p><div class="form-grid">${field('name', 'Razón social', c.name)}${field('rut', 'RUT', c.rut, 'text', true, 'placeholder="12.345.678-5"')}${field('giro', 'Giro comercial', c.giro)}${field('address', 'Dirección de despacho', c.address)}${field('contact', 'Nombre de contacto', c.contact)}${field('email', 'Correo electrónico', c.email, 'email')}${field('phone', 'Teléfono', c.phone, 'tel', false)}${selectField('zone', 'Zona', ['Temuco', 'Angol', 'Villarrica', 'Lautaro'], c.zone)}${selectField('seller', 'Vendedor asignado', sellers(), c.seller)}${selectField('status', 'Estado', ['Activo', 'Inactivo'], c.status)}</div>`,
    (f) => {
      const data = Object.fromEntries(f);
      if (!validRut(data.rut))
        throw new Error('Revisa el RUT y su dígito verificador. Ejemplo válido: 12.345.678-5.');
      if (db.clients.some((x) => x.id !== id && cleanRut(x.rut) === cleanRut(data.rut)))
        throw new Error('Ya existe un cliente registrado con ese RUT.');
      if (c.id) Object.assign(c, data);
      else db.clients.push({ ...data, id: 'CL-' + crypto.randomUUID().slice(0, 6) });
      save();
      toast(c.id ? 'Cliente actualizado.' : 'Cliente registrado.');
    }
  );
}

// Quita puntos, espacios y guion para comparar los RUT.
const cleanRut = (r) => r.replace(/[.\s-]/g, '').toUpperCase();

// Comprueba el formato y el dígito verificador de un RUT chileno.
function validRut(r) {
  const clean = cleanRut(r);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  let sum = 0,
    m = 2;
  for (const digit of clean.slice(0, -1).split('').reverse()) {
    sum += Number(digit) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const dv = 11 - (sum % 11);
  return clean.at(-1) === (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv));
}

// Abre el formulario de proveedor y valida sus datos antes de guardar.
function editSupplier(id) {
  const s = db.suppliers.find((s) => s.id === id) || {};
  openModal(
    s.id ? 'Editar proveedor' : 'Nuevo proveedor',
    `<div class="form-grid">${field('name', 'Razón social', s.name)}${field('rut', 'RUT', s.rut)}${field('contact', 'Nombre de contacto', s.contact)}${field('email', 'Correo electrónico', s.email, 'email')}${field('phone', 'Teléfono', s.phone, 'tel', false)}${field('terms', 'Condiciones comerciales', s.terms, 'text', true, 'placeholder="Ej. Crédito a 30 días"')}${field('delivery', 'Plazo de entrega', s.delivery, 'text', true, 'placeholder="Ej. 48 horas"')}${selectField('status', 'Estado', ['Activo', 'Inactivo'], s.status)}</div>`,
    (f) => {
      const data = Object.fromEntries(f);
      if (!validRut(data.rut)) throw new Error('Revisa el RUT y su dígito verificador.');
      if (db.suppliers.some((x) => x.id !== id && cleanRut(x.rut) === cleanRut(data.rut)))
        throw new Error('Ya existe un proveedor con ese RUT.');
      if (s.id) Object.assign(s, data);
      else db.suppliers.push({ ...data, id: 'PR-' + crypto.randomUUID().slice(0, 6) });
      save();
      toast('Proveedor guardado.');
    }
  );
}

// Prepara un documento simulado y solicita confirmación antes de registrarlo.
function newDocument() {
  openModal(
    'Nuevo documento de demostración',
    `<div class="notice amber">${icon('info', 17)}<span>El proveedor DTE se simula. No se emitirán documentos tributarios reales.</span></div><div class="form-grid">${selectField('type', 'Tipo de documento', ['Factura electrónica', 'Guía de despacho', 'Nota de crédito'], 'Factura electrónica')}${selectField(
      'client',
      'Cliente',
      db.clients.filter((c) => c.status === 'Activo')
    )}<div class="field full" id="reference-field" hidden><label for="reference">Documento de referencia *</label><select id="reference" name="reference"><option value="">Selecciona una factura</option>${db.documents
      .filter((d) => d.type === 'Factura electrónica')
      .map((d) => option(d.id, `${d.id} · ${client(d.client).name}`))
      .join(
        ''
      )}</select><small>Una nota de crédito se vincula al cliente de su factura de referencia.</small></div>${selectField('product', 'Producto', [...new Set(db.stock.map((s) => s.product))])}${field('quantity', 'Cantidad', 1, 'number', true, 'min="1" max="999999" step="1"')}${field('price', 'Precio unitario neto (CLP)', 1000, 'number', true, 'min="1" max="999999999" step="1"')}<div class="field"><label>Resumen del documento</label><div id="document-preview" class="inline-help"></div></div></div>`,
    (f) => {
      const data = Object.fromEntries(f);
      const lines = [
        { product: data.product, quantity: Number(data.quantity), price: Number(data.price) }
      ];
      if (
        !Number.isInteger(lines[0].quantity) ||
        !Number.isInteger(lines[0].price) ||
        lines[0].quantity <= 0 ||
        lines[0].price <= 0
      )
        throw new Error('La cantidad y el precio deben ser enteros positivos.');
      if (data.type === 'Nota de crédito') {
        const ref = db.documents.find(
          (d) => d.id === data.reference && d.type === 'Factura electrónica'
        );
        if (!ref) throw new Error('Selecciona la factura de referencia.');
        if (ref.client !== data.client)
          throw new Error('El cliente debe coincidir con la factura de referencia.');
        const credited = db.documents
          .filter((d) => d.type === 'Nota de crédito' && d.reference === ref.id)
          .reduce((s, d) => s + totals(d.lines).total, 0);
        if (credited + totals(lines).total > totals(ref.lines).total)
          throw new Error('La nota supera el saldo disponible de la factura de referencia.');
      }
      const doc = {
        id: 'DEMO-' + String(db.documents.length + 1).padStart(3, '0'),
        type: data.type,
        client: data.client,
        date: today(),
        lines,
        status: 'Emitido · demo',
        reference: data.type === 'Nota de crédito' ? data.reference : undefined
      };
      openModal(
        'Confirmar emisión simulada',
        `<div class="notice amber">${icon('info', 17)}<span>Se registrará un documento de demostración sin validez tributaria.</span></div><p>${esc(doc.type)} para <strong>${esc(client(doc.client).name)}</strong></p><div class="summary-line total"><span>Total con IVA</span><span>${money(totals(lines).total)}</span></div>`,
        () => {
          db.documents.push(doc);
          save();
          toast(`${doc.id} creado en modo demostración.`);
        },
        'Confirmar documento'
      );
      return false;
    },
    'Revisar documento'
  );
  documentPreview();
}

// Actualiza el neto, IVA y total mientras se completa un documento.
function documentPreview() {
  const f = document.querySelector('#modal-form');
  if (!f?.elements.price) return;
  const t = totals([
    { quantity: Number(f.elements.quantity.value) || 0, price: Number(f.elements.price.value) || 0 }
  ]);
  document.querySelector('#document-preview').innerHTML =
    `Neto: ${money(t.net)}<br>IVA (19%): ${money(t.tax)}<br><strong>Total: ${money(t.total)}</strong>`;
  const credit = f.elements.type.value === 'Nota de crédito';
  document.querySelector('#reference-field').hidden = !credit;
  f.elements.reference.required = credit;
}

// Muestra los datos y el detalle de un documento existente.
function viewDocument(id) {
  const d = db.documents.find((x) => x.id === id);
  if (!d) return;
  const c = client(d.client);
  const t = totals(d.lines);
  openModal(
    `${d.id} · ${d.type}`,
    `<div class="notice amber">${icon('info', 17)}<span>Documento de demostración. Sin validez tributaria.</span></div><dl class="detail-list"><div><dt>Cliente</dt><dd>${esc(c.name)}</dd></div><div><dt>RUT</dt><dd>${esc(c.rut)}</dd></div><div><dt>Fecha</dt><dd>${date(d.date)}</dd></div><div><dt>Estado</dt><dd>${tag('Emitido · demo')}</dd></div>${d.reference ? `<div><dt>Referencia</dt><dd>${esc(d.reference)}</dd></div>` : ''}</dl>${table(
      ['Producto', 'Cantidad', 'Precio neto'],
      d.lines.map((l) => [esc(l.product), l.quantity, money(l.price)])
    )}<div class="summary-line"><span>Neto</span><span>${money(t.net)}</span></div><div class="summary-line"><span>IVA 19%</span><span>${money(t.tax)}</span></div><div class="summary-line total"><span>${d.type === 'Nota de crédito' ? 'Total a acreditar' : 'Total'}</span><span>${money(t.total)}</span></div>`
  );
}

// Valida la recepción y pide confirmación antes de sumar unidades al inventario.
function receive(form) {
  const f = Object.fromEntries(new FormData(form));
  const order = db.orders.find((o) => o.id === f.order);
  const entry = {
    ...f,
    product: order.product,
    sku: order.sku,
    category: order.category,
    received: Number(f.received),
    expected: order.quantity - order.received,
    minimum: 100
  };
  if (!entry.expiry) throw new Error('Selecciona una fecha de vencimiento en el calendario.');
  if (entry.expiry < today())
    throw new Error('No se puede recibir un lote vencido. Revisa su fecha de vencimiento.');
  const result = receiveStock(db.stock, entry);
  openModal(
    'Confirmar recepción',
    `<p>Se registrarán <strong>${entry.received} unidades</strong> de ${esc(entry.product)}.</p><dl class="detail-list"><div><dt>Lote</dt><dd>${esc(entry.lot)}</dd></div><div><dt>Ubicación</dt><dd>${esc(entry.location)}</dd></div><div><dt>Vencimiento</dt><dd>${date(entry.expiry)}</dd></div><div><dt>Saldo por recibir</dt><dd>${-result.difference} unidades</dd></div></dl>${result.difference ? '<div class="notice amber">Esta es una recepción parcial. La diferencia quedará pendiente en la orden de compra.</div>' : ''}`,
    () => {
      db.stock = result.stock;
      order.received += entry.received;
      db.receipts.push({ ...entry, difference: result.difference, date: today() });
      save();
      toast('Recepción registrada. Inventario actualizado.');
    },
    'Confirmar recepción'
  );
}

// Genera y descarga un archivo CSV con las filas seleccionadas.
function csv(name, headers, rows) {
  const cell = (v) =>
    '"' +
    String(v ?? '')
      .replace(/"/g, '""')
      .replace(/^[=+@\-\t\r]/, "'$&") +
    '"';
  const blob = new Blob(
    ['\ufeff' + [headers, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')],
    { type: 'text/csv;charset=utf-8' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Archivo CSV exportado.');
}

// Muestra el alcance del prototipo y la opción de restaurar los datos.
function about() {
  openModal(
    'Acerca de este prototipo',
    `<div class="notice">${icon('info', 18)}<span><strong>DistriGest · Corporate v2.0</strong><br>Prototipo académico para la tercera evaluación de Ingeniería de Software.</span></div><p style="font-size:12px">Diseño Corporate. Datos ficticios y almacenamiento local por navegador. El rol administrador es una vista de demostración. La emisión DTE no está conectada a un proveedor real.</p><div class="coverage">${[
      ['RF-01', 'Clientes'],
      ['RF-08', 'Recepción de mercadería'],
      ['RF-10', 'Inventario por lote y ubicación'],
      ['RF-11', 'Alertas de stock y vencimiento'],
      ['RF-17', 'Documentos simulados'],
      ['RF-20', 'Proveedores'],
      ['RF-23', 'Reportes de ventas'],
      ['RF-25', 'Comisiones']
    ]
      .map(
        ([id, name]) => `<div><strong style="color:var(--primary)">${id}</strong><br>${name}</div>`
      )
      .join(
        ''
      )}</div><div class="reset-area"><p class="inline-help">Puedes restaurar los datos iniciales para comenzar una nueva revisión.</p><button class="btn danger" data-action="reset">Restaurar datos de demostración</button></div>`
  );
}

// Escucha los clics en menús, pestañas y botones y ejecuta su acción.
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-go],[data-action],[data-tab]');
  if (!target) return;
  if (target.dataset.go) {
    go(target.dataset.go);
    return;
  }
  if (target.dataset.tab) {
    inventoryTab = target.dataset.tab;
    updatePage();
    return;
  }
  const a = target.dataset.action,
    id = target.dataset.id;
  const actions = {
    menu: () => document.querySelector('#sidebar').classList.toggle('open'),
    close: () => document.querySelector('#modal').close(),
    'new-client': () => editClient(),
    'edit-client': () => editClient(id),
    'new-supplier': () => editSupplier(),
    'edit-supplier': () => editSupplier(id),
    'new-receipt': () => go('receiving'),
    'open-inventory': () => go('inventory'),
    'new-document': newDocument,
    'view-document': () => viewDocument(id),
    about: about,
    period: () => go('reports'),
    'locate-stock': () => {
      const s = db.stock.find((x) => x.id === id);
      go('inventory');
      query = s.lot;
      inventoryTab = 'all';
      updatePage();
    },
    'save-rate': () => {
      const rate = Number(document.querySelector('#rate').value);
      if (
        !Number.isFinite(rate) ||
        rate < 0 ||
        rate > 100 ||
        document.querySelector('#rate').value === ''
      ) {
        toast('La tasa debe estar entre 0 y 100 %.');
        return;
      }
      db.rate = rate;
      save();
      updatePage();
      toast('Tasa de demostración actualizada.');
    },
    'export-stock': () =>
      csv(
        'distrigest-inventario',
        ['SKU', 'Producto', 'Lote', 'Ubicación', 'Vencimiento', 'Cantidad'],
        inventoryItems(
          db.stock,
          { tab: inventoryTab, query, warehouse: filter.warehouse },
          today()
        ).map((s) => [s.sku, s.product, s.lot, s.location, s.expiry, s.quantity])
      ),
    'export-sales': () =>
      csv(
        'distrigest-ventas',
        ['Fecha', 'Cliente', 'Vendedor', 'Producto', 'Zona', 'Cantidad', 'Neto', 'Cobrado'],
        currentSales().map((s) => [
          s.date,
          client(s.client).name,
          s.seller,
          s.product,
          client(s.client).zone,
          s.quantity,
          s.price * s.quantity,
          s.price * s.quantity * s.paid
        ])
      ),
    'export-commissions': () =>
      csv(
        'distrigest-comisiones',
        ['Vendedor', 'Mes', 'Neto cobrado', 'Tasa', 'Comisión'],
        sellers()
          .filter((s) => !filter.seller || s === filter.seller)
          .map((name) => {
            const paid = currentSales()
              .filter((s) => s.seller === name)
              .reduce((a, s) => a + s.quantity * s.price * s.paid, 0);
            return [name, filter.month || '2026-10', paid, db.rate, commission(paid, 1, db.rate)];
          })
      ),
    reset: () =>
      openModal(
        'Restaurar datos iniciales',
        `<p>Se eliminarán los cambios de demostración guardados en este navegador y se recuperarán los datos iniciales.</p>`,
        () => {
          db = seed();
          save();
          toast('Datos de demostración restaurados.');
        },
        'Restaurar datos'
      )
  };
  actions[a]?.();
});

// Actualiza las búsquedas y los totales mientras se escribe.
document.addEventListener('input', (e) => {
  if (e.target.id === 'search') {
    const pos = e.target.selectionStart;
    query = e.target.value;
    updatePage();
    const input = document.querySelector('#search');
    input.focus();
    input.setSelectionRange(pos, pos);
  }
  if (e.target.closest('#modal-form')) documentPreview();
});

// Actualiza los filtros y la orden de compra cuando cambia una selección.
document.addEventListener('change', (e) => {
  if (e.target.dataset.filter) {
    filter[e.target.dataset.filter] = e.target.value;
    updatePage();
  }
  if (e.target.hasAttribute('data-order')) {
    filter.order = e.target.value;
    updatePage();
  }
  if (e.target.closest('#modal-form')) documentPreview();
});

// Procesa los formularios sin recargar la página y muestra los errores.
document.addEventListener('submit', (e) => {
  if (e.target.id === 'modal-form') {
    e.preventDefault();
    try {
      const f = new FormData(e.target);
      for (const [key, val] of f) if (typeof val === 'string') f.set(key, val.trim());
      const result = onModalSubmit?.(f);
      if (result !== false) {
        document.querySelector('#modal').close();
        render();
      }
    } catch (err) {
      document.querySelector('#modal-error').textContent = err.message;
    }
  }
  if (e.target.id === 'receive-form') {
    e.preventDefault();
    try {
      receive(e.target);
    } catch (err) {
      document.querySelector('#receive-error').textContent = err.message;
    }
  }
});

// Permite usar los botones Atrás y Adelante del navegador entre pantallas.
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1);
  if (next !== route) {
    route = routes[next] ? next : 'dashboard';
    query = '';
    filter = {};
    render();
  }
});

// Inicia la aplicación al terminar de cargar este archivo.
render();
