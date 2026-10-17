# DistriGest

Prototipo web académico de gestión comercial e inventario para DistriSur Araucanía SpA, con diseño Corporate.

La versión 2 renueva navegación, panel de operaciones, indicadores, tablas, formularios y controles, con tipografía Open Sans y Poppins y adaptación a móviles.

## Revisar el prototipo

https://kekari.github.io/distrigest/

Se puede navegar sin iniciar sesión. Todos los datos son de demostración. Los cambios se guardan únicamente en el navegador de cada persona y no se comparten entre revisores.

## Funcionalidades

- Clientes y proveedores: registro, edición y búsqueda.
- Recepción de mercadería contra órdenes de compra, con lotes, vencimientos y diferencias.
- Inventario por producto, lote, ubicación y bodega.
- Alertas de stock bajo y vencimiento.
- Facturas, guías y notas de crédito simuladas, sin validez tributaria.
- Reportes con filtros por vendedor, cliente, producto y zona, con búsqueda por nombre.
- Comisiones sobre ventas netas cobradas con tasa configurable.
- Calendario personalizado y exportación CSV.

## Ejecutar localmente

Desde esta carpeta, ejecutar `python -m http.server 4173` y abrir http://localhost:4173/.

No requiere instalar dependencias ni compilar. Usa HTML, CSS y módulos JavaScript.

## Pruebas

Con Node.js: `node --test tests/*.test.js`.

## Publicación

GitHub Pages publica la rama `main` desde la raíz del repositorio. Al actualizar los archivos en esa rama, GitHub vuelve a publicar el sitio.

## Alcance

No hay backend ni autenticación real. La facturación usa un proveedor simulado. El registro de documentos no cambia las ventas históricas. Las órdenes de compra son datos previos para explorar la recepción. Se pueden restaurar los datos iniciales desde Acerca del prototipo.

## Organización del código

```text
DistriGest/
├── index.html
├── styles.css
├── js/
│   ├── app.js
│   ├── datos/
│   │   └── datos-iniciales.js
│   ├── componentes/
│   │   ├── calendario.js
│   │   ├── filtro-buscador.js
│   │   └── iconos.js
│   └── logica/
│       ├── calculos.js
│       ├── inventario.js
│       ├── fechas.js
│       └── busquedas.js
├── tests/
├── package.json
└── README.md
```

### Por dónde empezar a leer

1. `index.html` carga el diseño y el archivo principal `js/app.js`.
2. `js/app.js` conecta las pantallas, menús, formularios y datos guardados en el navegador. Sus funciones tienen comentarios básicos en español.
3. `js/datos/datos-iniciales.js` contiene los clientes, proveedores, productos, ventas y documentos ficticios con los que comienza la demostración.
4. `js/logica/` contiene los cálculos y filtros, separados de la presentación.
5. `js/componentes/` contiene los controles que se repiten en varias pantallas.

### Qué hace cada archivo JavaScript

| Archivo | Responsabilidad |
| --- | --- |
| `js/app.js` | Construye las pantallas, escucha los botones y formularios y guarda los cambios en localStorage. |
| `js/datos/datos-iniciales.js` | Entrega los datos de ejemplo y permite restaurar el estado inicial. |
| `js/logica/calculos.js` | Calcula IVA, comisiones, recepción de mercadería y estados de vencimiento. |
| `js/logica/inventario.js` | Filtra y ordena los lotes y determina la etiqueta que aparece en cada pestaña. |
| `js/logica/fechas.js` | Prepara los días de un mes y suma días a una fecha. |
| `js/logica/busquedas.js` | Busca nombres sin distinguir tildes ni mayúsculas. |
| `js/componentes/calendario.js` | Dibuja y controla el calendario personalizado. |
| `js/componentes/filtro-buscador.js` | Dibuja las listas con búsqueda y aplica la opción seleccionada. |
| `js/componentes/iconos.js` | Contiene los dibujos SVG utilizados por la interfaz. |

### Otros archivos

- `styles.css`: diseño Corporate y adaptación a móviles.
- `tests/`: pruebas automáticas de la lógica. No son necesarias para navegar el sitio.
- `package.json`: indica a Node.js que los archivos .js usan módulos y permite ejecutar `npm test`. No instala bibliotecas.
- `.nojekyll`: evita que GitHub Pages transforme los archivos del prototipo.

Todos los archivos usan JavaScript estándar. `import` permite usar una función de otro archivo y `export` permite compartirla. El HTML usa `type="module"` para habilitar esta organización. No se usa un framework.

La carpeta temporal `tmp` del espacio de trabajo no forma parte de este repositorio ni de la aplicación.
