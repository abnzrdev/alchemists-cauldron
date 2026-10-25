import { test, expect } from '@playwright/test';

test('CSS success, explosion, short shake and floating icons replay and clean up', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.locator('[data-ingredient="fairy-dust"]').click();
  const glyph = page.locator('.cauldron-content .ingredient-glyph');
  await expect(glyph).toHaveCSS('animation-name', 'ingredient-float');
  await page.locator('[data-ingredient="caustic-acid"]').click();
  const brew = page.getByRole('button', { name: 'Brew', exact: true });
  await brew.click();
  await expect(page.locator('.brew-burst-success')).toHaveCSS(
    'animation-name',
    'brew-burst',
  );
  await page.locator('.brew-burst').evaluate((el) =>
    el.getAnimations().forEach((animation) => {
      animation.pause();
      animation.currentTime = 200;
    }),
  );
  await page.screenshot({
    path: 'test-results/brew-success.png',
    fullPage: true,
  });
  await page
    .locator('.brew-burst')
    .evaluate((el) =>
      el.getAnimations().forEach((animation) => animation.play()),
    );
  await expect(page.locator('.brew-burst')).toHaveCount(0);
  for (let i = 0; i < 2; i++) {
    await page.locator('[data-ingredient="dragon-tears"]').click();
    await brew.click();
    await expect(page.locator('.brew-burst-failure')).toBeAttached();
    await expect(page.locator('.start-screen')).toHaveClass(/brew-failed/);
    await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation &&
            ['brew-shake', 'brew-burst'].includes(animation.animationName),
        )
        .forEach((animation) => {
          animation.pause();
          animation.currentTime = 140;
        }),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/brew-failure-${i}.png`,
      fullPage: true,
    });
    await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation &&
            ['brew-shake', 'brew-burst'].includes(animation.animationName),
        )
        .forEach((animation) => animation.play()),
    );
    await expect(page.locator('.start-screen')).not.toHaveClass(/brew-failed/);
    await expect(page.locator('.brew-burst')).toHaveCount(0);
  }
  await expect(page.locator('#game-lives')).toHaveText('Lives: 1 / 3');
  await expect(page.locator('#game-score')).toHaveText('200');
});

test('reduced motion disables shake, icon movement and bar transitions', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.locator('[data-ingredient="dragon-tears"]').click();
  await expect(page.locator('.cauldron-content .ingredient-glyph')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.locator('.parameter-marker').first()).toHaveCSS(
    'transition-duration',
    '0s',
  );
  await page.getByRole('button', { name: 'Brew', exact: true }).click();
  await expect(page.locator('.start-screen')).not.toHaveClass(/brew-failed/);
  await expect(page.locator('.brew-burst')).toHaveCount(0);
});
