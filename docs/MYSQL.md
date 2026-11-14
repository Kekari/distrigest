# Ejecutar DistriGest con MySQL

La interfaz de GitHub Pages continúa siendo una demostración con datos locales. Para usar MySQL, inicia el servidor que incluye este repositorio y abre su dirección local.

## Requisitos

- Node.js 22 o superior y npm.
- MySQL con soporte JSON (se verificó con MySQL 5.7.44; el esquema utiliza InnoDB).
- Una cuenta MySQL con permisos para crear la base y sus tablas durante la instalación.

## Instalación en Windows

1. Abre una terminal dentro de la carpeta del proyecto.
2. Instala las dependencias:

   ```powershell
   npm ci
   ```

3. Copia la configuración de ejemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Abre `.env` y escribe el usuario, contraseña y puerto de tu instalación MySQL. La base predeterminada se llama `distrigest`. No uses el nombre de otra base que ya contenga información. El archivo `.env` está excluido de Git.
5. Inicia tu servidor MySQL mediante su servicio o herramienta de administración.
6. Crea las tablas y carga los ejemplos:

   ```powershell
   npm run db:init
   ```

   Esta operación conserva los datos si la base ya fue inicializada. No es un sistema de migraciones para futuras versiones del esquema.

7. Inicia la aplicación:

   ```powershell
   npm start
   ```

8. Abre **http://127.0.0.1:3000/**. El pie de página indicará **Guardado en MySQL**.

Para detener la aplicación, pulsa `Ctrl+C` en la terminal. Los datos permanecen en MySQL. Las copias antiguas de localStorage no se importan automáticamente: la base empieza con datos ficticios para evitar mezclar información de distintos navegadores.

## Archivos para explicar al profesor

| Archivo | Función |
| --- | --- |
| `database/schema.sql` | Define las tablas y claves foráneas. |
| `server/connection.js` | Lee las credenciales y abre conexiones MySQL. |
| `server/models.js` | Define la correspondencia entre tablas y campos del prototipo. |
| `server/repository.js` | Consulta y guarda datos mediante consultas parametrizadas y transacciones. |
| `server/validation.js` | Revisa cantidades, fechas, relaciones y campos antes de guardar. |
| `server/app.js` | Expone la API y entrega los archivos públicos de la interfaz. |
| `server/index.js` | Inicia el servidor local. |
| `server/setup.js` | Crea las tablas y carga los datos iniciales una sola vez. |
| `js/datos/persistencia.js` | Conecta la interfaz con la API o con el almacenamiento de demostración. |
| `config.js` | Configuración de demostración; el servidor entrega el modo MySQL en esta misma ruta. |

## Modelo de datos

- `clientes`: datos comerciales y vendedor asignado.
- `proveedores`: contacto y condiciones comerciales.
- `inventario`: existencias por producto, lote y ubicación.
- `ordenes_compra`: pedido y saldo recibido; referencia a proveedores.
- `recepciones`: registro de recepciones; referencia a órdenes de compra.
- `ventas`: ventas históricas y proporción cobrada; referencia a clientes.
- `documentos`: documentos simulados; referencia a clientes y detalle de líneas en JSON.
- `configuracion`: tasa de comisión y revisión de los datos.

La comisión se calcula sobre las ventas guardadas; no se duplica en otra tabla. Las alertas se calculan a partir del inventario. Los nombres de productos y vendedores conservan la estructura del prototipo; una versión mayor podría normalizarlos en tablas propias.

## API y concurrencia

- `GET /api/state`: devuelve `{ state, revision }`.
- `PUT /api/state`: valida y guarda `{ state, revision }`; requiere la cabecera `X-DistriGest: 1`.
- Una revisión antigua recibe HTTP 409. Recarga la página para consultar los cambios de la otra pestaña.
- Si la base falla, no se muestra un guardado exitoso ni se cambia silenciosamente a localStorage.

Para simplificar el proyecto académico, el guardado sincroniza el conjunto de datos dentro de una transacción. No se recomienda este mecanismo para grandes volúmenes; en esa etapa conviene implementar operaciones por recurso, paginación y movimientos de inventario.

## Alcance del servidor

El servidor escucha solo en `127.0.0.1`. No incorpora usuarios ni permisos y está preparado para una presentación local. Para publicarlo como sistema compartido se deberán agregar autenticación, autorización y alojamiento de backend y MySQL. La cabecera de la API verifica el origen de las operaciones del navegador, pero no sustituye una sesión de usuario.

Las credenciales no se envían al navegador. El servidor no entrega `.env`, archivos SQL ni su propio código mediante sus rutas públicas. GitHub Pages conserva el prototipo estático y no ejecuta MySQL ni Node.js. Los documentos tributarios siguen siendo simulados, y emitirlos no modifica las ventas históricas.

El botón de restaurar datos reemplaza también la información de MySQL cuando ese modo está activo; solicita confirmación en pantalla.

## Pruebas

```powershell
npm test
```

Incluye pruebas unitarias, API, validación, conflictos y selección de persistencia. La prueba de MySQL real queda omitida por defecto para no tocar bases del usuario.

Para ejecutarla, crea primero una base exclusiva terminada en `_pruebas`:

```powershell
$env:DB_NAME = 'distrigest_pruebas'
npm run db:init
$env:MYSQL_TEST = '1'
npm test
Remove-Item Env:MYSQL_TEST
Remove-Item Env:DB_NAME
```

No ejecutes pruebas de base mientras otra persona esté usando esa misma base. La prueba restaura los datos al finalizar, pero debe utilizar siempre una base exclusiva.
