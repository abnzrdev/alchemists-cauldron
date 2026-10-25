import { test, expect } from '@playwright/test';
test('recipe, successful and failed brewing, counter and spent stock', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
  await expect(
    page.getByRole('button', { name: 'Brew', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const brew = page.getByRole('button', { name: 'Brew', exact: true });
  await expect(brew).toBeDisabled();
  await expect(page.locator('.recipe-panel')).toContainText('Acid Spark');
  await expect(page.locator('.recipe-panel')).toContainText('Target: 17 to 27');
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await page.getByRole('button', { name: 'Caustic Acid', exact: true }).click();
  await brew.click();
  await expect(page.locator('#game-score')).toHaveText('200');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 0 / 4',
  );
  await expect(page.locator('#brew-feedback')).toContainText('Potion brewed');
  await expect(brew).toBeDisabled();
  await expect(
    page.locator('[data-ingredient="fairy-dust"] .stock-badge'),
  ).toHaveText('1');
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await brew.click();
  await expect(page.locator('#brew-feedback')).toContainText('One life lost');
  await expect(page.locator('#game-score')).toHaveText('200');
  await expect(
    page.locator('[data-ingredient="dragon-tears"] .stock-badge'),
  ).toHaveText('1');
  await page.setViewportSize({ width: 1440, height: 768 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/brewing-desktop.png',
    fullPage: true,
  });
});
