import { test, expect } from '@playwright/test';

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
