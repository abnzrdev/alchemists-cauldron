import test from 'node:test';
import assert from 'node:assert/strict';
import { positionTooltip } from '../src/ui/tooltip-position.ts';

test('tooltip opens right/down normally and left/up at viewport edges', () => {
  const size = { width: 220, height: 100 };
  const viewport = { width: 1440, height: 768 };
  assert.deepEqual(
    positionTooltip(
      { left: 30, right: 200, top: 100, bottom: 210 },
      size,
      viewport,
    ),
    { left: 208, top: 100, leftward: false, upward: false },
  );
  assert.deepEqual(
    positionTooltip(
      { left: 1200, right: 1400, top: 700, bottom: 760 },
      size,
      viewport,
    ),
    { left: 972, top: 592, leftward: true, upward: true },
  );
});

test('tooltip clamps to small viewports even when its card is partially offscreen', () => {
  for (const card of [
    { left: -20, right: 150, top: -50, bottom: 60 },
    { left: 200, right: 370, top: 800, bottom: 910 },
  ]) {
    const position = positionTooltip(
      card,
      { width: 220, height: 100 },
      { width: 375, height: 812 },
    );
    assert.ok(position.left >= 8 && position.left + 220 <= 367);
    assert.ok(position.top >= 8 && position.top + 100 <= 804);
  }
});
