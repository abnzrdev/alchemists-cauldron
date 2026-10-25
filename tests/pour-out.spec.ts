import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test('Pour Out updates bars/counter/save, does not refund stock or lives, and respects pause/time out', async ({
  page,
}) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const pour = page.getByRole('button', { name: 'Pour Out', exact: true });
  await expect(pour).toBeDisabled();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(pour).toBeDisabled();
  await pour.dispatchEvent('click');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 1 / 4',
  );
  await pour.click();
  await expect(page.locator('#game-time')).toHaveText('02:20');
  await expect(page.locator('#game-lives')).toHaveText('Lives: 3 / 3');
  await expect(page.locator('#game-score')).toHaveText('0');
  await expect(page.locator('.recipe-title')).toHaveText('Acid Spark');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 0 / 4',
  );
  await expect(
    page.locator('[data-ingredient="fairy-dust"] .stock-badge'),
  ).toHaveText('1');
  await expect(pour).toBeDisabled();
  for (const meter of await page.getByRole('meter').all())
    await expect(meter).toHaveAttribute('aria-valuenow', '0');
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('alchemists-cauldron:save')!).state,
  );
  expect(saved.cauldronIngredients).toEqual([]);
  expect(saved.timeLeft).toBe(140);
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await page.clock.fastForward(135000);
  await pour.click();
  await expect(page.locator('#game-over-dialog')).toBeVisible();
  await expect(page.locator('#game-over-reason')).toContainText('Time');
});
