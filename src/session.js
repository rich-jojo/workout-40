import { getStretching, getWorkout } from './routine.js';

export const currentSchemaVersion = 2;

const emptyState = () => ({ schemaVersion: currentSchemaVersion, entries: [] });
const nextWorkout = (workout) => (workout === 'A' ? 'B' : 'A');
const clone = (value) => structuredClone(value);

function isValidEntry(entry) {
  return entry
    && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    && ['A', 'B'].includes(entry.workout)
    && Array.isArray(entry.exercises);
}

function savedValue(saved, fallback) {
  const parsed = Number(saved?.value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function savedReps(saved, fallback) {
  if (fallback === null || saved?.reps == null || saved.reps === '') return fallback;
  const parsed = Number(saved.reps);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
}

function savedCompletion(saved) {
  return saved?.completed === true;
}

const isObjectItem = (item) => item !== null && typeof item === 'object' && !Array.isArray(item);

function normalizeEntry(entry) {
  const workout = getWorkout(entry.workout);
  const savedExercises = new Map(entry.exercises.filter(isObjectItem).map((exercise) => [exercise.id, exercise]));
  const savedStretches = new Map(Array.isArray(entry.stretches) ? entry.stretches.filter(isObjectItem).map((stretch) => [stretch.id, stretch]) : []);

  return {
    date: entry.date,
    workout: entry.workout,
    exercises: workout.exercises.map((exercise) => {
      const saved = savedExercises.get(exercise.id);
      return {
        ...exercise,
        value: savedValue(saved, exercise.value),
        reps: savedReps(saved, exercise.reps),
        completed: savedCompletion(saved)
      };
    }),
    stretches: getStretching().map((stretch) => ({
      ...stretch,
      completed: savedCompletion(savedStretches.get(stretch.id))
    }))
  };
}

export function restoreAppState(raw) {
  if (!raw) return emptyState();
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || !Array.isArray(parsed.entries)) return emptyState();
    return {
      schemaVersion: currentSchemaVersion,
      entries: parsed.entries.filter(isValidEntry).map(normalizeEntry)
    };
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
  if (existing && (forcedWorkout === null || forcedWorkout === existing.workout)) return clone(existing);

  const workout = forcedWorkout ?? (previousEntry(state, date) ? nextWorkout(previousEntry(state, date).workout) : 'A');
  const template = getWorkout(workout);
  const prior = previousWorkoutEntry(state, date, workout);
  const priorValues = new Map((prior?.exercises ?? []).map((exercise) => [exercise.id, exercise]));

  return {
    date,
    workout,
    exercises: template.exercises.map((exercise) => ({
      ...exercise,
      value: savedValue(priorValues.get(exercise.id), exercise.value),
      reps: savedReps(priorValues.get(exercise.id), exercise.reps),
      completed: false
    })),
    stretches: getStretching().map((stretch) => ({
      ...stretch,
      completed: false
    }))
  };
}

export function adjustExerciseValue(draft, exerciseId, direction, field = 'value') {
  const exercise = draft.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return draft;
  const step = field === 'reps' ? 1 : exercise.step;
  return setExerciseValue(draft, exerciseId, exercise[field] + step * (direction < 0 ? -1 : 1), field);
}

export function setExerciseValue(draft, exerciseId, rawValue, field = 'value') {
  const parsed = Number(rawValue);
  if (!['value', 'reps'].includes(field) || !Number.isFinite(parsed)) return draft;
  const value = Math.max(0, field === 'reps' ? Math.trunc(parsed) : parsed);
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) => exercise.id === exerciseId && (field !== 'reps' || exercise.reps !== null)
      ? { ...exercise, [field]: value }
      : { ...exercise })
  };
}

export function setExerciseCompletion(draft, exerciseId, completed) {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise) => exercise.id === exerciseId
      ? { ...exercise, completed: completed === true }
      : { ...exercise })
  };
}

export function toggleExerciseCompletion(draft, exerciseId) {
  const exercise = draft.exercises.find((item) => item.id === exerciseId);
  return setExerciseCompletion(draft, exerciseId, !(exercise?.completed === true));
}

export function setStretchCompletion(draft, stretchId, completed) {
  return {
    ...draft,
    stretches: draft.stretches.map((stretch) => stretch.id === stretchId
      ? { ...stretch, completed: completed === true }
      : { ...stretch })
  };
}

export function toggleStretchCompletion(draft, stretchId) {
  const stretch = draft.stretches.find((item) => item.id === stretchId);
  return setStretchCompletion(draft, stretchId, !(stretch?.completed === true));
}

export function submitDraft(state, draft) {
  const entries = state.entries.filter((entry) => entry.date !== draft.date);
  entries.push(normalizeEntry(draft));
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { schemaVersion: currentSchemaVersion, entries };
}

export function cancelDraft(state) {
  return state;
}
