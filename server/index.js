import { createPool } from './connection.js';
import { createRepository } from './repository.js';
import { createApp } from './app.js';
const pool = createPool();
try {
  const repository = createRepository(pool);
  await repository.read();
  const server = createApp(repository).listen(Number(process.env.PORT || 3000), '127.0.0.1', () =>
    console.log(`DistriGest con MySQL: http://127.0.0.1:${server.address().port}`)
  );
  const stop = () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('error', async (error) => {
    console.error('No se pudo abrir el servidor:', error.code);
    await pool.end();
    process.exitCode = 1;
  });
} catch (error) {
  console.error('No se pudo abrir MySQL. Revisa .env y ejecuta npm run db:init.', error.code || '');
  await pool.end();
  process.exitCode = 1;
}
