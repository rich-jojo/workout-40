import { test, expect } from '@playwright/test';

const dateInput = (page) => page.getByRole('textbox', { name: '날짜', exact: true });
const kgInput = (page) => page.getByRole('spinbutton', { name: '레그프레스 중량', exact: true });
const repsInput = (page) => page.getByRole('spinbutton', { name: '레그프레스 횟수', exact: true });
const doneInput = (page) => page.getByRole('checkbox', { name: '레그프레스 완료', exact: true });

test('weighted reps edit independently, save/reload/cancel and carry A→B→A', async ({ page }) => {
  await page.goto('./');
  await dateInput(page).fill('2026-09-03');
  await expect(repsInput(page)).toHaveValue('10');
  await expect(repsInput(page)).toHaveAttribute('step', '1');
  await expect(repsInput(page)).toHaveAttribute('inputmode', 'numeric');
  await page.getByRole('button', { name: '레그프레스 횟수 올리기' }).click();
  await expect(repsInput(page)).toHaveValue('11');
  await expect(kgInput(page)).toHaveValue('80');
  await page.getByRole('button', { name: '레그프레스 횟수 내리기' }).click();
  await expect(repsInput(page)).toHaveValue('10');
  await repsInput(page).fill('-1');
  await repsInput(page).blur();
  await expect(repsInput(page)).toHaveValue('0');
  await page.getByRole('button', { name: '레그프레스 횟수 내리기' }).click();
  await expect(repsInput(page)).toHaveValue('0');
  await repsInput(page).fill('12.8');
  await repsInput(page).blur();
  await expect(repsInput(page)).toHaveValue('12');
  await kgInput(page).fill('85');
  await doneInput(page).check();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await dateInput(page).fill('2026-09-03');
  await expect(kgInput(page)).toHaveValue('85');
  await expect(repsInput(page)).toHaveValue('12');
  await expect(doneInput(page)).toBeChecked();
  const stored = await page.evaluate(() => localStorage.getItem('workout-40-state'));
  await kgInput(page).fill('90');
  await repsInput(page).fill('14');
  await doneInput(page).uncheck();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(kgInput(page)).toHaveValue('85');
  await expect(repsInput(page)).toHaveValue('12');
  await expect(doneInput(page)).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('workout-40-state'))).toBe(stored);

  await dateInput(page).fill('2026-09-04');
  await expect(page.getByRole('heading', { name: '운동 B' })).toBeVisible();
  await page.getByRole('spinbutton', { name: '레그컬 횟수', exact: true }).fill('16');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await dateInput(page).fill('2026-09-05');
  await expect(page.getByRole('heading', { name: '운동 A' })).toBeVisible();
  await expect(kgInput(page)).toHaveValue('85');
  await expect(repsInput(page)).toHaveValue('12');
  await expect(doneInput(page)).not.toBeChecked();
  await kgInput(page).fill('90');
  await repsInput(page).fill('14');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await dateInput(page).fill('2026-09-03');
  await expect(kgInput(page)).toHaveValue('85');
  await expect(repsInput(page)).toHaveValue('12');
  await expect(doneInput(page)).toBeChecked();
});

for (const width of [320, 360, 393, 412]) {
  test(`numeric and completion targets fit without overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 851 });
    await page.goto('./');
    await dateInput(page).fill('2026-09-03');
    await expect(page.locator('.actions')).toHaveCSS('position', 'fixed');
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeInViewport();
    for (const workout of ['A', 'B']) {
      await page.getByRole('button', { name: `${workout} 루틴 선택` }).click();
      const first = page.locator('.exercise').first();
      await first.getByRole('checkbox').check();
      await expect(first.getByText('완료', { exact: true })).toBeVisible();
      expect(await page.locator('.exercise .stepper').count()).toBe(9);
      const problems = await page.evaluate(() => {
        const issues = [];
        if (document.documentElement.scrollWidth > innerWidth) issues.push('page overflow');
        for (const row of document.querySelectorAll('.exercise, .stretch-row')) {
          const bounds = row.getBoundingClientRect();
          const targets = [...row.querySelectorAll('.complete-toggle, .stepper button, .number-field')];
          const boxes = targets.map((node) => node.getBoundingClientRect());
          for (const box of boxes) {
            if (box.width < 44 || box.height < 44) issues.push('small target');
            if (box.left < bounds.left || box.right > bounds.right) issues.push('row overflow');
          }
          boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => {
            if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) issues.push('target overlap');
          }));
        }
        return issues;
      });
      expect(problems).toEqual([]);
    }
    await page.getByRole('button', { name: 'A 루틴 선택' }).click();
    await kgInput(page).fill('85');
    await repsInput(page).fill('12');
    await doneInput(page).check();
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await page.getByTestId('stretching-wall-calf').scrollIntoViewIfNeeded();
    const end = await page.evaluate(() => ({
      rowBottom: document.querySelector('[data-testid="stretching-wall-calf"]').getBoundingClientRect().bottom,
      actionsTop: document.querySelector('.actions').getBoundingClientRect().top
    }));
    expect(end.rowBottom).toBeLessThanOrEqual(end.actionsTop);
    if (width === 393) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: '/tmp/workout-stretching-mobile.png', fullPage: false });
    }
  });
}
