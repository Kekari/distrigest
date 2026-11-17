# Catálogo de productos y lotes: Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para implementar el plan tarea por tarea.

**Goal:** Normalizar productos, lotes y existencias en tablas separadas, manteniendo el prototipo web y los datos actuales.

**Architecture:** `products` será el catálogo maestro. `lots` tendrá una clave foránea a productos y la fecha de vencimiento/posición. `inventory` enlazará lote con ubicación y cantidad. Órdenes y ventas guardarán `product_id`; la interfaz resolverá los nombres con el catálogo. La guía de diseño contiene el procedimiento de migración segura.

**Tech Stack:** JavaScript ES modules, Node.js, Express, mysql2, MySQL/InnoDB.

**Spec:** `docs/superpowers/specs/2026-11-17-catalogo-productos-lotes-design.md`

## Restricciones globales

- Mantener JavaScript estándar en los archivos de aplicación.
- Mantener GitHub Pages como demostración estática con localStorage.
- No exponer credenciales MySQL en el navegador o GitHub.
- No cambiar el vendedor asignado al cliente ni el vendedor histórico de las ventas.
- No borrar ni transformar una base existente hasta validar backup, conteos, relaciones y sumas.
- Mantener nombre y SKU legibles en la interfaz.

---

### Tarea 1: Asegurar la transformación de datos

**Archivos:** modificar `js/datos/datos-iniciales.js`; agregar pruebas en `tests/`.

- [ ] Escribir pruebas de catálogo único, claves de lote, filas por ubicación y ventas/órdenes relacionadas.
- [ ] Ejecutar y comprobar que fallan con los datos actuales.
- [ ] Refactorizar los datos ficticios para incluir productos como catálogo y usar `product_id` en lotes, inventario, órdenes y ventas.
- [ ] Ejecutar las pruebas de datos y dominio.

### Tarea 2: Cambiar el esquema MySQL sin perder instalaciones

**Archivos:** `database/schema.sql`, nueva migración en `database/migrations/`, `server/setup.js`, `server/repository.js`, `server/models.js`.

- [ ] Definir productos, lotes e inventario con claves foráneas e índices únicos apropiados.
- [ ] Añadir una migración identificada y registrada que preserve datos existentes y no dependa de ejecutar el esquema antiguo primero.
- [ ] Rechazar duplicados o referencias ambiguas con instrucciones claras, sin elegir una coincidencia arbitrariamente.
- [ ] Actualizar lectura/escritura y sembrado para las relaciones nuevas.
- [ ] Escribir pruebas de migración desde el esquema anterior con snapshot de conteos y cantidades.
- [ ] Ejecutar prueba con MySQL temporal, revisar claves foráneas y confirmar que la migración repetida no duplica filas.

### Tarea 3: Adaptar el frontend

**Archivos:** `js/app.js`, `js/logica/calculos.js`, validación y pruebas.

- [ ] Usar el catálogo para opciones de productos y mostrar SKU/nombre en los módulos.
- [ ] Registrar recepciones y ajustar inventario usando IDs de producto/lote.
- [ ] Conservar el flujo de búsqueda, filtros, exportación, alertas y facturas.
- [ ] Comprobar que documentos históricos conservan descripción e importes originales.

### Tarea 4: Documentar, verificar y publicar

**Archivos:** `docs/MYSQL.md`, `docs/VERIFICACION-MYSQL.md`, `README.md`, ZIP del proyecto.

- [ ] Documentar respaldo, actualización de una instalación existente y esquema resultante.
- [ ] Probar migración, relaciones, flujos de frontend y modo GitHub Pages.
- [ ] Revisar SQL para consultas parametrizadas e integridad referencial.
- [ ] Actualizar el resumen de verificación y el paquete de código.
- [ ] Publicar el cambio en GitHub tras completar y revisar las pruebas.
