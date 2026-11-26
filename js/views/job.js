import { RENDER_STEP, STEPS } from '../data.js';
import { selectedClips } from '../selectors.js';
import { html } from '../utils/dom.js';
import { formatTimecode, pluralize } from '../utils/format.js';
import { renderClipSections } from './clips.js';
import { icons } from './icons.js';
import { STATUS_LABEL, statusLine } from './sidebar.js';

function scheduleLabel(count) {
  return count === 0 ? 'Select clips to schedule' : `Schedule ${pluralize(count, 'clip')}`;
}

function doneHeader(job, ui) {
  const count = selectedClips(job).length;
  const selectedLength = selectedClips(job).reduce((sum, clip) => sum + clip.end - clip.start, 0);
  const exporting = ui.exporting?.jobId === job.id ? ui.exporting : null;

  return html`
    <header class="job-header">
      <div class="job-header__text">
        <p class="job-header__eyebrow"><span class="status-dot status-dot--done" aria-hidden="true"></span>Your clips are ready</p>
        <h1 class="job-header__title">${job.title}</h1>
        <p class="job-header__meta">
          <span>${pluralize(job.clips.length, 'clip')} from a ${formatTimecode(job.duration)} episode</span>
          <strong class="job-header__selected">${count} selected for scheduling${count ? ` · ${formatTimecode(selectedLength)} total` : ''}</strong>
        </p>
      </div>
      <div class="job-header__actions">
        <button class="button button--large" type="button" data-action="export" ${count === 0 || exporting ? 'disabled' : ''}
          ${exporting ? html`aria-busy="true"` : ''}>
          ${icons.download} ${exporting ? `Downloading ${exporting.done} of ${exporting.total}…` : (count ? `Download ${pluralize(count, 'clip')}` : 'Download')}
        </button>
        <button class="button button--primary button--large" type="button" data-action="open-schedule"
          ${count === 0 ? 'disabled' : ''}>
          ${scheduleLabel(count)}
        </button>
      </div>
    </header>`;
}

function statusHeader(job) {
  return html`
    <header class="job-header">
      <div class="job-header__text">
        <p class="job-header__eyebrow job-header__eyebrow--${job.status}">${STATUS_LABEL[job.status]}</p>
        <h1 class="job-header__title">${job.title}</h1>
        <p class="job-header__meta">${formatTimecode(job.duration)} episode · ${statusLine(job)}</p>
      </div>
    </header>`;
}

function stepState(job, index) {
  if (job.status === 'failed' && index === job.failedStep) return 'failed';
  if (index < job.step) return 'done';
  if (index === job.step && job.status === 'processing') return 'current';
  return 'pending';
}

function stepDetail(job, index, state) {
  if (state === 'failed') return `Attempt ${job.attempt}`;
  if (state === 'current' && index === RENDER_STEP) return `${job.renderDone} of ${job.renderTotal} clips`;
  if (state === 'current') return 'In progress';
  if (state === 'pending' && job.status === 'queued' && index === job.step && job.attempt > 1) return 'Resumes here';
  return '';
}

function steps(job) {
  return html`
    <ol class="steps" aria-label="Progress">
      ${STEPS.map((label, index) => {
        const state = stepState(job, index);
        const icon = state === 'done' ? icons.check : state === 'failed' ? icons.cross : '';
        return html`
          <li class="step step--${state}">
            <span class="step__icon" aria-hidden="true">${icon}</span>
            <span class="step__label">${label}<span class="visually-hidden">, ${state}</span></span>
            <span class="step__detail">${stepDetail(job, index, state)}</span>
          </li>`;
      })}
    </ol>`;
}

function supportLine(job) {
  return html`
    <p class="support-line">
      Need help? Quote reference
      <button class="chip-button num" type="button" data-action="copy-job-id" data-job-id="${job.id}"
        aria-label="Copy reference ${job.id}">${job.id} ${icons.copy}</button>
    </p>`;
}

function statusPanel(job, state) {
  const running = state.jobs.find((other) => other.status === 'processing');

  if (job.status === 'failed') {
    const step = STEPS[job.failedStep].toLowerCase();
    return html`
      <section class="progress-panel" aria-label="Failed">
        ${steps(job)}
        <div class="error-box">
          <p class="error-box__title">We couldn't finish the ${step}</p>
          <p>${job.error} Your video is saved, so retrying picks up from the ${step} without uploading again.</p>
          <div>
            <button class="button button--primary" type="button" data-action="retry-job" data-job-id="${job.id}">
              ${icons.retry} Retry
            </button>
          </div>
        </div>
        ${supportLine(job)}
      </section>`;
  }

  const note = job.status === 'processing'
    ? 'You can close this tab. We keep working and email you when your clips are ready.'
    : running && running.id !== job.id
      ? `Starts automatically after “${running.title}” finishes.`
      : 'Starting now.';

  return html`
    <section class="progress-panel" aria-label="${STATUS_LABEL[job.status]}">
      ${steps(job)}
      <p class="progress-panel__note">${note}</p>
      ${supportLine(job)}
    </section>`;
}

export function renderMain(state, job, ui) {
  if (job.status !== 'done') {
    return html`${statusHeader(job)}${statusPanel(job, state)}`;
  }
  return html`${doneHeader(job, ui)}${renderClipSections(job, state, state.activeClipId)}`;
}
