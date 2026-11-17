import { readFile } from 'node:fs/promises';
import { createPool, databaseName } from './connection.js';
import { createRepository } from './repository.js';
import { migrateCatalog } from './migrations/001-catalogo-productos-lotes.js';
import { createInitialData } from '../js/datos/datos-iniciales.js';

// Crea las tablas y carga ejemplos solo si la base nunca fue inicializada.
const admin = createPool(false);
let pool;
try {
  await admin.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName()}\` CHARACTER SET utf8mb4`);
  pool = createPool();
  const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  for (const statement of sql
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean))
    await pool.query(statement);
  const migrated = await migrateCatalog(pool);
  if (migrated) console.log('Inventario, lotes, órdenes y ventas normalizados.');
  const [[settings]] = await pool.execute('SELECT revision FROM configuracion WHERE id=1');
  if (settings.revision === 0) {
    await createRepository(pool).write(createInitialData(), 0);
    console.log('Tablas creadas y datos ficticios cargados.');
  } else console.log('La base ya tiene datos. Se conservaron sin cambios.');
} catch (error) {
  console.error('No se pudo inicializar MySQL:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await admin.end();
  if (pool) await pool.end();
}
