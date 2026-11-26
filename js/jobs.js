/**
 * Simulated backend for the job lifecycle.
 *
 * Mirrors the answer to "the user closes the tab while processing":
 *   - every upload becomes a job record with an id and a status
 *     (queued, processing, done, failed) that lives outside the tab;
 *   - an upload key makes uploads idempotent: the same file returns the existing job;
 *   - retry only moves a job out of "failed", so repeated clicks start one run,
 *     and it resumes from the failed step using the saved upload.
 */
import { RENDER_STEP, generateClips } from './data.js';
import { findJob } from './selectors.js';
import { getState, update } from './store.js';
import { formatClock } from './utils/format.js';

const TICK_MS = 1400;

/** Advance the queue on an interval. `onJobDone(job)` stands in for the "your clips are ready" email. */
export function startJobEngine({ onJobDone }) {
  // Catch up on the time the tab was closed, as a real backend would have kept working.
  const missedTicks = Math.min(200, Math.floor((Date.now() - (getState().lastTickAt ?? Date.now())) / TICK_MS));
  for (let i = 0; i < missedTicks; i += 1) tick();

  setInterval(() => {
    const finished = tick();
    if (finished) onJobDone(finished);
  }, TICK_MS);
}

function tick() {
  const state = getState();
  const running = state.jobs.find((job) => job.status === 'processing');
  const next = state.jobs
    .filter((job) => job.status === 'queued')
    .sort((a, b) => a.queuedAt - b.queuedAt)[0];

  if (!running && !next) {
    update((draft) => { draft.lastTickAt = Date.now(); });
    return null;
  }

  let finished = null;
  update((draft) => {
    draft.lastTickAt = Date.now();
    if (!running) {
      findJob(draft, next.id).status = 'processing';
      return;
    }

    const job = findJob(draft, running.id);
    if (job.step < RENDER_STEP) {
      job.step += 1;
      if (job.step === RENDER_STEP) {
        job.renderDone = 0;
        job.renderTotal = 6 + (job.duration % 4);
      }
      return;
    }

    job.renderDone += 1;
    if (job.renderDone >= job.renderTotal) {
      job.status = 'done';
      job.finishedAt = formatClock();
      job.clips = generateClips(job.id, job.duration, job.renderTotal);
      finished = job;
    }
  });
  return finished;
}

/**
 * Idempotent retry. Returns true only for the call that actually re-queued the job.
 */
export function retryJob(jobId) {
  let retried = false;
  update((draft) => {
    const job = findJob(draft, jobId);
    if (!job || job.status !== 'failed') return;
    job.status = 'queued';
    job.attempt += 1;
    job.step = job.failedStep;
    if (job.step === RENDER_STEP) {
      job.renderDone = 0;
      job.renderTotal ??= 8;
    }
    job.queuedAt = Date.now();
    job.error = null;
    job.clips = []; // partial output from the failed run is replaced, never appended
    retried = true;
  });
  return retried;
}

/**
 * Register an upload. If a job with the same upload key exists, return it
 * instead of creating a duplicate.
 */
export function createUpload({ key, title, duration }) {
  let result;
  update((draft) => {
    const existing = draft.jobs.find((job) => job.uploadKey === key);
    if (existing) {
      draft.activeJobId = existing.id;
      result = { duplicate: true, job: existing };
      return;
    }

    const job = {
      id: `job_${Math.random().toString(16).slice(2, 8)}`,
      title,
      duration,
      uploadKey: key,
      status: 'queued',
      step: 1, // the upload itself is complete; processing starts at Transcribe
      queuedAt: Date.now(),
      attempt: 1,
      clips: [],
    };
    draft.jobs.unshift(job);
    draft.activeJobId = job.id;
    result = { duplicate: false, job };
  });
  return result;
}
