/**
 * Entry point: wires state, rendering and user actions together.
 * All clicks go through one delegated listener keyed by [data-action].
 */
import { SAMPLE_FILES, STEPS, uploadKeyFor } from './data.js';
import { createUpload, retryJob, startJobEngine } from './jobs.js';
import { activeClip, activeJob, findClip, findJob, selectedClips, topClip } from './selectors.js';
import { getState, resetState, subscribe, update } from './store.js';
import { openDialog, setupDialog, showError } from './ui/dialog.js';
import { showToast } from './ui/toast.js';
import { patch } from './utils/dom.js';
import { formatDateTime, pluralize, slugify, tomorrowAtTen } from './utils/format.js';
import { renderDetail } from './views/detail.js';
import { renderMain } from './views/job.js';
import { renderJobList } from './views/sidebar.js';

const el = {
  shell: document.getElementById('shell'),
  jobList: document.getElementById('job-list'),
  main: document.getElementById('main'),
  detail: document.getElementById('detail'),
  uploadDialog: setupDialog(document.getElementById('upload-dialog')),
  scheduleDialog: setupDialog(document.getElementById('schedule-dialog')),
  editDialog: setupDialog(document.getElementById('edit-dialog')),
};

/** Transient UI state that should not be persisted. */
const ui = {
  exporting: null, // { jobId, done, total }
  pendingUpload: null, // { name, size, lastModified }
};

/* ------------------------------------------------------------------
   Rendering
------------------------------------------------------------------- */
function render() {
  const state = getState();
  const job = activeJob(state);
  const detail = renderDetail(job, activeClip(state));

  patch(el.jobList, renderJobList(state));
  patch(el.main, renderMain(state, job, ui));
  patch(el.detail, detail);
  el.shell.classList.toggle('shell--no-detail', String(detail) === '');
}

/* ------------------------------------------------------------------
   Actions
------------------------------------------------------------------- */
const currentJob = () => activeJob(getState());

function updateClip(clipId, mutate) {
  update((draft) => {
    const clip = findClip(findJob(draft, draft.activeJobId), clipId);
    if (clip) mutate(clip);
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function runExport() {
  const job = currentJob();
  const clips = selectedClips(job);
  if (ui.exporting || clips.length === 0) return; // ignore double clicks

  ui.exporting = { jobId: job.id, done: 0, total: clips.length };
  render();

  const timer = setInterval(() => {
    ui.exporting.done += 1;
    if (ui.exporting.done >= ui.exporting.total) {
      clearInterval(timer);
      ui.exporting = null;
      showToast(`${pluralize(clips.length, 'clip')} downloaded as vertical MP4s with captions.`);
    }
    render();
  }, 600);
}

function togglePlay(button) {
  const player = button.closest('[data-player]');
  const playing = player.classList.toggle('is-playing');
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? 'Pause clip' : 'Play clip');
}

function openUpload() {
  const form = el.uploadDialog.querySelector('form');
  form.reset();
  ui.pendingUpload = null;
  setPendingFile(null);
  openDialog(el.uploadDialog);
}

function setPendingFile(file, sampleId = null) {
  const label = document.getElementById('upload-file-name');
  label.hidden = !file;
  label.textContent = file ? file.name : '';
  el.uploadDialog.querySelectorAll('[data-sample]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sample === sampleId));
  });
}

function openSchedule() {
  const job = currentJob();
  const count = selectedClips(job).length;
  const form = el.scheduleDialog.querySelector('form');
  form.reset();
  form.elements.start.value = tomorrowAtTen();
  document.getElementById('schedule-title').textContent = `Schedule ${pluralize(count, 'clip')}`;
  document.getElementById('schedule-summary').textContent = `From “${job.title}”, highest score first.`;
  openDialog(el.scheduleDialog);
}

function openEdit(clipId) {
  const clip = findClip(currentJob(), clipId);
  const { elements } = el.editDialog.querySelector('form');
  elements.title.value = clip.title;
  elements.caption.value = [clip.caption.pre, clip.caption.highlight, clip.caption.post].filter(Boolean).join(' ');
  elements.highlight.value = clip.caption.highlight;
  el.editDialog.dataset.clipId = clipId;
  openDialog(el.editDialog, { focus: elements.title });
}

const actions = {
  'open-job': ({ jobId }) => {
    update((draft) => {
      draft.activeJobId = jobId;
      draft.activeClipId = topClip(findJob(draft, jobId))?.id ?? null;
    });
    el.main.focus({ preventScroll: true });
  },

  'retry-job': ({ jobId }) => {
    const job = findJob(getState(), jobId);
    if (retryJob(jobId)) {
      update((draft) => { draft.activeJobId = jobId; });
      showToast(`Retrying “${job.title}” from ${STEPS[job.failedStep].toLowerCase()}. No new upload needed.`);
    } else {
      showToast('This job is already running.');
    }
  },

  'select-clip': ({ clipId }) => {
    update((draft) => { draft.activeClipId = clipId; });
    // Below 1180px the preview sits under the grid, so bring it into view.
    if (window.matchMedia('(max-width: 1180px)').matches) {
      el.detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  'toggle-clip': ({ clipId }) => updateClip(clipId, (clip) => { clip.selected = !clip.selected; }),

  'copy-job-id': async ({ jobId }) => {
    const copied = await copyText(jobId);
    showToast(copied ? `Copied reference ${jobId}.` : `Reference: ${jobId}`);
  },

  export: runExport,
  'open-schedule': openSchedule,
  'open-edit': ({ clipId }) => openEdit(clipId),
  'open-upload': openUpload,

  'download-clip': ({ clipId }) => {
    const clip = findClip(currentJob(), clipId);
    showToast(`Downloading ${slugify(clip.title)}.mp4`);
  },

  'pick-sample': ({ sample }) => {
    const file = SAMPLE_FILES[sample];
    ui.pendingUpload = file;
    el.uploadDialog.querySelector('form').elements.title.value = file.title;
    setPendingFile(file, sample);
  },

  'nav-stub': () => showToast('Only the Projects screen is part of this prototype.'),

  'reset-demo': () => {
    resetState();
    showToast('Demo data reset.');
  },
};

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target || target.tagName === 'SELECT') return;

  if (target.dataset.action === 'toggle-play') {
    togglePlay(target);
    return;
  }

  const handler = actions[target.dataset.action];
  if (!handler) return;
  if (target.tagName === 'A') event.preventDefault();
  handler(target.dataset);
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-action="set-sort"]')) {
    const { value } = event.target;
    update((draft) => { draft.sort = value; });
  }
});

