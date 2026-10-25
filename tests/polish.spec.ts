import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 768],
  [1920, 1080],
]) {
  test(`Brew artwork stays clear of counters, statistics and controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await freezeClock(page);
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('./');
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.locator('[data-ingredient="fairy-dust"]').click();
    await page.locator('[data-ingredient="caustic-acid"]').click();
    await page.getByRole('button', { name: 'Brew', exact: true }).click();
    const hold = async (kind: string) => {
      const burst = page.locator(`.brew-burst-${kind}`);
      await expect(burst).toBeAttached();
      await burst.evaluate((el) =>
        el.getAnimations({ subtree: true }).forEach((animation) => {
          animation.pause();
          animation.currentTime = 400;
        }),
      );
      await expect
        .poll(() =>
          burst
            .locator('img')
            .evaluateAll((images) =>
              images.every(
                (img) =>
                  (img as HTMLImageElement).complete &&
                  (img as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      const box = (await burst.boundingBox())!;
      for (const target of await page
        .locator('.counter-slot, .parameter-bars, .primary-action, h1')
        .all()) {
        const other = (await target.boundingBox())!;
        expect(
          box.x + box.width <= other.x ||
            box.x >= other.x + other.width ||
            box.y + box.height <= other.y ||
            box.y >= other.y + other.height,
          `${width}px: effect ${JSON.stringify(box)} overlaps ${await target.getAttribute('class')} ${JSON.stringify(other)}`,
        ).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/polish-${kind}-${width}.png`,
        fullPage: true,
      });
      await burst.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.finish()),
      );
      await expect(burst).toHaveCount(0);
    };
    await hold('success');
    await page.locator('[data-ingredient="dragon-tears"]').click();
    await page.getByRole('button', { name: 'Brew', exact: true }).click();
    await hold('failure');
    await expect(page.locator('#game-score')).toHaveText('200');
    await expect(page.locator('#game-lives')).toHaveText('Lives: 2 / 3');
  });
}

for (const [difficulty, ids, kind] of [
  ['Medium', ['dragon-tears', 'caustic-acid'], 'steam'],
  [
    'Medium',
    ['mandrake-root', 'mandrake-root', 'mandrake-root', 'mandrake-root'],
    'steam',
  ],
  ['Hard', ['frost-lotus', 'essence-of-the-void'], 'arcane'],
  ['Hard', ['phoenix-feather', 'essence-of-the-void'], 'eruption'],
  ['Hard', ['dragon-tears', 'dragon-tears', 'fairy-dust'], 'eruption'],
] as const) {
  test(`${difficulty} ${ids.join('+')} uses ${kind} artwork on activation`, async ({
    page,
  }) => {
    await freezeClock(page);
    await page.addInitScript(() => {
      Math.random = () => 0.99;
    });
    await page.goto('./');
    await page.getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('button', { name: difficulty, exact: true }).click();
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    for (const id of ids)
      await page.locator(`[data-ingredient="${id}"]`).click();
    const burst = page.locator(`.brew-burst-${kind}`);
    await expect(burst).toBeAttached();
    await burst.evaluate((el) =>
      el.getAnimations({ subtree: true }).forEach((animation) => {
        animation.pause();
        animation.currentTime = 400;
      }),
    );
    await expect
      .poll(() =>
        burst
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    for (const [width, height] of [
      [375, 812],
      [768, 1024],
      [1024, 768],
      [1440, 768],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      await page.clock.runFor(20);
      const box = (await burst.boundingBox())!;
      for (const target of await page
        .locator('.counter-slot, .parameter-bars, .primary-action, h1')
        .all()) {
        const other = (await target.boundingBox())!;
        expect(
          box.x + box.width <= other.x ||
            box.x >= other.x + other.width ||
            box.y + box.height <= other.y ||
            box.y >= other.y + other.height,
          `${width}px: effect ${JSON.stringify(box)} overlaps ${await target.getAttribute('class')} ${JSON.stringify(other)}`,
        ).toBe(true);
      }
      await page.screenshot({
        path: `test-results/polish-reaction-${ids[0]}-${kind}-${width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    if (ids[0] === 'phoenix-feather') {
      await expect(page.locator('#game-lives')).toHaveText('Lives: 2 / 3');
      await expect(page.locator('#ingredient-counter')).toHaveText(
        'Ingredients: 0 / 5',
      );
    }
  });
}
