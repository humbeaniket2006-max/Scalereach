/**
 * Minimal state container.
 * State is persisted to localStorage so a returning user (closed tab, reload)
 * sees the same jobs, which is the point of the exercise.
 */
import { createInitialState } from './data.js';

const STORAGE_KEY = 'scalereach-clips-demo/v2';
const listeners = new Set();
let state = load() ?? createInitialState();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.version === 2 ? saved : null;
  } catch {
    return null;
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode). The demo still works in memory.
  }
}

export function getState() {
  return state;
}

/** Apply a mutation to a copy of the state, persist it and notify subscribers. */
export function update(mutate) {
  const next = structuredClone(state);
  mutate(next);
  state = next;
  save();
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState() {
  update((draft) => Object.assign(draft, createInitialState()));
}
