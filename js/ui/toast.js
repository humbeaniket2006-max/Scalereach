import { html } from '../utils/dom.js';
import { icons } from '../views/icons.js';

const DEFAULT_TIMEOUT = 4500;
const MAX_VISIBLE = 1;
const region = () => document.getElementById('toasts');

/** Show a short message. Returns a function that removes it early. */
export function showToast(message, { timeout = DEFAULT_TIMEOUT } = {}) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = String(html`
    <p class="toast__message">${message}</p>
    <button class="icon-button" type="button" aria-label="Dismiss notification">${icons.close}</button>`);

  const remove = () => toast.remove();
  toast.querySelector('button').addEventListener('click', remove);
  region().append(toast);
  while (region().children.length > MAX_VISIBLE) region().firstElementChild.remove();

  if (timeout) setTimeout(remove, timeout);
  return remove;
}
