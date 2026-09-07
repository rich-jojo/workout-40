import { test, expect } from '@playwright/test';

async function isGreenTinted(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    const border = style.borderColor.match(/\d+/g).map(Number);
    const background = style.backgroundColor.match(/\d+/g).map(Number);
    const greenBorder = border[1] > border[0] && border[1] > border[2];
    const greenBackground = background[1] >= background[0] && background[1] >= background[2];
    return greenBorder && greenBackground;
  });
}

test('앱을 열면 운동이 바로 보이고 중량을 ±로 저장·취소한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');

  await expect(page.getByRole('heading', { name: '운동 A' })).toBeVisible();
  const legPress = page.getByTestId('exercise-leg-press');
  await expect(legPress).toContainText('레그프레스');
  await expect(legPress.getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('80');

  await legPress.getByRole('button', { name: '레그프레스 중량 올리기' }).click();
  await expect(legPress.getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('85');
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status')).toHaveText('저장됨');

  await page.reload();
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await expect(page.getByTestId('exercise-leg-press').getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('85');

  await page.getByTestId('exercise-leg-press').getByRole('button', { name: '레그프레스 중량 올리기' }).click();
  await page.getByRole('button', { name: '취소' }).click();
  await expect(page.getByTestId('exercise-leg-press').getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('85');
});

test('본운동과 스트레칭은 각각 완료 체크와 명시 텍스트, 초록 상태를 갖는다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');

  const legPress = page.getByTestId('exercise-leg-press');
  const legPressDone = legPress.getByRole('checkbox', { name: '레그프레스 완료' });
  await expect(legPressDone).not.toBeChecked();
  await expect(legPress.getByText('완료', { exact: true })).toHaveCount(0);

  await legPressDone.check();
  await expect(legPressDone).toBeChecked();
  await expect(legPress.getByText('완료', { exact: true })).toBeVisible();
  expect(await isGreenTinted(legPress)).toBe(true);

  await legPressDone.uncheck();
  await expect(legPressDone).not.toBeChecked();
  await expect(legPress.getByText('완료', { exact: true })).toHaveCount(0);

  const stretch = page.getByTestId('stretching-shoulder-cross-body');
  const stretchDone = stretch.getByRole('checkbox', { name: '어깨 가로 당기기 완료' });
  await stretchDone.check();
  await expect(stretchDone).toBeChecked();
  await expect(stretch.getByText('완료', { exact: true })).toBeVisible();
  expect(await isGreenTinted(stretch)).toBe(true);
});

test('과거와 미래 날짜를 열어 저장한 기록을 다시 수정한다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2020-01-01');
  await page.getByTestId('exercise-leg-press').getByRole('button', { name: '레그프레스 중량 올리기' }).click();
  await page.getByRole('button', { name: '저장' }).click();

  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2030-12-31');
  await expect(page.getByRole('heading', { name: '운동 B' })).toBeVisible();
  await page.getByTestId('exercise-leg-curl').getByRole('button', { name: '레그컬 중량 올리기' }).click();
  await page.getByRole('button', { name: '저장' }).click();

  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2020-01-01');
  await expect(page.getByTestId('exercise-leg-press').getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('85');
  await page.getByTestId('exercise-leg-press').getByRole('button', { name: '레그프레스 중량 내리기' }).click();
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByTestId('exercise-leg-press').getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('80');
});

test('A/B 선택과 날짜 앞뒤 이동이 한 화면에서 동작한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await page.getByRole('button', { name: 'B 루틴 선택' }).click();
  await expect(page.getByRole('heading', { name: '운동 B' })).toBeVisible();

  await page.getByRole('button', { name: '다음 날짜' }).click();
  await expect(page.getByRole('textbox', { name: '날짜', exact: true })).toHaveValue('2026-09-04');
  await page.getByRole('button', { name: '이전 날짜' }).click();
  await expect(page.getByRole('textbox', { name: '날짜', exact: true })).toHaveValue('2026-09-03');
});

test('운동 전 준비동작은 A/B 준비세트를 바꾸고 rerender 뒤에도 열린 상태를 유지한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');

  const guide = page.getByTestId('pre-workout-guide');
  await expect(guide).not.toHaveJSProperty('open', true);
  await page.getByText('운동 전 준비동작').click();
  await expect(guide).toHaveJSProperty('open', true);
  await expect(guide).not.toContainText('40kg 10회 · 60kg 5회');
  await expect(guide).toContainText('팔꿈치 힘 빼기');

  await page.getByTestId('exercise-leg-press').getByRole('button', { name: '레그프레스 중량 올리기' }).click();
  await expect(guide).toHaveJSProperty('open', true);

  await page.getByRole('button', { name: '저장' }).click();
  await expect(guide).toHaveJSProperty('open', true);

  await page.getByRole('button', { name: 'B 루틴 선택' }).click();
  await expect(guide).toHaveJSProperty('open', true);
  await expect(guide).toContainText('레그컬 10kg 12회 · 로우 25kg 10회');

  await page.getByRole('button', { name: '다음 날짜' }).click();
  await expect(guide).toHaveJSProperty('open', true);
});

