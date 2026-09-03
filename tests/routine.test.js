import test from 'node:test';
import assert from 'node:assert/strict';

import { getWorkout, routine } from '../src/routine.js';

test('A와 B 루틴은 준비운동 뒤 정확히 다섯 본운동을 제공한다', () => {
  assert.deepEqual(Object.keys(routine), ['A', 'B']);
  for (const key of ['A', 'B']) {
    const workout = getWorkout(key);
    assert.equal(workout.warmup.length, 5);
    assert.equal(workout.exercises.length, 5);
    assert.ok(workout.exercises.every((exercise) => exercise.sets === 3));
  }
});

test('A 루틴은 확정한 순서와 시작값을 그대로 사용한다', () => {
  assert.deepEqual(
    getWorkout('A').exercises.map(({ id, name, value, unit, reps, rest, step }) => ({ id, name, value, unit, reps, rest, step })),
    [
      { id: 'leg-press', name: '레그프레스', value: 80, unit: 'kg', reps: 10, rest: 120, step: 5 },
      { id: 'lat-pulldown', name: '랫풀다운', value: 60, unit: 'kg', reps: 8, rest: 120, step: 5 },
      { id: 'shoulder-press', name: '숄더프레스', value: 20, unit: 'kg', reps: 10, rest: 90, step: 5 },
      { id: 'lateral-raise', name: '레터럴레이즈', value: 4, unit: 'kg씩', reps: 15, rest: 60, step: 1 },
      { id: 'reverse-crunch', name: '리버스 크런치', value: 12, unit: '회', reps: null, rest: 45, step: 1 }
    ]
  );
});

test('B 루틴은 확정한 순서와 시작값을 그대로 사용한다', () => {
  assert.deepEqual(
    getWorkout('B').exercises.map(({ id, name, value, unit, reps, rest, step }) => ({ id, name, value, unit, reps, rest, step })),
    [
      { id: 'leg-curl', name: '레그컬', value: 20, unit: 'kg', reps: 12, rest: 60, step: 5 },
      { id: 'seated-row', name: '시티드로우', value: 50, unit: 'kg', reps: 10, rest: 90, step: 5 },
      { id: 'dumbbell-curl', name: '덤벨컬', value: 8, unit: 'kg씩', reps: 10, rest: 60, step: 1 },
      { id: 'pushdown', name: '케이블 푸시다운', value: 20, unit: 'kg', reps: 12, rest: 60, step: 5 },
      { id: 'plank', name: '플랭크', value: 40, unit: '초', reps: null, rest: 45, step: 5 }
    ]
  );
});
