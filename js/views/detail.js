import { HIGH_SCORE, SCORE_WEIGHTS, clipReason, viralScore } from '../data.js';
import { html } from '../utils/dom.js';
import { formatTimecode } from '../utils/format.js';
import { captionMarkup } from './clips.js';
import { icons } from './icons.js';

const SCORE_PARTS = [
  ['hook', 'Hook', 'How fast it grabs attention'],
  ['pacing', 'Pacing', 'No pauses or filler'],
  ['engagement', 'Engagement', 'Likely to be watched to the end'],
];

function transcriptFor(clip) {
  if (clip.transcript) return clip.transcript;
  const caption = [clip.caption.pre, clip.caption.highlight, clip.caption.post].filter(Boolean).join(' ');
  return [[0, `${clip.title}.`], [Math.round((clip.end - clip.start) / 2), `${caption[0].toUpperCase()}${caption.slice(1)}.`]];
}

function rankOf(job, clip) {
  return [...job.clips].sort((a, b) => viralScore(b) - viralScore(a)).findIndex((c) => c.id === clip.id) + 1;
}

/** Where the clip was cut from in the full episode. */
function sourcePosition(job, clip) {
  const left = ((clip.start / job.duration) * 100).toFixed(2);
  const width = (((clip.end - clip.start) / job.duration) * 100).toFixed(2);
  return html`
    <div class="source">
      <div class="source__track" aria-hidden="true"><span style="left: ${left}%; width: ${width}%"></span></div>
      <p class="source__label num">${formatTimecode(clip.start)} – ${formatTimecode(clip.end)} of ${formatTimecode(job.duration)}</p>
    </div>`;
}

export function renderDetail(job, clip) {
  if (job?.status !== 'done' || !clip) return html``;

  const score = viralScore(clip);
  const length = clip.end - clip.start;

  return html`
    <div class="detail__eyebrow">
      <span class="detail__label">Now previewing</span>
      <span class="detail__position num">#${rankOf(job, clip)} of ${job.clips.length} by score</span>
    </div>

    <div class="player thumb thumb--${clip.tone}" data-player style="--clip-length: ${length}s">
      <span class="thumb__caption">${captionMarkup(clip.caption)}</span>
      <button class="player__toggle" type="button" data-action="toggle-play" aria-label="Play clip" aria-pressed="false">
        ${icons.play}${icons.pause}
      </button>
      <span class="thumb__duration num">${formatTimecode(length)}</span>
      <span class="player__progress" aria-hidden="true"><span class="player__bar"></span></span>
    </div>

    <div class="detail__heading">
      <h2 class="detail__title">${clip.title}</h2>
      ${sourcePosition(job, clip)}
    </div>

    <section class="score-card ${score >= HIGH_SCORE ? 'score-card--high' : ''}" aria-labelledby="score-title">
      <div class="score-card__top">
        <div>
          <h3 class="score-card__label" id="score-title">Viral score</h3>
          ${rankOf(job, clip) === 1 ? html`<p class="score-card__rank">Highest in this episode</p>` : ''}
        </div>
        <p class="score-card__value num">${score}<span>/100</span></p>
      </div>
      <p class="score-card__reason">${clipReason(clip)}</p>
      <dl class="score">
        ${SCORE_PARTS.map(([key, label, hint]) => html`
          <div class="score__row" title="${hint}. Counts for ${Math.round(SCORE_WEIGHTS[key] * 100)}% of the score.">
            <dt>${label}</dt>
            <dd class="score__meter"><span style="width: ${clip[key]}%"></span></dd>
            <dd class="score__number num">${clip[key]}</dd>
          </div>`)}
      </dl>
    </section>

    <div class="detail__actions">
      <button class="button ${clip.selected ? '' : 'button--soft'}" type="button"
        data-action="toggle-clip" data-clip-id="${clip.id}" aria-pressed="${clip.selected}">
        ${clip.selected ? html`${icons.check} In schedule · Remove` : html`${icons.plus} Add to schedule`}
      </button>
      <button class="button" type="button" data-action="open-edit" data-clip-id="${clip.id}">Edit</button>
      <button class="button" type="button" data-action="download-clip" data-clip-id="${clip.id}">${icons.download} Download</button>
    </div>

    <section class="panel-section" aria-labelledby="transcript-title">
      <h3 class="section-title" id="transcript-title">What's said</h3>
      <ol class="transcript">
        ${transcriptFor(clip).map(([offset, line]) => html`
          <li class="transcript__line">
            <span class="transcript__time num">${formatTimecode(clip.start + offset)}</span>
            <span>${line}</span>
          </li>`)}
      </ol>
    </section>

    <p class="detail__formats">Vertical 1080×1920 with captions · ready for TikTok, Reels and Shorts</p>`;
}
