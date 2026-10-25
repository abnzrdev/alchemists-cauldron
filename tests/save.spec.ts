import { freezeClock } from './clock';
import { test, expect } from '@playwright/test';
const key = 'alchemists-cauldron:save';
test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
});
test('reload restores Hard difficulty, exact ordered mixture and stock paused despite different new-game preference', async ({
  page,
}) => {
  await page.getByRole('button', { name: /^menu$/i }).click();
  await expect(
    page.getByRole('button', { name: 'Continue Game', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page
    .getByRole('button', { name: 'Phoenix Feather', exact: true })
    .click();
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(page.locator('#game-score')).toHaveText('300');
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.clock.fastForward(12500);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const before = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).state,
    key,
  );
  expect(before.status).toBe('paused');
  expect(before.cauldronIngredients.map((i: { id: string }) => i.id)).toEqual([
    'dragon-tears',
    'dragon-tears',
  ]);
  await page.reload();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await expect(page.locator('#resume-summary')).toContainText('Saved Hard run');
  await page
    .getByRole('button', { name: 'Continue Game', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await expect(page.locator('.ingredient-card')).toHaveCount(8);
  await expect(page.locator('#game-score')).toHaveText('300');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 2 / 5',
  );
  await expect(
    page.locator('[data-ingredient="dragon-tears"] .stock-badge'),
  ).toHaveText('0');
  await page.clock.fastForward(60000);
  const restored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).state,
    key,
  );
  expect(restored).toEqual(before);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.fastForward(1000);
  const resumed = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).state,
    key,
  );
  expect(resumed.difficulty).toBe('hard');
  expect(resumed.timeLeft).toBeCloseTo(before.timeLeft - 1, 0);
  expect(resumed.shelfStock).toEqual(before.shelfStock);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Exit to Menu', exact: true }).click();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await expect(
    page.getByRole('button', { name: 'Continue Game', exact: true }),
  ).not.toBeVisible();
});
test('running reload checkpoints time, new game replaces save and Game Over clears it', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.clock.fastForward(12300);
  await page.reload();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page
    .getByRole('button', { name: 'Continue Game', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await expect(page.locator('#game-time')).toHaveText('02:18');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.fastForward(150000);
  await expect(
    page.getByRole('dialog', { name: 'Game Over', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await expect(
    page.locator('[data-ingredient="dragon-tears"] .stock-badge'),
  ).toHaveText('2');
  await page.reload();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).state,
    key,
  );
  expect(saved.difficulty).toBe('easy');
  expect(saved.timeLeft).toBe(180);
  expect(saved.cauldronIngredients).toEqual([]);
  expect(Object.keys(saved.shelfStock)).toHaveLength(4);
});
test('corrupt/outdated data hides Continue and unavailable storage permits play', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const raw of [
    '{broken',
    JSON.stringify({ version: 99, state: {} }),
    JSON.stringify({ version: 1, state: { difficulty: 'hard' } }),
  ]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    });
    await page.reload();
    await page.getByRole('button', { name: /^menu$/i }).click();
    await expect(
      page.getByRole('button', { name: 'Continue Game', exact: true }),
    ).not.toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
    await page.keyboard.press('Escape');
  }
  await page.evaluate(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('.ingredient-card')).toHaveCount(6);
  await expect(page.locator('#save-status')).toContainText(
    'could not be saved',
  );
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  expect(errors).toEqual([]);
});
