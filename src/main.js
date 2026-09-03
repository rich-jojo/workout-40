import './styles.css';
import { getWorkout } from './routine.js';
import {
  adjustExerciseValue,
  createDraft,
  restoreAppState,
  setExerciseValue,
  submitDraft
} from './session.js';

const storageKey = 'workout-40-state';
const app = document.querySelector('#app');
let state = restoreAppState(localStorage.getItem(storageKey));
let selectedDate = today();
let draft = createDraft(state, selectedDate);
let statusText = '';

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(value, amount) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day + amount, 12);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function restLabel(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}분`;
  return `${seconds}초`;
}

function valueKind(exercise) {
  if (exercise.unit.startsWith('kg')) return '중량';
  if (exercise.unit === '초') return '시간';
  return '횟수';
}

function targetLabel(exercise) {
  const target = exercise.reps ? `${exercise.reps}회 × ${exercise.sets}` : `${exercise.sets}세트`;
  return `${target} · 휴식 ${restLabel(exercise.rest)}`;
}

function renderWarmup(workout) {
  return workout.warmup
    .map((item) => `<li><span>${item.label}</span><strong>${item.value}</strong></li>`)
    .join('');
}

function renderExercise(exercise) {
  const kind = valueKind(exercise);
  return `
    <article class="exercise" data-testid="exercise-${exercise.id}">
      <div class="exercise-copy">
        <h2>${exercise.name}</h2>
        <p>${targetLabel(exercise)}</p>
      </div>
      <div class="stepper">
        <button type="button" data-action="decrease" data-id="${exercise.id}" aria-label="${exercise.name} ${kind} 내리기">−</button>
        <label class="number-field">
          <span class="sr-only">${exercise.name} ${kind}</span>
          <input type="number" min="0" step="${exercise.step}" inputmode="decimal" value="${exercise.value}" data-action="input" data-id="${exercise.id}" aria-label="${exercise.name} ${kind}" />
          <span>${exercise.unit}</span>
        </label>
        <button type="button" data-action="increase" data-id="${exercise.id}" aria-label="${exercise.name} ${kind} 올리기">+</button>
      </div>
    </article>`;
}

function render() {
  const workout = getWorkout(draft.workout);
  app.innerHTML = `
    <div class="shell">
      <nav class="date-nav" aria-label="운동 날짜">
        <button type="button" data-action="previous-date" aria-label="이전 날짜">‹</button>
        <input type="date" value="${selectedDate}" data-action="date" aria-label="날짜" />
        <button type="button" data-action="next-date" aria-label="다음 날짜">›</button>
      </nav>

      <header class="workout-head">
        <div>
          <h1 aria-label="운동 ${draft.workout}">${draft.workout}</h1>
          <p>${workout.focus}</p>
        </div>
        <div class="switcher" aria-label="루틴 선택">
          <button type="button" data-action="workout" data-workout="A" aria-label="A 루틴 선택" aria-pressed="${draft.workout === 'A'}">A</button>
          <button type="button" data-action="workout" data-workout="B" aria-label="B 루틴 선택" aria-pressed="${draft.workout === 'B'}">B</button>
        </div>
      </header>

      <details class="warmup">
        <summary>준비운동</summary>
        <ol>${renderWarmup(workout)}</ol>
      </details>

      <section class="exercise-list" aria-label="운동 목록">
        ${draft.exercises.map(renderExercise).join('')}
      </section>

      <footer class="actions">
        <div class="status" role="status" aria-live="polite">${statusText}</div>
        <div class="action-row">
          <button type="button" class="cancel" data-action="cancel">취소</button>
          <button type="button" class="save" data-action="save">저장</button>
        </div>
      </footer>
    </div>`;
}

function markEditing() {
  statusText = '수정 중';
  const status = app.querySelector('[role="status"]');
  if (status) status.textContent = statusText;
}

function loadDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  selectedDate = date;
  draft = createDraft(state, selectedDate);
  statusText = state.entries.some((entry) => entry.date === selectedDate) ? '저장됨' : '';
  render();
}

app.addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset.action === 'date') {
    loadDate(target.value);
    return;
  }
  if (target.dataset.action === 'input') {
    draft = setExerciseValue(draft, target.dataset.id, target.value);
    markEditing();
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'previous-date' || action === 'next-date') {
    loadDate(shiftDate(selectedDate, action === 'previous-date' ? -1 : 1));
    return;
  }

  if (action === 'workout') {
    draft = createDraft(state, selectedDate, button.dataset.workout);
    statusText = '수정 중';
    render();
    return;
  }

  if (action === 'increase' || action === 'decrease') {
    draft = adjustExerciseValue(draft, button.dataset.id, action === 'increase' ? 1 : -1);
    statusText = '수정 중';
    render();
    return;
  }

  if (action === 'save') {
    state = submitDraft(state, draft);
    localStorage.setItem(storageKey, JSON.stringify(state));
    draft = createDraft(state, selectedDate);
    statusText = '저장됨';
    render();
    return;
  }

  if (action === 'cancel') {
    draft = createDraft(state, selectedDate);
    statusText = '취소됨';
    render();
  }
});

render();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
