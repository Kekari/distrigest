# DistriGest: catálogo de productos, lotes e inventario

## Objetivo

Separar los datos maestros del producto, el lote y la existencia física para que un producto pueda tener varios lotes y cada lote se ubique en una o más ubicaciones.

## Diseño aprobado

- `products`: `id`, `sku` único, `name`, `category`.
- `lots`: `id`, `product_id` como clave foránea a `products`, `expiry`, `position`.
- `inventory`: `id`, `lot_id` como clave foránea a `lots`, `location`, `quantity`.

La cantidad pertenece a la existencia de inventario porque varía por lote y ubicación. La interfaz calculará el total por producto sumando esas existencias.

## Relaciones y comportamiento

- Un producto puede tener muchos lotes.
- Un lote pertenece a un producto y puede existir en varias ubicaciones.
- Cada fila de inventario registra una cantidad para una combinación de lote y ubicación.
- El SKU identifica al producto y se valida como único.
- Las órdenes de compra y las ventas referencian el producto mediante `product_id`; las pantallas muestran nombre y SKU mediante la relación.
- Las líneas de documentos conservan una copia del nombre del producto y los importes de emisión para preservar el detalle histórico.
- La posición del lote describe la posición del lote indicada por el usuario; la ubicación de la existencia identifica la bodega/localización física. Si más adelante posición y ubicación representan el mismo dato operativo, se pueden unificar.
- Se mantiene intacta la relación de vendedor asignado al cliente. Las ventas siguen asociadas al cliente y conservan el vendedor registrado para esa venta.

## Migración de información

La actualización debe conservar las bases de datos ya inicializadas. Se agregará una migración repetible y transaccional que:

1. Cree el catálogo único a partir de los productos que ya aparecen en inventario, órdenes y ventas, usando el SKU existente cuando está disponible.
2. Detenga la migración y reporte duplicados o productos ambiguos en vez de adivinar una combinación.
3. Cree lotes desde los registros de inventario, preservando sus fechas de vencimiento.
4. Traslade cantidades y ubicaciones a filas de inventario relacionadas con los nuevos lotes.
5. Agregue `product_id` a órdenes y ventas y complete las claves foráneas.
6. Verifique conteos y sumas antes de retirar las columnas de texto redundantes.

Los datos de demostración nuevos se inicializarán con el modelo relacional. GitHub Pages continuará usando el modo local del prototipo.

## Compatibilidad y verificación

Las funciones de inventario, recepción, alertas, búsquedas, filtros de reportes y documentos deberán seguir mostrando los mismos nombres, lotes, vencimientos, ubicaciones y cantidades. Se cubrirán la carga inicial, migración desde el esquema anterior, recepción parcial, consultas de stock por lote/ubicación, filtros y ventas/documentos con datos de ejemplo. Una copia de la base deberá verificarse antes de aplicar la migración a cualquier instalación del usuario.

## Fuera de alcance

- Cambiar el backend JavaScript por Django.
- Alterar la relación de vendedores con clientes.
- Publicar MySQL en un servidor o habilitar acceso multiusuario remoto.
- Eliminar o fusionar datos existentes automáticamente cuando haya ambigüedades.
