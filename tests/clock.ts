import type { Page } from '@playwright/test';

export async function freezeClock(page: Page): Promise<void> {
  const time = new Date('2026-10-25T00:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
}
