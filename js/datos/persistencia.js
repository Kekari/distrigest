// Selecciona MySQL cuando el servidor lo indica; GitHub Pages conserva el modo local.
export function createStorage({ api = null, request = globalThis.fetch, local = null } = {}) {
  let revision;
  async function send(options) {
    const response = await request(api + '/state', options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar en MySQL.');
    return result;
  }
  return {
    async load() {
      if (api) {
        const result = await send();
        revision = result.revision;
        return result.state;
      }
      return JSON.parse(local?.getItem('distrigest-demo-v1') || 'null');
    },
    async save(state) {
      if (api) {
        const result = await send({
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-distrigest': '1' },
          body: JSON.stringify({ state, revision })
        });
        revision = result.revision;
      } else local?.setItem('distrigest-demo-v1', JSON.stringify(state));
    }
  };
}
