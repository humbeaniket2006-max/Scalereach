import { RENDER_STEP, STEPS } from '../data.js';
import { html } from '../utils/dom.js';
import { pluralize } from '../utils/format.js';

export const STATUS_LABEL = {
  done: 'Done',
  processing: 'Processing',
  queued: 'Queued',
  failed: 'Failed',
};

const PROGRESS_LABEL = ['Uploading', 'Writing transcript', 'Finding best moments', 'Adding captions', 'Making clips'];

/** One short line per status. Shared with the job header. */
export function statusLine(job) {
  switch (job.status) {
    case 'done':
      return `Done · ${pluralize(job.clips.length, 'clip')}`;
    case 'processing':
      return job.step === RENDER_STEP
        ? `Rendering clip ${Math.min(job.renderDone + 1, job.renderTotal)} of ${job.renderTotal}`
        : `${PROGRESS_LABEL[job.step]}…`;
    case 'queued':
      return job.attempt > 1 ? `Queued · retry ${job.attempt - 1}` : 'Queued';
    case 'failed':
      return `${STEPS[job.failedStep]} failed`;
    default:
      return '';
  }
}

/** Overall progress, 0 to 100, for the thin bar under a processing job. */
export function jobProgress(job) {
  const perStep = 100 / STEPS.length;
  const withinRender = job.step === RENDER_STEP ? job.renderDone / job.renderTotal : 0;
  return Math.round(job.step * perStep + withinRender * perStep);
}

const GROUPS = [
  { title: 'Ready', statuses: ['done'] },
  { title: 'In progress', statuses: ['processing', 'queued'] },
  { title: 'Needs attention', statuses: ['failed'] },
];

const toneFor = (job) => [...job.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 6;

function jobItem(job, isActive) {
  return html`
    <li class="job job--${job.status} ${isActive ? 'is-active' : ''}">
      <button class="job__open" type="button" data-action="open-job" data-job-id="${job.id}"
        ${isActive ? html`aria-current="true"` : ''}>
        <span class="job__thumb thumb--${toneFor(job)}" aria-hidden="true"></span>
        <span class="job__text">
        <span class="job__title">${job.title}</span>
        <span class="job__meta">
          <span class="status-dot status-dot--${job.status}" aria-hidden="true"></span>
          <span class="visually-hidden">${STATUS_LABEL[job.status]}:</span>
          ${statusLine(job)}
        </span>
        ${job.status === 'processing'
          ? html`<span class="job__progress" aria-hidden="true"><span class="job__progress-bar" style="width: ${jobProgress(job)}%"></span></span>`
          : ''}
        </span>
      </button>
      ${job.status === 'failed'
        ? html`<button class="button button--small" type="button" data-action="retry-job" data-job-id="${job.id}"
            aria-label="Retry ${job.title}">Retry</button>`
        : ''}
    </li>`;
}

export function renderJobList(state) {
  return html`${GROUPS.map(({ title, statuses }) => {
    const jobs = state.jobs.filter((job) => statuses.includes(job.status));
    if (jobs.length === 0) return '';
    return html`
      <section class="job-group">
        <h3 class="job-group__title">${title} <span class="job-group__count">${jobs.length}</span></h3>
        <ul class="job-list">${jobs.map((job) => jobItem(job, job.id === state.activeJobId))}</ul>
      </section>`;
  })}`;
}
