import { test, expect } from '@playwright/test';
import { freezeClock } from './clock';

test.beforeEach(async ({ page }) => {
  await freezeClock(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto('./');
});

test('shortcuts are gated by screens; native resume, Enter/Space and single actions remain correct', async ({
  page,
}) => {
  await page.keyboard.press('1');
  await page.keyboard.press('b');
  await page.keyboard.press('p');
  await expect(page.locator('.ingredient-slot')).toHaveCount(6);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.keyboard.press('2');
  await page.keyboard.press('5');
  await page.keyboard.press('b');
  await expect(page.locator('#game-score')).toHaveText('200');
  await page.keyboard.press('1');
  await page.keyboard.press('p');
  await expect(page.locator('#pause-dialog')).toBeVisible();
  await page.keyboard.press('x');
  await page.keyboard.press('b');
  await page.keyboard.press('2');
  await page.keyboard.press('p');
  await expect(page.locator('#pause-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 1 / 4',
  );
  await page.keyboard.press('x');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 0 / 4',
  );
  await expect(page.locator('#game-time')).toHaveText('02:20');
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('p');
    await page.keyboard.press('Escape');
  }
  await page.keyboard.press('1');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 1 / 4',
  );
  await page.locator('[data-ingredient="fairy-dust"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 2 / 4',
  );
  await page.locator('[data-ingredient="mandrake-root"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 3 / 4',
  );
  await page.clock.fastForward(140000);
  await expect(page.locator('#game-over-dialog')).toBeVisible();
  const input = page.getByLabel('You reached the Top 10! Your name');
  await input.fill('pBx123');
  await expect(input).toHaveValue('pBx123');
  await page.keyboard.press('x');
  await expect(page.locator('#game-over-dialog')).toBeVisible();
});

test('typing, modifiers and held keys never invoke gameplay actions', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start Game', exact: true }).click();
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'typing-test';
    document.querySelector('#app')!.append(input);
    input.focus();
  });
  await page.locator('#typing-test').fill('1bpx');
  await page.keyboard.press('2');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 0 / 4',
  );
  await page.locator('[data-ingredient="dragon-tears"]').focus();
  await page.keyboard.press('Control+1');
  await page.keyboard.down('1');
  await page.keyboard.down('1');
  await page.keyboard.up('1');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 1 / 4',
  );
  await page.keyboard.press('8');
  await expect(page.locator('#ingredient-counter')).toHaveText(
    'Ingredients: 1 / 4',
  );
});
