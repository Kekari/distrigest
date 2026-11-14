import express from 'express';
import { fileURLToPath } from 'node:url';
import { validateState } from './validation.js';
const root = fileURLToPath(new URL('../', import.meta.url));

// Sirve únicamente la interfaz y la API local; no expone credenciales ni código del servidor.
export function createApp(repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    if (!['127.0.0.1', 'localhost'].includes(req.hostname))
      return res.status(403).json({ error: 'Servidor de uso local.' });
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.path.startsWith('/api/') || req.path === '/config.js')
      res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/config.js', (req, res) => res.type('js').send("window.DISTRIGEST_API = '/api';"));
  app.get('/api/state', async (req, res) => res.json(await repository.read()));
  app.put(
    '/api/state',
    (req, res, next) => {
      if (
        req.get('x-distrigest') !== '1' ||
        (req.get('origin') && req.get('origin') !== `http://${req.get('host')}`)
      )
        return res.status(403).json({ error: 'Origen no autorizado.' });
      next();
    },
    express.json({ limit: '5mb' }),
    async (req, res) => {
      const { state, revision } = req.body || {};
      if (!Number.isSafeInteger(revision) || revision < 1)
        return res.status(400).json({ error: 'Revisión inválida.' });
      validateState(state);
      res.json({ revision: await repository.write(state, revision) });
    }
  );
  for (const name of ['index.html', 'styles.css'])
    app.get('/' + (name === 'index.html' ? '' : name), (req, res) => res.sendFile(root + name));
  app.get('/index.html', (req, res) => res.sendFile(root + 'index.html'));
  app.use('/js', express.static(root + 'js', { dotfiles: 'deny', index: false }));
  app.use((req, res) => res.status(404).json({ error: 'No encontrado.' }));
  app.use((err, req, res, next) => {
    const status = [400, 409, 413].includes(err.status) ? err.status : 503;
    const error =
      status === 503
        ? 'No se pudo acceder a MySQL. Revisa la conexión y vuelve a intentar.'
        : status === 413
          ? 'La solicitud supera el tamaño permitido.'
          : err.type === 'entity.parse.failed'
            ? 'JSON inválido.'
            : err.message;
    res.status(status).json({ error });
  });
  return app;
}
