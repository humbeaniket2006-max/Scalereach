/**
 * Thin wrapper over the native <dialog> element:
 * Escape closes it, [data-close] buttons close it, and a click on the backdrop closes it.
 */
export function setupDialog(dialog) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });
  return dialog;
}

export function openDialog(dialog, { focus } = {}) {
  clearError(dialog);
  dialog.showModal();
  (focus ?? dialog.querySelector('input, select, button:not([data-close])'))?.focus();
}

export function showError(dialog, message) {
  const error = dialog.querySelector('.field__error');
  error.textContent = message;
  error.hidden = false;
}

export function clearError(dialog) {
  const error = dialog.querySelector('.field__error');
  error.textContent = '';
  error.hidden = true;
}
