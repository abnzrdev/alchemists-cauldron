import { test, expect } from '@playwright/test';
test('bars start at zero, update existing markers smoothly, support negative sums and highlight targets', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const meters = page.getByRole('meter');
  await expect(meters).toHaveCount(3);
  for (const meter of await meters.all())
    await expect(meter).toHaveAttribute('aria-valuenow', '0');
  await page.evaluate(() => {
    document
      .querySelector('.parameter-marker')
      ?.setAttribute('data-preserved', 'yes');
  });
  await page
    .getByRole('button', { name: 'Essence of the Void', exact: true })
    .click();
  await expect(
    page.getByRole('meter', { name: 'Temperature', exact: true }),
  ).toHaveAttribute('aria-valuenow', '-20');
  await expect(
    page.getByRole('meter', { name: 'Density', exact: true }),
  ).toHaveAttribute('aria-valuenow', '-10');
  await expect(page.locator('[data-preserved="yes"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Dragon Tears', exact: true }).click();
  await page.getByRole('button', { name: 'Fairy Dust', exact: true }).click();
  await expect(
    page.getByRole('meter', { name: 'Temperature', exact: true }),
  ).toHaveAttribute('aria-valuenow', '17');
  await expect(
    page.getByRole('meter', { name: 'Temperature', exact: true }),
  ).toHaveClass(/parameter-in-range/);
  await page.setViewportSize({ width: 1440, height: 768 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/bars-desktop.png',
    fullPage: true,
  });
});
