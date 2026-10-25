import { test, expect } from '@playwright/test';

test('local artwork loads, approved start and active controls fit desktop, responsive range has no horizontal overflow', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .locator('img')
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('16px "IM Fell English"') &&
        document.fonts.check('16px "Cormorant Garamond"'),
    ),
  ).toBe(true);

  for (const [width, height] of [
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 768],
    [1720, 800],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page.locator('.ingredient-slot')).toHaveCount(6);
    await expect(page.locator('#game-time')).toHaveText('0');
    await expect(page.locator('#game-score')).toHaveText('0');
    await expect(page.locator('#game-lives')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      for (const selector of [
        '#start-game',
        '.circular-control-help',
        '.circular-control-menu',
      ]) {
        const box = await page.locator(selector).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y + box!.height).toBeLessThanOrEqual(height);
      }
    }
    await page.screenshot({
      path: `test-results/final-start-${width}.png`,
      fullPage: true,
    });
  }

  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  for (let width = 375; width <= 1920; width += 25) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        { message: `horizontal overflow at ${width}px` },
      )
      .toBe(true);
  }
  for (const [width, height] of [
    [1024, 768],
    [1440, 768],
    [1720, 800],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const hero = (await page.locator('.cauldron-hero').boundingBox())!;
    const left = (await page.locator('.slot-group-left').boundingBox())!;
    const right = (await page.locator('.slot-group-right').boundingBox())!;
    expect(left.x + left.width).toBeLessThanOrEqual(hero.x);
    expect(hero.x + hero.width).toBeLessThanOrEqual(right.x);
    const brew = (await page.locator('[data-action="brew"]').boundingBox())!;
    expect(brew.y + brew.height).toBeLessThanOrEqual(height);
  }
  expect(errors).toEqual([]);
});
