import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

for (const difficulty of ['Easy', 'Medium', 'Hard']) {
  test(`${difficulty}: populated game keeps information and controls separate across responsive layouts`, async ({
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
    for (let i = 0; i < (difficulty === 'Hard' ? 5 : 4); i++)
      await page
        .locator(
          `[data-ingredient="${difficulty === 'Medium' ? 'mandrake-root' : 'dragon-tears'}"]`,
        )
        .click();
    for (const [width, height] of [
      [375, 812],
      [768, 1024],
      [1024, 768],
      [1440, 768],
      [1720, 800],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      await page.clock.runFor(50);
      const bars = (await page.locator('.parameter-bars').boundingBox())!;
      const controls = (await page.locator('.primary-action').boundingBox())!;
      expect(bars.y + bars.height).toBeLessThanOrEqual(controls.y);
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
        for (const control of await page
          .locator('.run-button, .circular-control')
          .all()) {
          const box = (await control.boundingBox())!;
          expect(box.y + box.height).toBeLessThanOrEqual(height);
        }
      }
      await page.screenshot({
        path: `test-results/full-${difficulty}-${width}.png`,
        fullPage: true,
      });
    }
  });
}
