import { viralScore } from './data.js';

export const findJob = (state, jobId) => state.jobs.find((job) => job.id === jobId);

export const activeJob = (state) => findJob(state, state.activeJobId) ?? state.jobs[0];

export const findClip = (job, clipId) => job?.clips.find((clip) => clip.id === clipId);

export function activeClip(state) {
  const job = activeJob(state);
  return findClip(job, state.activeClipId) ?? topClip(job);
}

export function topClip(job) {
  return [...(job?.clips ?? [])].sort((a, b) => viralScore(b) - viralScore(a))[0];
}

export const selectedClips = (job) => job.clips.filter((clip) => clip.selected);
