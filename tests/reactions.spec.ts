import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test('Steam Burst costs once, updates bars, survives paused reload and applies clock penalty', async ({
  page,
}) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.locator('[data-ingredient="dragon-tears"]').click();
  await page.locator('[data-ingredient="caustic-acid"]').click();
  await expect(page.locator('#game-time')).toHaveText('02:25');
  await expect(
    page.getByRole('meter', { name: 'Temperature', exact: true }),
  ).toHaveAttribute('aria-valuenow', '45');
  await expect(page.locator('.reaction-status')).toContainText('Steam Burst');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page
    .getByRole('button', { name: 'Continue Game', exact: true })
    .click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await expect(page.locator('#game-time')).toHaveText('02:25');
  await expect(
    page.getByRole('meter', { name: 'Temperature', exact: true }),
  ).toHaveAttribute('aria-valuenow', '57');
  await page.clock.fastForward(1000);
  await expect(page.locator('#game-time')).toHaveText('02:24');
});

test('Hard Volatile Mix clears the cauldron, spends stock and loses exactly one life', async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto('./');
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.locator('[data-ingredient="phoenix-feather"]').click();
  await page.locator('[data-ingredient="essence-of-the-void"]').click();
  await expect(page.locator('#game-lives')).toHaveText('Lives: 2 / 3');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 0 / 5',
  );
  await expect(page.locator('#brew-feedback')).toContainText('Volatile Mix');
  for (const meter of await page.getByRole('meter').all())
    await expect(meter).toHaveAttribute('aria-valuenow', '0');
  await expect(
    page.getByRole('button', { name: 'Brew', exact: true }),
  ).toBeDisabled();
});