test('운동 후 스트레칭은 본운동 뒤 별도 섹션으로 항상 보인다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');

  const stretch = page.getByTestId('post-workout-stretching');
  const exerciseList = page.locator('.exercise-list');
  await expect(stretch).toBeVisible();
  await expect(stretch.getByRole('heading', { name: '스트레칭' })).toBeVisible();
  await expect(stretch).toContainText('운동 후 · 선택');
  const placement = await page.evaluate(() => {
    const list = document.querySelector('.exercise-list').getBoundingClientRect();
    const guide = document.querySelector('[data-testid="post-workout-stretching"]').getBoundingClientRect();
    return guide.top >= list.bottom;
  });
  expect(placement).toBe(true);

  await expect(stretch).toContainText('어깨 가로 당기기');
  await expect(stretch).toContainText('서서 앞허벅지 늘리기');
  await expect(stretch).toContainText('누워 뒤허벅지 늘리기');
  await expect(stretch).toContainText('벽 짚고 종아리 늘리기');
  await expect(stretch).toContainText('좌우 30초씩 · 1회');
  await expect(stretch).toContainText('근육이 따뜻한 운동 후');
  await expect(stretch).toContainText('반동');
  await expect(stretch).toContainText('숨 참지 않기');
  await expect(stretch).toContainText('통증');
  await expect(stretch).toContainText('저림');
  await expect(stretch).toContainText('유연성을 위한 선택');
  await expect(stretch).not.toContainText('가슴');
});

test('완료 체크는 저장 후 다시 열면 복원되고 취소하면 저장 상태로 돌아간다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await page.getByTestId('exercise-leg-press').getByRole('checkbox', { name: '레그프레스 완료' }).check();
  await page.getByTestId('stretching-shoulder-cross-body').getByRole('checkbox', { name: '어깨 가로 당기기 완료' }).check();
  await page.getByRole('button', { name: '저장' }).click();

  await page.reload();
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await expect(page.getByTestId('exercise-leg-press').getByRole('checkbox', { name: '레그프레스 완료' })).toBeChecked();
  await expect(page.getByTestId('stretching-shoulder-cross-body').getByRole('checkbox', { name: '어깨 가로 당기기 완료' })).toBeChecked();

  await page.getByTestId('exercise-lat-pulldown').getByRole('checkbox', { name: '랫풀다운 완료' }).check();
  await page.getByTestId('stretching-standing-quad').getByRole('checkbox', { name: '서서 앞허벅지 늘리기 완료' }).check();
  await page.getByRole('button', { name: '취소' }).click();
  await expect(page.getByTestId('exercise-lat-pulldown').getByRole('checkbox', { name: '랫풀다운 완료' })).not.toBeChecked();
  await expect(page.getByTestId('stretching-standing-quad').getByRole('checkbox', { name: '서서 앞허벅지 늘리기 완료' })).not.toBeChecked();
});

test('새 날짜와 강제 루틴 전환은 이전 완료 체크를 가져오지 않는다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await page.getByTestId('exercise-leg-press').getByRole('checkbox', { name: '레그프레스 완료' }).check();
  await page.getByTestId('stretching-shoulder-cross-body').getByRole('checkbox', { name: '어깨 가로 당기기 완료' }).check();
  await page.getByRole('button', { name: '저장' }).click();

  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-05');
  await page.getByRole('button', { name: 'A 루틴 선택' }).click();
  await expect(page.getByTestId('exercise-leg-press').getByRole('spinbutton', { name: '레그프레스 중량' })).toHaveValue('80');
  await expect(page.getByTestId('exercise-leg-press').getByRole('checkbox', { name: '레그프레스 완료' })).not.toBeChecked();
  await expect(page.getByTestId('stretching-shoulder-cross-body').getByRole('checkbox', { name: '어깨 가로 당기기 완료' })).not.toBeChecked();

  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await page.getByRole('button', { name: 'B 루틴 선택' }).click();
  await expect(page.getByTestId('exercise-leg-curl').getByRole('checkbox', { name: '레그컬 완료' })).not.toBeChecked();
});

test('모바일에서 펼친 준비동작과 스트레칭은 가로 넘침 없이 마지막 줄까지 보인다', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByRole('textbox', { name: '날짜', exact: true }).fill('2026-09-03');
  await page.getByText('운동 전 준비동작').click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const lastStretchRow = page.getByTestId('stretching-wall-calf');
  await lastStretchRow.scrollIntoViewIfNeeded();
  const geometry = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="stretching-wall-calf"]').getBoundingClientRect();
    const actions = document.querySelector('.actions').getBoundingClientRect();
    return { rowBottom: row.bottom, actionsTop: actions.top };
  });
  expect(geometry.rowBottom).toBeLessThanOrEqual(geometry.actionsTop);
});
