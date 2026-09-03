import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adjustExerciseValue,
  cancelDraft,
  createDraft,
  restoreAppState,
  setExerciseValue,
  submitDraft
} from '../src/session.js';

test('첫 실행은 오늘 A 루틴을 바로 편집 가능한 상태로 연다', () => {
  const state = restoreAppState(null);
  const draft = createDraft(state, '2026-09-03');
  assert.equal(draft.date, '2026-09-03');
  assert.equal(draft.workout, 'A');
  assert.equal(draft.exercises[0].value, 80);
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
  const draft = adjustExerciseValue(createDraft(state, '2026-09-03'), 'leg-press', 1);
  const saved = submitDraft(state, draft);
  const reopened = createDraft(saved, '2026-09-03');
  assert.equal(reopened.exercises[0].value, 85);

  const edited = adjustExerciseValue(reopened, 'leg-press', -1);
  const resaved = submitDraft(saved, edited);
  assert.equal(createDraft(resaved, '2026-09-03').exercises[0].value, 80);
  assert.equal(resaved.entries.length, 1);
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
  const draft = adjustExerciseValue(createDraft(state, '2026-09-03'), 'leg-press', 1);
  assert.equal(cancelDraft(state, draft), state);
  assert.equal(state.entries.length, 0);
});

test('깨진 로컬 저장값은 안전하게 초기화한다', () => {
  assert.deepEqual(restoreAppState('{broken'), { entries: [] });
  assert.deepEqual(restoreAppState('{"entries":"bad"}'), { entries: [] });
});
