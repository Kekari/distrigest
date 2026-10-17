# DistriGest

Prototipo web académico de gestión comercial e inventario para DistriSur Araucanía SpA, con diseño Corporate.

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

Con Node.js: `node --test tests/*.test.mjs`.

## Publicación

GitHub Pages publica la rama `main` desde la raíz del repositorio. Al actualizar los archivos en esa rama, GitHub vuelve a publicar el sitio.

## Alcance

No hay backend ni autenticación real. La facturación usa un proveedor simulado. El registro de documentos no cambia las ventas históricas. Las órdenes de compra son datos previos para explorar la recepción. Se pueden restaurar los datos iniciales desde Acerca del prototipo.
