// Listas desplegables que permiten buscar escribiendo un nombre.

import { matchingChoices } from '../logica/busquedas.js';
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const searchIcon =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const downIcon =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const checkIcon =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';

// Define los textos que corresponden a vendedores, clientes, productos y zonas.
const filterCopy = (name) =>
  ({
    seller: {
      singular: 'vendedor',
      plural: 'Vendedores',
      article: 'del',
      found: 'encontrado',
      foundPlural: 'encontrados'
    },
    client: {
      singular: 'cliente',
      plural: 'Clientes',
      article: 'del',
      found: 'encontrado',
      foundPlural: 'encontrados'
    },
    product: {
      singular: 'producto',
      plural: 'Productos',
      article: 'del',
      found: 'encontrado',
      foundPlural: 'encontrados'
    },
    zone: {
      singular: 'zona',
      plural: 'Zonas',
      article: 'de la',
      found: 'encontrada',
      foundPlural: 'encontradas'
    }
  })[name];

// Crea el filtro con su lista de opciones y el botón para abrir el buscador.
export function searchSelect(name, label, values, selected = '') {
  const choices = values.map((v) =>
    typeof v === 'string' ? { value: v, label: v } : { value: v.id, label: v.name }
  );
  const current = choices.find((v) => v.value === selected);
  return `<div class="search-select"><select hidden id="filter-source-${name}" data-filter="${name}" aria-label="${label}"><option value="">${esc(label)}</option>${choices.map((v) => `<option value="${esc(v.value)}" ${v.value === selected ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select><button type="button" class="search-select-trigger ${current ? 'has-selection' : ''}" data-search-select="${name}" aria-label="Filtrar por ${filterCopy(name).singular}: ${esc(current?.label || label)}" aria-expanded="false" aria-haspopup="dialog" aria-controls="search-select-popover"><span class="search-select-label">${esc(current?.label || label)}</span>${downIcon}</button></div>`;
}
let active = null,
  source = null,
  options = [],
  visible = [],
  activeIndex = 0;
const panel = document.createElement('div');
panel.id = 'search-select-popover';
panel.className = 'search-select-popover';
panel.setAttribute('popover', 'auto');
panel.setAttribute('role', 'dialog');
document.body.append(panel);

// Ubica la lista debajo del filtro y la mantiene dentro de la pantalla.
function position() {
  if (!active) return;
  const rect = active.getBoundingClientRect();
  const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 24);
  panel.style.width = width + 'px';
  panel.style.left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)) + 'px';
  const height = Math.min(panel.scrollHeight, window.innerHeight - 24);
  panel.style.top =
    (rect.bottom + 7 + height <= window.innerHeight
      ? rect.bottom + 7
      : Math.max(12, rect.top - height - 7)) + 'px';
}

// Cierra la lista y, si se solicita, devuelve el foco al botón.
function close(focus = false) {
  if (panel.matches(':popover-open')) panel.hidePopover();
  active?.setAttribute('aria-expanded', 'false');
  if (focus) active?.focus();
}

// Resalta una opción cuando se navega con las flechas del teclado.
function focusOption(index) {
  const elements = panel.querySelectorAll('[data-search-option]');
  if (!elements.length) return;
  activeIndex = (index + elements.length) % elements.length;
  elements.forEach((el, i) => el.classList.toggle('is-highlighted', i === activeIndex));
  const input = panel.querySelector('input');
  input.setAttribute('aria-activedescendant', elements[activeIndex].id);
  elements[activeIndex].scrollIntoView({ block: 'nearest' });
}

// Muestra las coincidencias y conserva la opción Todos para quitar el filtro.
function list(query = '') {
  const matches = matchingChoices(options.slice(1), query);
  visible = [options[0], ...matches];
  const copy = filterCopy(active.dataset.searchSelect);
  panel.querySelector('#search-select-list').innerHTML =
    visible
      .map(
        (v, i) =>
          `<div class="search-select-option ${i === 0 ? 'reset-option' : ''}" id="search-choice-${i}" role="option" aria-selected="${source.value === v.value}" data-search-option="${i}"><span class="search-option-avatar ${i === 0 ? 'all' : ''}">${
            i === 0
              ? '↺'
              : esc(
                  v.label
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                )
          }</span><span>${esc(v.label)}</span>${source.value === v.value ? `<span class="search-option-check">${checkIcon}</span>` : ''}</div>`
      )
      .join('') +
    (!matches.length
      ? '<div class="search-select-empty" role="status">Sin coincidencias.<br><span>Prueba con otra parte del nombre.</span></div>'
      : '');
  panel.querySelector('#search-select-count').textContent =
    `${matches.length} ${matches.length === 1 ? copy.singular + ' ' + copy.found : copy.plural.toLocaleLowerCase('es') + ' ' + copy.foundPlural}`;
  panel.querySelector('input').removeAttribute('aria-activedescendant');
  activeIndex = 0;
  position();
}

// Aplica la opción elegida y actualiza el reporte.
function choose(index) {
  const option = visible[index];
  if (!option) return;
  const name = active.dataset.searchSelect;
  source.value = option.value;
  const control = source;
  close();
  control.dispatchEvent(new Event('change', { bubbles: true }));
  document.querySelector(`[data-search-select="${name}"]`)?.focus();
}

// Abre la lista o selecciona una opción al hacer clic.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-search-select]');
  if (trigger) {
    if (active === trigger && panel.matches(':popover-open')) {
      close(true);
      return;
    }
    close();
    active = trigger;
    source = document.getElementById('filter-source-' + trigger.dataset.searchSelect);
    options = [...source.options].map((o) => ({ value: o.value, label: o.textContent }));
    const copy = filterCopy(trigger.dataset.searchSelect);
    panel.setAttribute('aria-label', 'Buscar y seleccionar ' + copy.singular);
    panel.innerHTML = `<div class="search-select-search">${searchIcon}<input type="search" role="combobox" aria-label="Buscar ${copy.singular} por nombre" placeholder="Escribe el nombre ${copy.article} ${copy.singular}…" autocomplete="off" aria-autocomplete="list" aria-expanded="true" aria-controls="search-select-list"></div><div class="search-select-list" id="search-select-list" role="listbox" aria-label="${copy.plural}"></div><div class="search-select-footer"><span id="search-select-count" role="status" aria-live="polite"></span><span>↑ ↓ navegar · ↵ elegir</span></div>`;
    list();
    panel.showPopover();
    active.setAttribute('aria-expanded', 'true');
    position();
    panel.querySelector('input').focus();
    return;
  }
  const option = e.target.closest('[data-search-option]');
  if (option) choose(Number(option.dataset.searchOption));
});

// Vuelve a buscar coincidencias mientras se escribe el nombre.
panel.addEventListener('input', (e) => {
  if (e.target.matches('input')) list(e.target.value);
});

// Permite elegir con Enter, navegar con flechas y cerrar con Escape.
panel.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const hasActive = panel.querySelector('input').hasAttribute('aria-activedescendant');
    focusOption(
      hasActive
        ? activeIndex + (e.key === 'ArrowDown' ? 1 : -1)
        : e.key === 'ArrowDown'
          ? 0
          : visible.length - 1
    );
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (panel.querySelector('input').hasAttribute('aria-activedescendant')) choose(activeIndex);
    else if (visible.length === 2) choose(1);
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    close(true);
  }
});

// Actualiza el estado del botón al cerrar la lista.
panel.addEventListener('toggle', (e) => {
  if (e.newState === 'closed') active?.setAttribute('aria-expanded', 'false');
});

// Cierra la lista cuando se desplaza la página.
document.addEventListener(
  'scroll',
  (e) => {
    if (!panel.contains(e.target) && panel.matches(':popover-open')) close();
  },
  true
);

// Reubica la lista si cambia el tamaño de la ventana.
window.addEventListener('resize', () => {
  if (panel.matches(':popover-open')) position();
});
