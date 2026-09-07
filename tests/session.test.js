import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adjustExerciseValue,
  cancelDraft,
  createDraft,
  currentSchemaVersion,
  restoreAppState,
  setExerciseValue,
  submitDraft,
  toggleExerciseCompletion,
  toggleStretchCompletion
} from '../src/session.js';

test('첫 실행은 오늘 A 루틴을 바로 편집 가능한 상태로 연다', () => {
  const state = restoreAppState(null);
  const draft = createDraft(state, '2026-09-03');
  assert.equal(draft.date, '2026-09-03');
  assert.equal(draft.workout, 'A');
  assert.equal(draft.exercises[0].value, 80);
  assert.ok(draft.exercises.every((exercise) => exercise.completed === false));
  assert.ok(draft.stretches.every((stretch) => stretch.completed === false));
});

test('중량은 운동별 단위로 더하고 빼며 0 아래로 내려가지 않는다', () => {
  const draft = createDraft(restoreAppState(null), '2026-09-03');
  const raised = adjustExerciseValue(draft, 'leg-press', 1);
  assert.equal(raised.exercises[0].value, 85);
  const lowered = adjustExerciseValue(raised, 'leg-press', -1);
  assert.equal(lowered.exercises[0].value, 80);
  const zero = { ...draft, exercises: draft.exercises.map((item) => ({ ...item, value: 0 })) };
  assert.equal(adjustExerciseValue(zero, 'leg-press', -1).exercises[0].value, 0);
});

test('숫자를 직접 입력해 중량을 바꿀 수 있다', () => {
  const draft = createDraft(restoreAppState(null), '2026-09-03');
  assert.equal(setExerciseValue(draft, 'leg-press', '87.5').exercises[0].value, 87.5);
  assert.equal(setExerciseValue(draft, 'leg-press', '-3').exercises[0].value, 0);
  assert.equal(setExerciseValue(draft, 'leg-press', 'not-a-number').exercises[0].value, 80);
});

test('저장하면 같은 날짜를 다시 열어 수정할 수 있다', () => {
  const state = restoreAppState(null);
  const draft = toggleStretchCompletion(
    toggleExerciseCompletion(adjustExerciseValue(createDraft(state, '2026-09-03'), 'leg-press', 1), 'leg-press'),
    'standing-quad'
  );
  const saved = submitDraft(state, draft);
  const reopened = createDraft(saved, '2026-09-03');
  assert.equal(reopened.exercises[0].value, 85);
  assert.equal(reopened.exercises[0].completed, true);
  assert.equal(reopened.stretches.find((stretch) => stretch.id === 'standing-quad').completed, true);

  const edited = adjustExerciseValue(reopened, 'leg-press', -1);
  const resaved = submitDraft(saved, edited);
  assert.equal(createDraft(resaved, '2026-09-03').exercises[0].value, 80);
  assert.equal(resaved.entries.length, 1);
});

test('새 날짜는 이전 중량만 이어받고 완료 체크는 새로 시작한다', () => {
  const state = submitDraft(
    restoreAppState(null),
    toggleStretchCompletion(
      toggleExerciseCompletion(adjustExerciseValue(createDraft(restoreAppState(null), '2026-09-03'), 'leg-press', 1), 'leg-press'),
      'shoulder-cross-body'
    )
  );
  const nextA = createDraft(state, '2026-09-05', 'A');
  assert.equal(nextA.exercises[0].value, 85);
  assert.equal(nextA.exercises[0].completed, false);
  assert.ok(nextA.stretches.every((stretch) => stretch.completed === false));
});

test('강제 루틴 전환은 다른 운동에 완료 체크를 옮기지 않는다', () => {
  const state = submitDraft(
    restoreAppState(null),
    toggleExerciseCompletion(createDraft(restoreAppState(null), '2026-09-03'), 'leg-press')
  );
  const switched = createDraft(state, '2026-09-03', 'B');
  assert.equal(switched.workout, 'B');
  assert.ok(switched.exercises.every((exercise) => exercise.completed === false));
});

test('과거와 미래 날짜도 제한 없이 저장하고 다시 수정할 수 있다', () => {
  let state = restoreAppState(null);
  state = submitDraft(state, createDraft(state, '2020-01-01'));
  state = submitDraft(state, createDraft(state, '2030-12-31'));
  assert.deepEqual(state.entries.map((entry) => entry.date), ['2020-01-01', '2030-12-31']);
});

test('새 날짜의 루틴은 가장 최근 저장 루틴의 다음 글자로 정한다', () => {
  let state = restoreAppState(null);
  state = submitDraft(state, createDraft(state, '2026-09-03'));
  assert.equal(createDraft(state, '2026-09-04').workout, 'B');
});

test('취소하면 저장 상태는 바뀌지 않는다', () => {
  const state = restoreAppState(null);
  const draft = toggleExerciseCompletion(adjustExerciseValue(createDraft(state, '2026-09-03'), 'leg-press', 1), 'leg-press');
  assert.equal(cancelDraft(state, draft), state);
  assert.equal(state.entries.length, 0);
});

test('깨진 로컬 저장값은 안전하게 초기화한다', () => {
  assert.deepEqual(restoreAppState('{broken'), { schemaVersion: currentSchemaVersion, entries: [] });
  assert.deepEqual(restoreAppState('{"entries":"bad"}'), { schemaVersion: currentSchemaVersion, entries: [] });
});

test('레거시 저장값은 날짜와 중량을 보존하고 누락되거나 깨진 체크값은 false로 정규화한다', () => {
  const state = restoreAppState({
    entries: [{
      date: '2026-09-03',
      workout: 'A',
      exercises: [
        { id: 'leg-press', name: '레그프레스', value: 95, unit: 'kg', reps: 10, sets: 3, rest: 120, step: 5 },
        { id: 'lat-pulldown', name: '랫풀다운', value: 65, unit: 'kg', reps: 8, sets: 3, rest: 120, step: 5, completed: 'yes' }
      ],
      stretches: [{ id: 'wall-calf', completed: 1 }]
    }]
  });
  const draft = createDraft(state, '2026-09-03');
  assert.equal(draft.exercises.find((exercise) => exercise.id === 'leg-press').value, 95);
  assert.equal(draft.exercises.find((exercise) => exercise.id === 'leg-press').completed, false);
  assert.equal(draft.exercises.find((exercise) => exercise.id === 'lat-pulldown').completed, false);
  assert.equal(draft.stretches.find((stretch) => stretch.id === 'wall-calf').completed, false);
});
