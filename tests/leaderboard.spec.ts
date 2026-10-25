import { freezeClock } from './clock';
import { test, expect } from '@playwright/test';
const key = 'alchemists-cauldron:leaderboard:level-1';
async function endRun(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.clock.fastForward(150000);
  await expect(
    page.getByRole('dialog', { name: 'Game Over', exact: true }),
  ).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.goto('./');
});
test('qualifying score validates names, saves once, opens leaderboard and returns to Game Over', async ({
  page,
}) => {
  await endRun(page);
  await expect(page.locator('#result-form')).toBeVisible();
  await page.getByLabel('You reached the Top 10! Your name').fill('!');
  await page.getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(page.locator('#result-status')).toContainText('Use 2-15');
  await page.getByLabel('You reached the Top 10! Your name').fill('Mage_One');
  await page.getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(page.locator('#result-status')).toContainText('Result saved');
  await expect(page.locator('#result-form')).not.toBeVisible();
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click();
  await expect(page.locator('#leaderboard-rows tr')).toHaveCount(1);
  await expect(page.locator('#leaderboard-rows')).toContainText('Mage_One');
  await expect(page.locator('.leaderboard-table th')).toHaveText([
    'Rank',
    'Name',
    'Score',
    'Difficulty',
    'Date',
  ]);
  await expect(page.locator('#leaderboard-rows td').last()).toHaveText(
    /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/,
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Game Over', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#result-form')).not.toBeVisible();
  await page
    .locator('#game-over-dialog')
    .getByRole('button', { name: 'Return to Menu', exact: true })
    .click();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click();
  await expect(page.locator('#leaderboard-rows tr')).toHaveCount(1);
  await page.screenshot({
    path: 'test-results/leaderboard.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Clear Leaderboard', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Clear these scores?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Keep scores', exact: true }).click();
  await expect(page.locator('#leaderboard-rows tr')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Clear Leaderboard', exact: true })
    .click();
  await page.getByRole('button', { name: 'Clear scores', exact: true }).click();
  await expect(page.locator('#leaderboard-empty')).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
});
test('full leaderboard excludes low/equal-later results and sorts earlier ties', async ({
  page,
}) => {
  await page.evaluate(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify(
          Array.from({ length: 10 }, (_, i) => ({
            name: `Mage${i}`,
            score: 0,
            date: 1000 + i,
          })),
        ),
      ),
    key,
  );
  await endRun(page);
  await expect(page.locator('#result-form')).not.toBeVisible();
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click();
  await expect(page.locator('#leaderboard-rows tr')).toHaveCount(10);
  await expect(page.locator('#leaderboard-rows tr').first()).toContainText(
    'Mage0',
  );
  await page.getByRole('button', { name: 'Back to Menu', exact: true }).click();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await expect(
    page.getByRole('button', { name: 'Easy', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Hard', exact: true }),
  ).toBeEnabled();
});
test('broken data and unavailable reads/writes are handled without losing Game Over', async ({
  page,
}) => {
  await page.evaluate((k) => localStorage.setItem(k, '{broken'), key);
  await endRun(page);
  await page.evaluate(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.getByLabel('You reached the Top 10! Your name').fill('Mage');
  await page.getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(page.locator('#result-status')).toContainText(
    'could not be saved',
  );
  await expect(
    page.getByRole('button', { name: 'Play again', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click();
  await expect(page.locator('#leaderboard-empty')).toBeVisible();
});
