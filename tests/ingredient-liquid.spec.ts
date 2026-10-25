import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
});

test('all eight standalone illustrations load and retain native ingredient interactions', async ({
  page,
}) => {
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await expect(page.locator('.ingredient-slot img')).toHaveCount(0);
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  const cards = page.locator('.ingredient-card');
  await expect(cards).toHaveCount(8);
  for (const card of await cards.all()) {
    const id = await card.getAttribute('data-ingredient');
    const image = card.locator('img.ingredient-glyph');
    await expect(image).toHaveAttribute(
      'src',
      new RegExp(`assets/ingredients/${id}\\.webp$`),
    );
    await expect(image).toHaveAttribute('draggable', 'false');
    await expect(image).toHaveAttribute('alt', '');
    await expect
      .poll(() =>
        image.evaluate(
          (el) =>
            (el as HTMLImageElement).complete &&
            (el as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(card.locator('.stock-badge')).toHaveText('2');
  }
  const dragon = page.locator('[data-ingredient="dragon-tears"]');
  await dragon.locator('img').click();
  await expect(page.locator('.cauldron-liquid')).toBeVisible();
  await dragon.dragTo(page.locator('.hero-art'));
  await expect(dragon).toBeDisabled();
  await expect(dragon.locator('img')).toHaveCount(0);
  await expect(page.locator('.mixture-order li')).toHaveText([
    'Dragon Tears',
    'Dragon Tears',
  ]);
});

test('liquid follows mixture state, paused Continue and emptying without changing game results', async ({
  page,
}) => {
  const liquid = page.locator('.cauldron-liquid');
  await expect(liquid).toBeHidden();
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await expect(liquid).toBeHidden();
  await page.locator('[data-ingredient="dragon-tears"]').click();
  await expect(liquid).toBeVisible();
  await expect(page.locator('.cauldron')).toHaveAttribute(
    'alt',
    /containing ingredients/,
  );
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.potion-liquid-image')).toHaveCSS(
    'animation-play-state',
    'paused',
  );
  await page.reload();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page
    .getByRole('button', { name: 'Continue Game', exact: true })
    .click();
  await expect(liquid).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Pour Out', exact: true }).click();
  await expect(liquid).toBeHidden();
  await expect(page.locator('#game-time')).toHaveText('02:20');
  await page.locator('[data-ingredient="dragon-tears"]').click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(liquid).toBeHidden();
  await expect(page.locator('.brew-burst-failure img')).toHaveAttribute(
    'src',
    /final-polish\/vfx-reaction-eruption-overlay.webp$/,
  );
  await expect(
    page.locator('img[src$="effects/brew-success-splash.webp"]'),
  ).toHaveCount(0);
  await expect(page.locator('#game-lives')).toHaveText('Lives: 2 / 3');
  await page
    .getByRole('button', { name: 'Return to Menu', exact: true })
    .click();
  await expect(liquid).toBeHidden();
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
});

test('new splash is success-only; destructive reaction retains its original artwork and hides liquid', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  await page.locator('[data-ingredient="caustic-acid"]').click();
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(
    page.locator('.brew-burst-success .brew-vfx-layer'),
  ).toHaveAttribute('src', /assets\/effects\/brew-success-splash.webp$/);
  await expect(page.locator('.cauldron-liquid')).toBeHidden();
  await expect(page.locator('#game-score')).toHaveText('200');
  await page
    .getByRole('button', { name: 'Return to Menu', exact: true })
    .click();
  await page.getByRole('button', { name: /^menu$/i }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.locator('[data-ingredient="phoenix-feather"]').click();
  await expect(page.locator('.cauldron-liquid')).toBeVisible();
  await page.locator('[data-ingredient="essence-of-the-void"]').click();
  await expect(page.locator('.cauldron-liquid')).toBeHidden();
  await expect(page.locator('.brew-burst-eruption img')).toHaveAttribute(
    'src',
    /final-polish\/vfx-reaction-eruption-overlay.webp$/,
  );
  await expect(
    page.locator('img[src$="effects/brew-success-splash.webp"]'),
  ).toHaveCount(0);
});

for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1440, 768],
  [1920, 1080],
]) {
  test(`liquid is clipped behind the bronze rim with readable art and no overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.locator('[data-ingredient="fairy-dust"]').click();
    const liquid = page.locator('.cauldron-liquid');
    await expect(liquid).toBeVisible();
    await expect(liquid).toHaveCSS('overflow', 'hidden');
    expect(
      await liquid.evaluate((el) => getComputedStyle(el).clipPath),
    ).toContain('ellipse');
    const rimZ = await page
      .locator('.cauldron-front-rim')
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    const liquidZ = await liquid.evaluate((el) =>
      Number(getComputedStyle(el).zIndex),
    );
    expect(rimZ).toBeGreaterThan(liquidZ);
    const surface = (await liquid.boundingBox())!;
    const pot = (await page.locator('.cauldron').boundingBox())!;
    expect(surface.x).toBeGreaterThan(pot.x);
    expect(surface.x + surface.width).toBeLessThan(pot.x + pot.width);
    expect(surface.y + surface.height).toBeLessThan(pot.y + pot.height * 0.25);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const image of await page.locator('.ingredient-card img').all())
      await expect
        .poll(() => image.evaluate((el) => (el as HTMLImageElement).complete))
        .toBe(true);
    await page.screenshot({
      path: `test-results/ingredient-liquid-${width}.png`,
      fullPage: true,
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const element of await liquid.locator('*').all())
      await expect(element).toHaveCSS('animation-name', 'none');
  });
}
