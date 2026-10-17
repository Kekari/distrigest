// Búsqueda de nombres sin distinguir tildes ni mayúsculas.

// Quita tildes y espacios sobrantes y convierte a minúsculas para facilitar la búsqueda.
const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();

// Devuelve las opciones cuyo nombre contiene el texto escrito.
export function matchingChoices(choices, query) {
  const q = normalize(query);
  return choices.filter((item) => normalize(item.label).includes(q));
}
