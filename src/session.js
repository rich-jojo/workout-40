import { getWorkout } from './routine.js';

const emptyState = () => ({ entries: [] });
const nextWorkout = (workout) => (workout === 'A' ? 'B' : 'A');
const clone = (value) => structuredClone(value);

function isValidEntry(entry) {
  return entry
    && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    && ['A', 'B'].includes(entry.workout)
    && Array.isArray(entry.exercises);
}

export function restoreAppState(raw) {
  if (!raw) return emptyState();
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || !Array.isArray(parsed.entries)) return emptyState();
    return { entries: parsed.entries.filter(isValidEntry).map(clone) };
  } catch {
    return emptyState();
  }
}

function previousEntry(state, date) {
  return [...state.entries]
    .filter((entry) => entry.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function previousWorkoutEntry(state, date, workout) {
  return [...state.entries]
    .filter((entry) => entry.date < date && entry.workout === workout)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

export function createDraft(state, date, forcedWorkout = null) {
  const existing = state.entries.find((entry) => entry.date === date);
  if (existing && forcedWorkout === null) return clone(existing);

  const workout = forcedWorkout ?? (previousEntry(state, date) ? nextWorkout(previousEntry(state, date).workout) : 'A');
  const template = getWorkout(workout);
  const prior = previousWorkoutEntry(state, date, workout);
  const priorValues = new Map((prior?.exercises ?? []).map((exercise) => [exercise.id, exercise.value]));

  return {
    date,
    workout,
    exercises: template.exercises.map((exercise) => ({
      ...exercise,
      value: priorValues.has(exercise.id) ? priorValues.get(exercise.id) : exercise.value
    }))
  };
}

export function adjustExerciseValue(draft, exerciseId, direction) {
  const sign = direction < 0 ? -1 : 1;
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) => exercise.id === exerciseId
      ? { ...exercise, value: Math.max(0, exercise.value + exercise.step * sign) }
      : { ...exercise })
  };
}

export function setExerciseValue(draft, exerciseId, rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return draft;
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) => exercise.id === exerciseId
      ? { ...exercise, value: Math.max(0, parsed) }
      : { ...exercise })
  };
}

export function submitDraft(state, draft) {
  const entries = state.entries.filter((entry) => entry.date !== draft.date);
  entries.push(clone(draft));
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { entries };
}

export function cancelDraft(state) {
  return state;
}
