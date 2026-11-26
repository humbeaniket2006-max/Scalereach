import { HIGH_SCORE, clipReason, viralScore } from '../data.js';
import { html } from '../utils/dom.js';
import { formatTimecode } from '../utils/format.js';
import { icons } from './icons.js';

export const TOP_PICKS = 4;

export function captionMarkup(caption) {
  return html`${caption.pre} ${caption.highlight ? html`<mark>${caption.highlight}</mark>` : ''} ${caption.post}`;
}

const byScore = (a, b) => viralScore(b) - viralScore(a);
const byTime = (a, b) => a.start - b.start;

function tile(clip, { isActive, featured }) {
  const score = viralScore(clip);
  const length = clip.end - clip.start;
  const classes = ['tile', featured && 'tile--featured', isActive && 'is-open', clip.selected && 'is-selected']
    .filter(Boolean)
    .join(' ');

  return html`
    <li class="${classes}">
      <button class="tile__open" type="button" data-action="select-clip" data-clip-id="${clip.id}"
        aria-label="Preview clip: ${clip.title}" ${isActive ? html`aria-current="true"` : ''}>
        <span class="thumb thumb--${clip.tone}" aria-hidden="true">
          <span class="thumb__caption">${captionMarkup(clip.caption)}</span>
          ${isActive ? html`<span class="tile__previewing">${icons.playSmall} Previewing</span>` : ''}
          <span class="thumb__duration num">${formatTimecode(length)}</span>
        </span>
        <span class="tile__body">
          <span class="tile__title">${clip.title}</span>
          ${featured ? html`<span class="tile__reason">${clipReason(clip)}</span>` : ''}
          <span class="tile__foot">
            <span class="tile__time">${formatTimecode(clip.start)}–${formatTimecode(clip.end)}</span>
          </span>
        </span>
      </button>
      <span class="tile__score num ${score >= HIGH_SCORE ? 'tile__score--high' : ''}"
        title="Viral score ${score} out of 100" aria-hidden="true">${score}</span>
      <button class="tile__check" type="button" data-action="toggle-clip" data-clip-id="${clip.id}"
        aria-pressed="${clip.selected}"
        aria-label="${clip.selected ? 'Remove from schedule' : 'Add to schedule'}: ${clip.title}"
        title="${clip.selected ? 'Remove from schedule' : 'Add to schedule'}">
        ${clip.selected ? icons.check : icons.plus}<span class="tile__check-label">${clip.selected ? 'Selected' : 'Select'}</span>
      </button>
    </li>`;
}

/**
 * Two tiers: the top picks (pre-selected, with a reason) and the rest.
 * The creator's decision is mostly made for them; they only confirm.
 */
export function renderClipSections(job, { sort }, activeClipId) {
  const ranked = [...job.clips].sort(byScore);
  const picks = ranked.slice(0, TOP_PICKS);
  const rest = ranked.slice(TOP_PICKS).sort(sort === 'time' ? byTime : byScore);

  return html`
    <section class="clip-section" aria-labelledby="top-picks-title">
      <div class="section-head">
        <h2 class="section-head__title" id="top-picks-title">Top picks</h2>
        <p class="section-head__hint">We picked your 4 highest scores. Deselect any you'd skip.</p>
      </div>
      <ul class="clip-grid clip-grid--featured">
        ${picks.map((clip) => tile(clip, { isActive: clip.id === activeClipId, featured: true }))}
      </ul>
    </section>

    ${rest.length
      ? html`<section class="clip-section" aria-labelledby="more-title">
          <div class="section-head">
            <h2 class="section-head__title" id="more-title">More clips <span class="section-head__count num">${rest.length}</span></h2>
            <label class="sort">
              <span class="visually-hidden">Sort more clips by</span>
              <select class="select" data-action="set-sort">
                <option value="score" ${sort === 'score' ? 'selected' : ''}>Sort: Viral score</option>
                <option value="time" ${sort === 'time' ? 'selected' : ''}>Sort: Time in video</option>
              </select>
            </label>
          </div>
          <ul class="clip-grid">
            ${rest.map((clip) => tile(clip, { isActive: clip.id === activeClipId, featured: false }))}
          </ul>
        </section>`
      : ''}`;
}
