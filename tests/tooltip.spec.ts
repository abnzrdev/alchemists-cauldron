import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0.9;
  });
  await page.goto('./');
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
});

test('Hard hover/focus tooltip shows signed base statistics and stock, preserves native click and keyboard, hides paused', async ({
  page,
}) => {
  const tooltip = page.getByRole('tooltip');
  const dragon = page.locator('[data-ingredient="dragon-tears"]');
  await page.locator('[data-action="pause"]').focus();
  await expect(dragon.locator('.ingredient-card-stats')).toHaveCount(0);
  await dragon.hover();
  await expect(tooltip).toContainText('Temperature +25');
  await expect(tooltip).toContainText('Density +8');
  await expect(dragon).toHaveAttribute(
    'aria-describedby',
    'ingredient-tooltip',
  );
  await page.mouse.move(1, 1);
  await expect(tooltip).toBeHidden();
  await page.locator('[data-ingredient="essence-of-the-void"]').focus();
  await expect(tooltip).toContainText('Temperature −20');
  await expect(tooltip).toContainText('Density −10');
  await page.locator('[data-ingredient="toad-slime"]').focus();
  await expect(tooltip).toContainText('Magic Power 0');
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await dragon.click();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mixture-order li')).toHaveText([
    'Dragon Tears',
    'Dragon Tears',
  ]);
  await expect(dragon.locator('.stock-badge')).toHaveText('12');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(tooltip).toBeHidden();
  await dragon.dispatchEvent('pointerover');
  await expect(tooltip).toBeHidden();
});

test('tooltips reposition left/up at edges and never overflow responsive viewports', async ({
  page,
}) => {
  for (const [width, height] of [
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 768],
    [1720, 800],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    const card = page.locator('[data-ingredient="toad-slime"]');
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    const box = (await tooltip.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    const bars = (await page.locator('.parameter-bars').boundingBox())!;
    expect(
      box.x + box.width <= bars.x ||
        box.x >= bars.x + bars.width ||
        box.y + box.height <= bars.y ||
        box.y >= bars.y + bars.height,
    ).toBe(true);
    for (const control of await page
      .locator('.circular-control, .primary-action')
      .all()) {
      const bounds = (await control.boundingBox())!;
      expect(
        box.x + box.width <= bounds.x ||
          box.x >= bounds.x + bounds.width ||
          box.y + box.height <= bounds.y ||
          box.y >= bounds.y + bounds.height,
      ).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/tooltip-${width}.png`,
      fullPage: true,
    });
    await page.locator('[data-action="brew"]').focus();
  }
  const card = page.locator('[data-ingredient="toad-slime"]');
  await card.evaluate((el) => {
    el.style.position = 'fixed';
    el.style.right = '8px';
    el.style.bottom = '8px';
  });
  await card.hover();
  await expect(page.getByRole('tooltip')).toHaveClass(/tooltip-left/);
  await expect(page.getByRole('tooltip')).toHaveClass(/tooltip-up/);
});
