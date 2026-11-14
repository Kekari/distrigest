# Verificación de la integración MySQL

Fecha: 14 de noviembre de 2026.

- Node.js 24.18.0; MySQL Community Server 5.7.44 en una instancia temporal aislada.
- 22 pruebas aprobadas, sin omisiones al habilitar MYSQL_TEST=1.
- API: lectura, guardado, revisión obsoleta HTTP 409, validaciones, origen de solicitudes y archivos privados.
- MySQL real: recepción, documento, tasa de comisión, lectura desde otra conexión y rollback después de un error SQL.
- Inicialización repetida: conserva los datos ya existentes.
- Interfaz en Edge automatizado: edición de cliente y tasa conservadas después de recargar; creación de documento; validación y error de conexión conservan el formulario y permiten reintentar.
- Modo estático: continúa guardando en localStorage.
- Fallo de API al iniciar: muestra error y no habilita el guardado local silenciosamente.

Estas comprobaciones no certifican autenticación, permisos, concurrencia a gran escala ni emisión tributaria real, que no forman parte del alcance local.
