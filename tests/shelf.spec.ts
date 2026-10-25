import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
});
test('empty start, readable active shelf, spending, order, capacity and fresh restart', async ({
  page,
}) => {
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await expect(page.locator('.ingredient-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(page.locator('.ingredient-card')).toHaveCount(6);
  for (const card of await page.locator('.ingredient-card').all()) {
    await expect(card.locator('.ingredient-card-stats')).toContainText(
      'Temperature',
    );
    await expect(card.locator('.ingredient-card-stats')).toContainText(
      'Density',
    );
    await expect(card.locator('.ingredient-card-stats')).toContainText(
      'Magic Power',
    );
    await expect(card.locator('.stock-badge')).toHaveText('2');
  }
  const dragon = page.locator('[data-ingredient="dragon-tears"]');
  await dragon.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(dragon).toBeDisabled();
  await expect(dragon.locator('.ingredient-card-heading')).toHaveCount(0);
  await expect(dragon.locator('.stock-badge')).toHaveText('0');
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await page.getByRole('button', { name: 'Frost Lotus', exact: true }).click();
  await expect(page.locator('.mixture-order li')).toHaveText([
    'Dragon Tears',
    'Dragon Tears',
    'Fairy Dust',
    'Frost Lotus',
  ]);
  await expect(page.locator('.ingredient-card:enabled')).toHaveCount(0);
  await expect(page.locator('#ingredient-counter')).toBeFocused();
  await page.getByRole('button', { name: 'Return to Menu' }).click();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(dragon.locator('.stock-badge')).toHaveText('2');
});
for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 768],
  [1720, 800],
  [1920, 1080],
]) {
  test(`responsive initial and active shelf ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await expect(page.locator('.ingredient-slot')).toHaveCount(6);
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await expect(page.locator('.ingredient-card')).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const card of await page.locator('.ingredient-card').all()) {
      expect(
        await card.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/shelf-${width}.png`,
      fullPage: true,
    });
  });
}
