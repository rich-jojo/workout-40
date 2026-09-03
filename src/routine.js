const commonWarmup = [
  { label: '제자리 걷기', value: '1분' },
  { label: '팔 돌리기 앞', value: '10회' },
  { label: '팔 돌리기 뒤', value: '10회' },
  { label: '맨몸 스쿼트', value: '10회' }
];

export const routine = {
  A: {
    focus: '등 넓이 · 어깨 · 하체',
    warmup: [...commonWarmup, { label: '레그프레스', value: '40kg 10회 · 60kg 5회' }],
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
    warmup: [...commonWarmup, { label: '준비세트', value: '레그컬 10kg 12회 · 로우 25kg 10회' }],
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
