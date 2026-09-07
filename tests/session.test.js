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

test('중량과 독립적인 횟수는 1씩 조절하고 직접 입력을 0 이상 정수로 만든다', () => {
  const draft = createDraft(restoreAppState(null), '2026-09-03');
  const raised = adjustExerciseValue(draft, 'leg-press', 1, 'reps');
  assert.equal(raised.exercises[0].reps, 11);
  assert.equal(raised.exercises[0].value, 80);
  assert.equal(draft.exercises[0].reps, 10);
  assert.equal(adjustExerciseValue(raised, 'leg-press', -1, 'reps').exercises[0].reps, 10);
  assert.equal(setExerciseValue(draft, 'leg-press', '12', 'reps').exercises[0].reps, 12);
  assert.equal(setExerciseValue(draft, 'leg-press', '12.8', 'reps').exercises[0].reps, 12);
  const zero = setExerciseValue(draft, 'leg-press', '-3', 'reps');
  assert.equal(zero.exercises[0].reps, 0);
  assert.equal(adjustExerciseValue(zero, 'leg-press', -1, 'reps').exercises[0].reps, 0);
  assert.equal(setExerciseValue(draft, 'leg-press', 'bad', 'reps'), draft);
  assert.equal(setExerciseValue(draft, 'leg-press', Infinity, 'reps'), draft);
  assert.equal(setExerciseValue(draft, 'reverse-crunch', '20', 'reps').exercises[4].reps, null);
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

test('저장·복원·취소와 A→B→A는 kg와 횟수를 유지하며 기존 날짜 스냅샷은 바꾸지 않는다', () => {
  let state = restoreAppState(null);
  const edit = (date, kg, reps) => toggleExerciseCompletion(
    setExerciseValue(setExerciseValue(createDraft(state, date, 'A'), 'leg-press', kg), 'leg-press', reps, 'reps'),
    'leg-press'
  );
  state = submitDraft(state, edit('2026-09-01', 75, 9));
  state = submitDraft(state, edit('2030-01-01', 100, 15));
  const snapshots = structuredClone(state.entries);
  state = submitDraft(state, edit('2026-09-03', 85, 12));
  state = restoreAppState(JSON.stringify(state));
  const saved = createDraft(state, '2026-09-03');
  assert.equal(saved.exercises[0].value, 85);
  assert.equal(saved.exercises[0].reps, 12);
  assert.equal(saved.exercises[0].completed, true);
  const changed = setExerciseValue(setExerciseValue(saved, 'leg-press', 90), 'leg-press', 14, 'reps');
  assert.deepEqual(createDraft(cancelDraft(state, changed), saved.date), saved);
  const b = createDraft(state, '2026-09-04');
  assert.equal(b.workout, 'B');
  assert.equal(b.exercises[0].reps, 12);
  state = submitDraft(state, b);
  const nextA = createDraft(state, '2026-09-05');
  assert.equal(nextA.workout, 'A');
  assert.equal(nextA.exercises[0].value, 85);
  assert.equal(nextA.exercises[0].reps, 12);
  assert.equal(nextA.exercises[0].completed, false);
  assert.ok(nextA.stretches.every((item) => !item.completed));
  state = submitDraft(state, edit('2026-09-05', 90, 14));
  assert.deepEqual(createDraft(state, '2026-09-03'), saved);
  for (const snapshot of snapshots) assert.deepEqual(createDraft(state, snapshot.date), snapshot);
  assert.equal(createDraft(state, '2026-09-07', 'A').exercises[0].reps, 14);
});

test('새 날짜는 이전 중량을 이어받고 완료 체크는 새로 시작한다', () => {
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

test('깨진 배열 항목은 버리고 다른 저장 날짜와 유효한 중량·횟수는 보존한다', () => {
  const valid = createDraft(restoreAppState(null), '2026-09-01');
  const corrupt = {
    date: '2026-09-03', workout: 'A',
    exercises: [null, 3, 'bad', [], { id: 'leg-press', value: 95, reps: 13 }, { id: 'lat-pulldown', value: 65 }],
    stretches: [null, false, 'bad', [], { id: 'wall-calf', completed: true }]
  };
  const state = restoreAppState(JSON.stringify({ entries: [valid, corrupt] }));
  assert.equal(state.entries.length, 2);
  assert.deepEqual(createDraft(state, valid.date), valid);
  const restored = createDraft(state, corrupt.date);
  assert.equal(restored.exercises[0].value, 95);
  assert.equal(restored.exercises[0].reps, 13);
  assert.equal(restored.exercises[0].completed, false);
  assert.equal(restored.exercises[1].value, 65);
  assert.equal(restored.exercises[1].reps, 8);
  assert.equal(restored.stretches.at(-1).completed, true);
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
