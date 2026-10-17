// Calendario visual que se utiliza en fechas y períodos.

import { MONTHS, monthDays, addDays, isSelectable } from '../logica/fechas.js';
const calendarIcon =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2"/></svg>';
const chevron = (direction) =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}"/></svg>`;
const localToday = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
const pretty = (value, mode) =>
  mode === 'month'
    ? `${MONTHS[Number(value.slice(5, 7)) - 1]} de ${value.slice(0, 4)}`
    : new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(value + 'T12:00:00Z'));
const text = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

// Crea el botón que abre el calendario y el campo oculto que guarda la fecha.
export function datePicker({
  id,
  name,
  value = '',
  min = '',
  mode = 'day',
  label = 'Fecha de vencimiento',
  filter = false
}) {
  return `<div class="date-picker-field"><input type="hidden" name="${text(name)}" id="${text(id)}-value" value="${text(value)}" ${filter ? 'data-filter="month"' : ''}><button type="button" id="${text(id)}" class="date-trigger ${mode === 'month' ? 'date-trigger--month' : ''}" data-date-picker data-mode="${mode}" data-min="${min}" data-date-label="${text(label)}" aria-label="${text(label)}${value ? ': ' + text(pretty(value, mode)) : ': seleccionar fecha'}" aria-haspopup="dialog" aria-expanded="false" aria-controls="calendar-popover"><span class="date-trigger-icon">${calendarIcon}</span><span class="date-trigger-copy"><span class="date-trigger-title">${mode === 'month' ? 'PERÍODO DE CONSULTA' : value ? 'FECHA SELECCIONADA' : 'CALENDARIO DE VENCIMIENTO'}</span><span class="date-trigger-value ${value ? '' : 'is-placeholder'}">${value ? text(pretty(value, mode)) : 'Selecciona una fecha'}</span></span><span class="date-trigger-chevron">${chevron('right')}</span></button></div>`;
}
let active = null,
  viewYear = 0,
  viewMonth = 0;
const panel = document.createElement('div');
panel.id = 'calendar-popover';
panel.className = 'calendar-popover';
panel.setAttribute('popover', 'auto');
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-modal', 'false');
document.body.append(panel);

// Ubica el calendario junto al campo sin salirse de la pantalla.
function position() {
  if (!active) return;
  const r = active.getBoundingClientRect();
  const width = Math.min(344, window.innerWidth - 24);
  const height = Math.min(panel.scrollHeight, window.innerHeight - 24);
  panel.style.width = width + 'px';
  panel.style.left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12)) + 'px';
  panel.style.top =
    (r.bottom + 8 + height <= window.innerHeight
      ? r.bottom + 8
      : Math.max(12, r.top - height - 8)) + 'px';
}

// Lee la fecha que tiene seleccionada el campo actual.
function currentValue() {
  return document.getElementById(active.id + '-value')?.value || '';
}

// Dibuja los meses, los días y los accesos rápidos del calendario.
function paint() {
  const mode = active.dataset.mode,
    min = active.dataset.min,
    selected = currentValue(),
    now = localToday();
  panel.setAttribute(
    'aria-label',
    mode === 'month' ? 'Seleccionar período de consulta' : 'Seleccionar fecha de vencimiento'
  );
  const yearMin = min ? Number(min.slice(0, 4)) : viewYear - 10,
    yearMax = Math.max(viewYear + 5, Number(now.slice(0, 4)) + 12);
  const canPrev =
    mode === 'month' ||
    !min ||
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}` > min.slice(0, 7);
  panel.innerHTML = `<div class="calendar-intro"><span class="calendar-intro-icon">${calendarIcon}</span><div><h3>${mode === 'month' ? 'Tu período de consulta' : '¿Cuándo vence este lote?'}</h3><p>${mode === 'month' ? 'Elige el mes que quieres revisar' : 'Selecciona una fecha en el calendario'}</p></div><button type="button" class="calendar-close" data-cal-close aria-label="Cerrar calendario">×</button></div><div class="calendar-navigation"><button type="button" class="calendar-nav" data-cal-step="-1" aria-label="${mode === 'month' ? 'Año' : 'Mes'} anterior" ${canPrev ? '' : 'disabled'}>${chevron('left')}</button><div class="calendar-month-heading" aria-live="polite">${mode === 'day' ? `<select aria-label="Mes del calendario" data-cal-month>${MONTHS.map((m, i) => `<option value="${i}" ${i === viewMonth ? 'selected' : ''}>${m}</option>`).join('')}</select>` : ''}<select aria-label="Año del calendario" data-cal-year>${Array.from(
    { length: yearMax - yearMin + 1 },
    (_, i) => yearMin + i
  )
    .map((y) => `<option ${y === viewYear ? 'selected' : ''}>${y}</option>`)
    .join(
      ''
    )}</select></div><button type="button" class="calendar-nav" data-cal-step="1" aria-label="${mode === 'month' ? 'Año' : 'Mes'} siguiente">${chevron('right')}</button></div>${
    mode === 'month'
      ? `<div class="calendar-months">${MONTHS.map((m, i) => {
          const val = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
          return `<button type="button" class="calendar-month ${val === selected ? 'selected' : ''}" aria-pressed="${val === selected}" data-cal-value="${val}">${m.slice(0, 3)}<span>${viewYear}</span></button>`;
        }).join('')}</div>`
      : `<div class="calendar-weekdays" aria-hidden="true">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<span>${x}</span>`).join('')}</div><div class="calendar-days">${monthDays(
          viewYear,
          viewMonth
        )
          .map((value) =>
            value
              ? `<button type="button" class="calendar-day ${value === selected ? 'selected' : ''} ${value === now ? 'is-today' : ''}" aria-label="${pretty(value, 'day')}" aria-pressed="${value === selected}" ${value === now ? 'aria-current="date"' : ''} data-cal-value="${value}" ${isSelectable(value, min) ? '' : 'disabled'}>${Number(value.slice(-2))}</button>`
              : '<span aria-hidden="true"></span>'
          )
          .join('')}</div><div class="calendar-shortcuts"><span>ACCESOS RÁPIDOS</span><div>${[
          [0, 'Hoy'],
          [30, 'En 30 días'],
          [90, 'En 90 días']
        ]
          .map(
            ([n, l]) =>
              `<button type="button" data-cal-value="${addDays(now, n)}" ${isSelectable(addDays(now, n), min) ? '' : 'disabled'}>${l}</button>`
          )
          .join('')}</div></div>`
  }<div class="calendar-bottom"><span class="calendar-today-dot"></span>${mode === 'month' ? 'Selecciona un mes para aplicar el filtro' : 'Las fechas vencidas no están disponibles'}</div>`;
  position();
}

