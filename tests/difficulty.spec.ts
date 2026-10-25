import { test, expect } from '@playwright/test';
for (const [difficulty, count, capacity, time, lives, firstRecipe] of [
  ['Easy', 4, 4, '03:00', 5, 'Moon Mist'],
  ['Medium', 6, 4, '02:30', 3, 'Acid Spark'],
  ['Hard', 8, 5, '02:30', 3, 'Phoenix Pulse'],
] as const) {
  test(`${difficulty}: selectable settings, active shelf, capacity, locking and responsive layout`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('./');
    await page.getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('button', { name: difficulty, exact: true }).click();
    await expect(
      page.getByRole('button', { name: difficulty, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    await expect(page.locator('.ingredient-card')).toHaveCount(count);
    await expect(page.locator('#game-time')).toHaveText(time);
    await expect(page.locator('#game-lives')).toHaveText(
      `Lives: ${lives} / ${lives}`,
    );
    await expect(page.locator('.recipe-title')).toHaveText(firstRecipe);
    await expect(page.locator('.circular-control-menu')).toBeDisabled();
    for (const [width, height] of [
      [375, 812],
      [768, 1024],
      [1024, 768],
      [1440, 768],
      [1720, 800],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      for (const card of await page.locator('.ingredient-card').all()) {
        await expect(card.locator('.ingredient-card-stats')).toContainText(
          'Magic Power',
        );
        expect(
          await card.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
      }
      if (width >= 1024) {
        const last = (await page
          .locator('.slot-group-right .ingredient-card')
          .last()
          .boundingBox())!;
        const brew = (await page
          .locator('[data-action="brew"]')
          .boundingBox())!;
        expect(last.y + last.height).toBeLessThanOrEqual(brew.y);
      }
      await page.screenshot({
        path: `test-results/${difficulty}-${width}.png`,
        fullPage: true,
      });
    }
    for (let i = 0; i < capacity; i++)
      await page.locator('.ingredient-card:enabled').first().click();
    await expect(page.locator('#ingredient-counter')).toHaveText(
      `Ingredients: ${capacity} / ${capacity}`,
    );
    await expect(page.locator('.ingredient-card:enabled')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Return to Menu', exact: true })
      .click();
    await expect(page.locator('.ingredient-slot')).toHaveCount(6);
    await page.getByRole('button', { name: /^menu$/i }).click();
    await expect(
      page.getByRole('button', { name: difficulty, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
}

test('Hard results use the Hard Top10, filtering and clearing leave Medium intact', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('./');
  await page.evaluate(() =>
    localStorage.setItem(
      'alchemists-cauldron:leaderboard:level-1',
      JSON.stringify([{ name: 'MediumMage', score: 200, date: 1 }]),
    ),
  );
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.clock.fastForward(150000);
  await page.getByLabel('You reached the Top 10! Your name').fill('HardMage');
  await page.getByRole('button', { name: 'Save result', exact: true }).click();
  await expect(page.locator('#result-status')).toContainText('Result saved');
  await page.getByRole('button', { name: 'Leaderboard', exact: true }).click();
  await expect(page.locator('#leaderboard-difficulty')).toHaveValue('hard');
  await expect(page.locator('#leaderboard-rows')).toContainText('HardMage');
  await expect(page.locator('#leaderboard-rows')).toContainText('Hard');
  await page.locator('#leaderboard-difficulty').selectOption('medium');
  await expect(page.locator('#leaderboard-rows')).toContainText('MediumMage');
  await page.locator('#leaderboard-difficulty').selectOption('easy');
  await expect(page.locator('#leaderboard-empty')).toBeVisible();
  await page.locator('#leaderboard-difficulty').selectOption('hard');
  await page
    .getByRole('button', { name: 'Clear Leaderboard', exact: true })
    .click();
  await page.getByRole('button', { name: 'Clear scores', exact: true }).click();
  await expect(page.locator('#leaderboard-empty')).toBeVisible();
  await page.locator('#leaderboard-difficulty').selectOption('medium');
  await expect(page.locator('#leaderboard-rows')).toContainText('MediumMage');
});
