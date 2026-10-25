import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

for (const difficulty of ['Easy', 'Medium', 'Hard']) {
  test(`${difficulty}: native dragging shares click stock and addition order`, async ({
    page,
  }) => {
    await freezeClock(page);
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.goto('./');
    await page.getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('button', { name: difficulty, exact: true }).click();
    await page.getByRole('button', { name: 'New Game', exact: true }).click();
    const dragon = page.locator('[data-ingredient="dragon-tears"]');
    const zone = page.locator('.hero-art');
    await dragon.dragTo(zone);
    await expect(dragon.locator('.stock-badge')).toHaveText('1');
    await page.locator('[data-ingredient="fairy-dust"]').click();
    await dragon.dragTo(zone);
    await expect(dragon.locator('.stock-badge')).toHaveText('0');
    await expect(dragon).toHaveAttribute('draggable', 'false');
    await expect(dragon).toBeDisabled();
    await expect(page.locator('.mixture-order li')).toHaveText([
      'Dragon Tears',
      'Fairy Dust',
      'Dragon Tears',
    ]);
    await expect(zone).not.toHaveClass(/is-drop-target/);
    await page.locator('[data-ingredient="frost-lotus"]').dragTo(zone);
    if (difficulty === 'Hard')
      await page.locator('[data-ingredient="mandrake-root"]').dragTo(zone);
    await expect(
      page.locator('.ingredient-card[draggable="true"]'),
    ).toHaveCount(0);
    await expect(page.locator('#ingredient-counter')).toContainText(
      difficulty === 'Hard' ? '5 / 5' : '4 / 4',
    );
    await page.screenshot({
      path: `test-results/drag-${difficulty}.png`,
      fullPage: true,
    });
  });
}

test('native drag highlights only the cauldron and clears on leaving; paused and foreign drops are ignored', async ({
  page,
}) => {
  await freezeClock(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  const card = page.locator('.ingredient-card').first();
  const zone = page.locator('.hero-art');
  const from = (await card.boundingBox())!;
  const to = (await zone.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.move(to.x + to.width / 2 + 2, to.y + to.height / 2);
  await expect(zone).toHaveClass(/is-drop-target/);
  await page.mouse.move(10, 10, { steps: 6 });
  await expect(zone).not.toHaveClass(/is-drop-target/);
  await page.mouse.up();
  await expect(page.locator('.mixture-order li')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await card.evaluate((el) => {
    const transfer = new DataTransfer();
    el.dispatchEvent(
      new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
    document.querySelector('.hero-art')!.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
  });
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await zone.evaluate((el) => {
    const transfer = new DataTransfer();
    transfer.setData('application/x-alchemists-ingredient', 'dragon-tears');
    el.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
  });
  await expect(page.locator('.mixture-order li')).toHaveCount(0);
  await expect(zone).not.toHaveClass(/is-drop-target/);
});