// Cierra el calendario y actualiza el estado del botón.
function close() {
  if (panel.matches(':popover-open')) panel.hidePopover();
  active?.setAttribute('aria-expanded', 'false');
}

// Guarda la fecha elegida y avisa al formulario o al filtro que cambió.
function choose(value) {
  const trigger = active,
    input = document.getElementById(trigger.id + '-value');
  input.value = value;
  trigger.querySelector('.date-trigger-value').textContent = pretty(value, trigger.dataset.mode);
  trigger.querySelector('.date-trigger-value').classList.remove('is-placeholder');
  trigger.querySelector('.date-trigger-title').textContent =
    trigger.dataset.mode === 'month' ? 'PERÍODO DE CONSULTA' : 'FECHA SELECCIONADA';
  trigger.setAttribute(
    'aria-label',
    trigger.dataset.dateLabel + ': ' + pretty(value, trigger.dataset.mode)
  );
  close();
  trigger.focus();
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// Abre el calendario y atiende los clics en días, meses y botones.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-date-picker]');
  if (trigger) {
    if (active === trigger && panel.matches(':popover-open')) {
      close();
      return;
    }
    close();
    active = trigger;
    const value = currentValue() || trigger.dataset.min || localToday();
    viewYear = Number(value.slice(0, 4));
    viewMonth = Number(value.slice(5, 7)) - 1;
    paint();
    panel.showPopover();
    active.setAttribute('aria-expanded', 'true');
    position();
    (
      panel.querySelector('.selected:not(:disabled)') ||
      panel.querySelector('.is-today:not(:disabled)') ||
      panel.querySelector('[data-cal-value]:not(:disabled)')
    )?.focus();
    return;
  }
  const action = e.target.closest('[data-cal-value],[data-cal-step],[data-cal-close]');
  if (!action) return;
  if (action.hasAttribute('data-cal-value')) choose(action.dataset.calValue);
  if (action.hasAttribute('data-cal-close')) {
    close();
    active?.focus();
  }
  if (action.hasAttribute('data-cal-step')) {
    if (active.dataset.mode === 'month') viewYear += Number(action.dataset.calStep);
    else {
      const d = new Date(Date.UTC(viewYear, viewMonth + Number(action.dataset.calStep), 1));
      viewYear = d.getUTCFullYear();
      viewMonth = d.getUTCMonth();
    }
    const direction = action.dataset.calStep;
    paint();
    panel.querySelector(`[data-cal-step="${direction}"]`)?.focus();
  }
});

// Redibuja el calendario cuando se cambia el mes o el año.
panel.addEventListener('change', (e) => {
  if (e.target.hasAttribute('data-cal-month')) viewMonth = Number(e.target.value);
  if (e.target.hasAttribute('data-cal-year')) viewYear = Number(e.target.value);
  const selector = e.target.hasAttribute('data-cal-month') ? '[data-cal-month]' : '[data-cal-year]';
  paint();
  panel.querySelector(selector)?.focus();
});

// Permite desplazarse por los días con las flechas del teclado.
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    close();
    active?.focus();
    return;
  }
  const value = e.target.dataset.calValue;
  if (!value || active.dataset.mode !== 'day') return;
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  if (step) {
    e.preventDefault();
    const target = addDays(value, step);
    if (!isSelectable(target, active.dataset.min)) return;
    viewYear = Number(target.slice(0, 4));
    viewMonth = Number(target.slice(5, 7)) - 1;
    paint();
    panel.querySelector(`[data-cal-value="${target}"]`)?.focus();
  }
});

// Mantiene sincronizado el estado abierto o cerrado del calendario.
panel.addEventListener('toggle', (e) => {
  if (e.newState === 'closed') active?.setAttribute('aria-expanded', 'false');
});

// Permite cerrar el calendario con la tecla Escape.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && panel.matches(':popover-open')) {
    close();
    active?.focus();
  }
});

// Reubica el calendario si cambia el tamaño de la ventana.
window.addEventListener('resize', () => {
  if (panel.matches(':popover-open')) position();
});

// Cierra el calendario cuando se desplaza la página.
document.addEventListener(
  'scroll',
  (e) => {
    if (panel.contains(e.target)) return;
    if (panel.matches(':popover-open')) close();
  },
  true
);
