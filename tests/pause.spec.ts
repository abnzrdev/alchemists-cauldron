import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
});
test('pause freezes time, blocks play, resume preserves stock and mixture, exit resets screen', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.clock.fastForward(20000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await expect(page.locator('.is-paused')).toHaveCount(1);
  expect(
    await page
      .locator('.ingredient-card')
      .first()
      .evaluate((el) => getComputedStyle(el).filter),
  ).toContain('blur');
  await page.clock.fastForward(60000);
  await expect(page.locator('#game-time')).toHaveText('02:10');
  await expect(page.locator('.ingredient-card:enabled')).toHaveCount(0);
  expect(await page.locator('.cauldron-hero').evaluate((el) => el.inert)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(page.locator('#game-time')).toHaveText('02:09');
  await expect(page.locator('.mixture-order li')).toHaveText(['Dragon Tears']);
  await expect(
    page.locator('[data-ingredient="dragon-tears"] .stock-badge'),
  ).toHaveText('1');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.screenshot({ path: 'test-results/pause.png', fullPage: true });
  await page.getByRole('button', { name: 'Exit to Menu', exact: true }).click();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await expect(page.locator('#game-time')).toHaveText('0');
  await expect(page.locator('#game-lives')).toHaveCount(0);
});
test('hidden-tab event auto pauses and requires explicit resume', async ({
  page,
}) => {
  await page.clock.fastForward(10000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await page.clock.fastForward(30000);
  await expect(page.locator('#game-time')).toHaveText('02:20');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(page.locator('#game-time')).toHaveText('02:19');
});
test('Help remains functional during play and freezes the run until resume', async ({
  page,
}) => {
  await page.getByRole('button', { name: /^help$/i }).click();
  await expect(
    page.getByRole('dialog', { name: 'The alchemist’s guide' }),
  ).toBeVisible();
  await page.clock.fastForward(10000);
  await expect(page.locator('#game-time')).toHaveText('02:30');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Experiment paused' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.is-paused')).toHaveCount(0);
});
