import { models } from './models.js';
import { validateState } from './validation.js';

// Todas las escrituras son atómicas. La revisión evita perder cambios entre pestañas.
export function createRepository(pool) {
  async function read() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Bloquea la configuración para leer tablas y revisión del mismo estado.
      const [[settings]] = await connection.execute(
        'SELECT revision,tasa FROM configuracion WHERE id=1 FOR UPDATE'
      );
      if (!settings || settings.revision === 0) throw new Error('Ejecuta npm run db:init.');
      const state = {};
      for (const model of models) {
        const [rows] = await connection.execute(
          `SELECT ${model.fields.map((f) => '`' + f + '`').join(',')} FROM ${model.table} ORDER BY posicion`
        );
        state[model.key] = rows.map((row) => {
          if (model.key === 'documents' && typeof row.lines === 'string')
            row.lines = JSON.parse(row.lines);
          if (model.key === 'documents' && row.reference === null) delete row.reference;
          if (model.key === 'receipts' && row.note === null) row.note = '';
          return row;
        });
      }
      state.rate = settings.tasa;
      await connection.commit();
      return { state, revision: settings.revision };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async function write(state, revision) {
    validateState(state);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[current]] = await connection.execute(
        'SELECT revision FROM configuracion WHERE id=1 FOR UPDATE'
      );
      if (!current || current.revision !== revision)
        throw Object.assign(
          new Error('Otra pestaña modificó los datos. Recarga la página antes de continuar.'),
          { status: 409 }
        );
      // Se eliminan primero las tablas dependientes para respetar las claves foráneas.
      for (const model of [...models].reverse())
        await connection.execute(`DELETE FROM ${model.table}`);
      for (const model of models) {
        const columns = [...model.fields, 'posicion'];
        const sql = `INSERT INTO ${model.table} (${columns.map((f) => '`' + f + '`').join(',')}) VALUES (${columns.map(() => '?').join(',')})`;
        for (const [index, row] of state[model.key].entries()) {
          const values = model.fields.map((f) =>
            f === 'lines' ? JSON.stringify(row[f]) : (row[f] ?? null)
          );
          await connection.execute(sql, [...values, index]);
        }
      }
      await connection.execute('UPDATE configuracion SET revision=revision+1,tasa=? WHERE id=1', [
        state.rate
      ]);
      await connection.commit();
      return revision + 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  return { read, write };
}
