import test from 'node:test';
import assert from 'node:assert/strict';

import { getStretching, getWorkout, routine } from '../src/routine.js';

test('A와 B 루틴은 준비운동 뒤 정확히 다섯 본운동을 제공한다', () => {
  assert.deepEqual(Object.keys(routine), ['A', 'B']);
  assert.equal(getWorkout('A').warmup.length, 4);
  assert.equal(getWorkout('B').warmup.length, 5);
  assert.equal(getWorkout('A').exercises.length, 5);
  assert.equal(getWorkout('B').exercises.length, 5);
  assert.ok(getWorkout('A').exercises.every((exercise) => exercise.sets === 3));
  assert.ok(getWorkout('B').exercises.every((exercise) => exercise.sets === 3));
});

test('운동 전 준비동작은 루틴별 준비세트와 짧은 자세 cue를 제공한다', () => {
  const aWarmup = getWorkout('A').warmup;
  const bWarmup = getWorkout('B').warmup;

  assert.ok(aWarmup.every((item) => item.cue.length > 0));
  assert.ok(bWarmup.every((item) => item.cue.length > 0));
  assert.deepEqual(
    aWarmup.map(({ label, value }) => ({ label, value })),
    [
      { label: '제자리 걷기', value: '1분' },
      { label: '팔 돌리기 앞', value: '10회' },
      { label: '팔 돌리기 뒤', value: '10회' },
      { label: '맨몸 스쿼트', value: '10회' }
    ]
  );
  assert.equal(bWarmup.at(-1).label, '준비세트');
  assert.equal(bWarmup.at(-1).value, '레그컬 10kg 12회 · 로우 25kg 10회');
});

test('앞허벅지 cue는 발목과 뒤꿈치의 실제 당기는 동작을 설명한다', () => {
  assert.match(getStretching().find((item) => item.id === 'standing-quad').cue, /벽을 짚고 발목을 잡아 뒤꿈치를 엉덩이 쪽으로 당기기/);
});

test('운동 후 스트레칭은 모든 루틴에서 같은 선택 루틴이다', () => {
  assert.deepEqual(
    getStretching().map(({ name, dose }) => ({ name, dose })),
    [
      { name: '어깨 가로 당기기', dose: '좌우 30초씩 · 1회' },
      { name: '서서 앞허벅지 늘리기', dose: '좌우 30초씩 · 1회' },
      { name: '누워 뒤허벅지 늘리기', dose: '좌우 30초씩 · 1회' },
      { name: '벽 짚고 종아리 늘리기', dose: '좌우 30초씩 · 1회' }
    ]
  );
  assert.ok(getStretching().every((item) => item.cue.length > 0));
  const firstRead = getStretching();
  firstRead[0].name = 'mutated';
  assert.equal(getStretching()[0].name, '어깨 가로 당기기');
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
