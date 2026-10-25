import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

for (const width of [375, 1440]) {
  test(`Menu stays clean without valid save and preserves paused Continue at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await freezeClock(page);
    await page.goto('./');
    const menu = page.getByRole('button', { name: /^menu$/i });
    for (const raw of [
      null,
      'broken json',
      JSON.stringify({ version: 1, state: { status: 'game-over' } }),
    ]) {
      await page.evaluate(
        (raw) =>
          raw === null
            ? localStorage.removeItem('alchemists-cauldron:save')
            : localStorage.setItem('alchemists-cauldron:save', raw),
        raw,
      );
      await menu.click();
      await expect(
        page.getByRole('button', { name: 'Continue Game', exact: true }),
      ).toBeHidden();
      await expect(page.locator('#resume-summary')).toBeHidden();
      await expect(page.locator('#resume-summary')).toHaveText('');
      await expect(page.locator('#menu-dialog')).not.toContainText(
        'No unfinished game saved.',
      );
      await page.screenshot({
        path: `test-results/polish-menu-${width}.png`,
        fullPage: true,
      });
      await page
        .getByRole('button', { name: 'Back to the workshop', exact: true })
        .click();
    }
    await page.getByRole('button', { name: 'Start Game', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.reload();
    await menu.click();
    await expect(
      page.getByRole('button', { name: 'Continue Game', exact: true }),
    ).toBeVisible();
    await expect(page.locator('#resume-summary')).toContainText(
      'Saved Medium run',
    );
    await page
      .getByRole('button', { name: 'Continue Game', exact: true })
      .click();
    await expect(page.locator('#pause-dialog')).toBeVisible();
  });
}
