const commonWarmup = [
  { label: '제자리 걷기', value: '1분', cue: '발바닥을 부드럽게 굴리기' },
  { label: '팔 돌리기 앞', value: '10회', cue: '팔꿈치 힘 빼기' },
  { label: '팔 돌리기 뒤', value: '10회', cue: '어깨를 낮게 두기' },
  { label: '맨몸 스쿼트', value: '10회', cue: '무릎과 발끝 방향 맞추기' }
];

const stretching = [
  {
    id: 'shoulder-cross-body',
    name: '어깨 가로 당기기',
    dose: '좌우 30초씩 · 1회',
    cue: '어깨를 내리고 팔을 반대쪽으로 가볍게 당기기'
  },
  {
    id: 'standing-quad',
    name: '서서 앞허벅지 늘리기',
    dose: '좌우 30초씩 · 1회',
    cue: '벽을 짚고 발목을 잡아 뒤꿈치를 엉덩이 쪽으로 당기기'
  },
  {
    id: 'lying-hamstring',
    name: '누워 뒤허벅지 늘리기',
    dose: '좌우 30초씩 · 1회',
    cue: '허벅지를 잡고 무릎을 천천히 펴기'
  },
  {
    id: 'wall-calf',
    name: '벽 짚고 종아리 늘리기',
    dose: '좌우 30초씩 · 1회',
    cue: '뒷발 뒤꿈치를 바닥에 두고 밀기'
  }
];

export const routine = {
  A: {
    focus: '등 넓이 · 어깨 · 하체',
    warmup: [...commonWarmup],
    exercises: [
      { id: 'leg-press', name: '레그프레스', value: 80, unit: 'kg', reps: 10, sets: 3, rest: 120, step: 5 },
      { id: 'lat-pulldown', name: '랫풀다운', value: 60, unit: 'kg', reps: 8, sets: 3, rest: 120, step: 5 },
      { id: 'shoulder-press', name: '숄더프레스', value: 20, unit: 'kg', reps: 10, sets: 3, rest: 90, step: 5 },
      { id: 'lateral-raise', name: '레터럴레이즈', value: 4, unit: 'kg씩', reps: 15, sets: 3, rest: 60, step: 1 },
      { id: 'reverse-crunch', name: '리버스 크런치', value: 12, unit: '회', reps: null, sets: 3, rest: 45, step: 1 }
    ]
  },
  B: {
    focus: '등 두께 · 팔 · 뒤허벅지',
    warmup: [...commonWarmup, { label: '준비세트', value: '레그컬 10kg 12회 · 로우 25kg 10회', cue: '가볍게 당기고 관절 위치 확인하기' }],
    exercises: [
      { id: 'leg-curl', name: '레그컬', value: 20, unit: 'kg', reps: 12, sets: 3, rest: 60, step: 5 },
      { id: 'seated-row', name: '시티드로우', value: 50, unit: 'kg', reps: 10, sets: 3, rest: 90, step: 5 },
      { id: 'dumbbell-curl', name: '덤벨컬', value: 8, unit: 'kg씩', reps: 10, sets: 3, rest: 60, step: 1 },
      { id: 'pushdown', name: '케이블 푸시다운', value: 20, unit: 'kg', reps: 12, sets: 3, rest: 60, step: 5 },
      { id: 'plank', name: '플랭크', value: 40, unit: '초', reps: null, sets: 3, rest: 45, step: 5 }
    ]
  }
};

export function getWorkout(key) {
  if (!routine[key]) throw new Error(`Unknown workout: ${key}`);
  return structuredClone(routine[key]);
}

export function getStretching() {
  return structuredClone(stretching);
}