// When a preview finishes, reset it so it can be played again.
document.addEventListener('animationend', (event) => {
  if (!event.target.classList.contains('player__bar')) return;
  const player = event.target.closest('[data-player]');
  player.classList.remove('is-playing');
  const bar = event.target;
  bar.style.animation = 'none';
  void bar.offsetWidth; // restart the CSS animation
  bar.style.animation = '';
  const toggle = player.querySelector('.player__toggle');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-label', 'Play clip');
});

/* ------------------------------------------------------------------
   Forms
------------------------------------------------------------------- */
document.getElementById('upload-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  ui.pendingUpload = { name: file.name, size: file.size, lastModified: file.lastModified };
  const titleInput = el.uploadDialog.querySelector('form').elements.title;
  if (!titleInput.value) titleInput.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  setPendingFile(file);
});

el.uploadDialog.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = event.target.elements.title.value.trim();
  if (!ui.pendingUpload) return showError(el.uploadDialog, 'Choose a video file or a sample file.');
  if (!title) return showError(el.uploadDialog, 'Add a title so you can find this upload later.');

  const result = createUpload({
    key: uploadKeyFor(ui.pendingUpload),
    title,
    duration: 2400 + (ui.pendingUpload.size % 2400),
  });
  el.uploadDialog.close();

  showToast(result.duplicate
    ? `You already uploaded this video, so we opened it instead of processing it again. No minutes used.`
    : 'Upload received. Processing continues even if you close this tab.');
});

el.scheduleDialog.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const platforms = [...form.querySelectorAll('[name="platform"]:checked')].map((input) => input.value);
  if (platforms.length === 0) return showError(el.scheduleDialog, 'Pick at least one platform.');
  if (!form.elements.start.value) return showError(el.scheduleDialog, 'Pick a date and time for the first post.');

  const count = selectedClips(currentJob()).length;
  const spacing = form.elements.cadence.value === 'daily' ? 'one per day' : 'all at once';
  el.scheduleDialog.close();
  showToast(`Scheduled ${pluralize(count, 'clip')} on ${platforms.join(', ')}, ${spacing}, starting ${formatDateTime(form.elements.start.value)}.`);
});

el.editDialog.querySelector('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const { title, caption, highlight } = event.target.elements;
  const newTitle = title.value.trim();
  const text = caption.value.trim();
  const word = highlight.value.trim();

  if (!newTitle) return showError(el.editDialog, 'The title cannot be empty.');
  const at = word ? text.toLowerCase().indexOf(word.toLowerCase()) : -1;
  if (word && at === -1) return showError(el.editDialog, `“${word}” is not in the caption.`);

  updateClip(el.editDialog.dataset.clipId, (clip) => {
    clip.title = newTitle;
    clip.caption = word
      ? { pre: text.slice(0, at).trim(), highlight: text.slice(at, at + word.length), post: text.slice(at + word.length).trim() }
      : { pre: text, highlight: '', post: '' };
  });
  el.editDialog.close();
  showToast('Clip updated.');
});

/* ------------------------------------------------------------------
   Boot
------------------------------------------------------------------- */
// Demo-only controls (reset) stay hidden unless the URL has ?demo.
document.body.classList.toggle('show-demo-controls', new URLSearchParams(location.search).has('demo'));

subscribe(render);
render();

startJobEngine({
  onJobDone: (job) => showToast(`“${job.title}” is ready: ${pluralize(job.clips.length, 'clip')}. We also sent you an email.`),
});
