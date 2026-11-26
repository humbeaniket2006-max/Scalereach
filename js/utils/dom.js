/**
 * Tiny, dependency-free templating.
 * `html` escapes every interpolated value unless it is itself a template
 * result, so user-editable text (clip titles, captions) can never inject markup.
 */

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function toHtml(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i < values.length) out += toHtml(values[i]);
  });
  return new SafeHtml(out);
}

/** Replace an element's markup only when it actually changed (keeps focus and running animations). */
export function patch(element, template) {
  const next = String(template);
  if (element.__html === next) return;

  const focusKey = focusSignature(element);
  element.innerHTML = next;
  element.__html = next;
  if (focusKey) element.querySelector(focusKey)?.focus({ preventScroll: true });
}

/** Selector that finds the focused control again after its region is re-rendered. */
function focusSignature(container) {
  const active = document.activeElement;
  if (!active || !container.contains(active) || !active.dataset.action) return null;
  const { action, jobId, clipId, filter } = active.dataset;
  let selector = `[data-action="${action}"]`;
  if (jobId) selector += `[data-job-id="${jobId}"]`;
  if (clipId) selector += `[data-clip-id="${clipId}"]`;
  if (filter) selector += `[data-filter="${filter}"]`;
  return selector;
}
