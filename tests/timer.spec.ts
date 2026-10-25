import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
});
test('150-second timestamp countdown, urgent state, timeout and fresh play again', async ({
  page,
}) => {
  await expect(page.locator('#game-time')).toHaveText('02:30');
  await expect(page.locator('#game-lives')).toHaveText('Lives: 3 / 3');
  await page.clock.fastForward(136000);
  await expect(page.locator('#game-time')).toHaveText('00:14');
  await expect(page.locator('.timer-urgent')).toHaveCount(1);
  await page.clock.fastForward(14000);
  await expect(page.getByRole('dialog', { name: 'Game Over' })).toBeVisible();
  await expect(page.locator('#game-over-reason')).toHaveText('Time is up');
  await expect(page.locator('#game-time')).toHaveText('00:00');
  await page.getByRole('button', { name: 'Play again', exact: true }).click();
  await expect(page.locator('#game-time')).toHaveText('02:30');
  await expect(page.locator('#game-lives')).toHaveText('Lives: 3 / 3');
  await expect(page.locator('.ingredient-card')).toHaveCount(6);
});
test('three failed brews end run with lives reason', async ({ page }) => {
  for (const ingredient of ['Dragon Tears', 'Dragon Tears', 'Mandrake Root']) {
    await page.getByRole('button', { name: ingredient, exact: true }).click();
    await page.getByRole('button', { name: 'Brew', exact: true }).click();
  }
  await expect(page.locator('#game-over-reason')).toHaveText('No lives left');
  await expect(page.locator('#final-score')).toHaveText('0');
  await page.screenshot({ path: 'test-results/game-over.png', fullPage: true });
});
test('successful brew adds time without exceeding 150', async ({ page }) => {
  await page.clock.fastForward(20000);
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await page.getByRole('button', { name: 'Caustic Acid', exact: true }).click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(page.locator('#game-time')).toHaveText('02:20');
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await page.getByRole('button', { name: 'Caustic Acid', exact: true }).click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(page.locator('#game-time')).toHaveText('02:30');
});

test('empty shelf keeps last mixture brewable, then ends Out of ingredients', async ({
  page,
}) => {
  // Start a fresh deterministic game: Rooted Night initially, stock 2, then Acid Spark.
  await page.evaluate(() => {
    let calls = 0;
    Math.random = () => (calls++ === 0 ? 0.999 : 0);
  });
  await page.getByRole('button', { name: 'Return to Menu' }).click();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  for (const mix of [
    ['Essence of the Void', 'Mandrake Root'],
    ['Fairy Dust', 'Caustic Acid'],
    ['Fairy Dust', 'Caustic Acid'],
    ['Dragon Tears', 'Dragon Tears', 'Frost Lotus', 'Frost Lotus'],
    ['Essence of the Void', 'Mandrake Root'],
  ]) {
    for (const name of mix)
      await page.getByRole('button', { name, exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Game Over' }),
    ).not.toBeVisible();
    await page.getByRole('button', { name: 'Brew', exact: true }).click();
  }
  await expect(page.locator('#game-over-reason')).toHaveText(
    'Out of ingredients',
  );
  await expect(page.locator('#final-score')).toHaveText('600');
});
