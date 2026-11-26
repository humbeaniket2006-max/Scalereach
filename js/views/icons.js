import { html } from '../utils/dom.js';

/** Inline stroke icons, kept in one place so markup stays readable. */
export const icons = {
  check: html`<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>`,
  copy: html`<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>`,
  plus: html`<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  close: html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  cross: html`<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>`,
  retry: html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/></svg>`,
  download: html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>`,
  playSmall: html`<svg class="icon icon--sm icon--fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
  play: html`<svg class="icon player__icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
  pause: html`<svg class="icon player__icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`,
};
