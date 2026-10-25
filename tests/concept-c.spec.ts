import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
});

test('ambient vapor follows the mixture, pauses, respects reduced motion and clears with the run', async ({
  page,
}) => {
  const vapor = page.locator('.cauldron-vapor');
  await expect(vapor).toBeHidden();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(vapor).toBeHidden();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await expect(vapor).toBeVisible();
  await expect(vapor).toHaveAttribute('aria-hidden', 'true');
  await expect(vapor).toHaveCSS('pointer-events', 'none');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(vapor).toHaveCSS('animation-play-state', 'paused');
  await page.reload();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page
    .getByRole('button', { name: 'Continue Game', exact: true })
    .click();
  await expect(vapor).toBeVisible();
  await expect(vapor).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(vapor).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Pour Out', exact: true }).click();
  await expect(vapor).toBeHidden();
  await page.locator('[data-ingredient="dragon-tears"]').click();
  await expect(vapor).toBeVisible();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(vapor).toBeHidden();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await page.locator('[data-ingredient="caustic-acid"]').click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(vapor).toBeHidden();
  await expect(page.locator('#game-score')).toHaveText('200');
  await page.locator('[data-ingredient="mandrake-root"]').click();
  await expect(vapor).toBeVisible();
  await page
    .getByRole('button', { name: 'Return to Menu', exact: true })
    .click();
  await expect(vapor).toBeHidden();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.locator('[data-ingredient="phoenix-feather"]').click();
  await expect(vapor).toBeVisible();
  await page.locator('[data-ingredient="essence-of-the-void"]').click();
  await expect(vapor).toBeHidden();
});

for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 768],
  [1920, 1080],
]) {
  test(`Concept C cards, vapor and native controls remain clear at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.locator('[data-ingredient="fairy-dust"]').click();
    const vapor = page.locator('.cauldron-vapor');
    await expect(vapor).toBeVisible();
    await expect
      .poll(() =>
        vapor
          .locator('img')
          .evaluate((el) => (el as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    const mist = (await vapor.boundingBox())!;
    for (const target of await page
      .locator('h1, .counter-slot, .parameter-bars, .primary-action')
      .all()) {
      const box = (await target.boundingBox())!;
      expect(
        mist.x + mist.width <= box.x ||
          mist.x >= box.x + box.width ||
          mist.y + mist.height <= box.y ||
          mist.y >= box.y + box.height,
      ).toBe(true);
    }
    for (const card of await page.locator('.ingredient-card').all()) {
      await expect(card.locator('.ingredient-card-stats > span')).toHaveCount(
        3,
      );
      const bounds = (await card.boundingBox())!;
      for (const content of await card
        .locator('.ingredient-glyph, .ingredient-card-stats, .stock-badge')
        .all()) {
        const inner = (await content.boundingBox())!;
        expect(inner.x).toBeGreaterThanOrEqual(bounds.x);
        expect(inner.x + inner.width).toBeLessThanOrEqual(
          bounds.x + bounds.width,
        );
        expect(inner.y + inner.height).toBeLessThanOrEqual(
          bounds.y + bounds.height,
        );
      }
    }
    const actions = page.locator('.run-actions');
    await expect(actions.getByRole('button')).toHaveCount(4);
    const buttons = await actions.getByRole('button').all();
    const first = (await buttons[0].boundingBox())!;
    for (const button of buttons)
      expect((await button.boundingBox())!.height).toBe(first.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/concept-c-${width}.png`,
      fullPage: true,
    });
  });
}
