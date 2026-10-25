import test from 'node:test';
import assert from 'node:assert/strict';
import { RunClock, formatTime, getEndReason } from '../src/logic/timer.ts';
import { createGame, addIngredient } from '../src/state/game-state.ts';
test('timestamp clock accounts for delayed callbacks and reset bonuses', () => {
  let now = 1000;
  const clock = new RunClock(150, () => now);
  now += 12500;
  assert.equal(clock.remaining(), 137.5);
  now += 120000;
  assert.equal(clock.remaining(), 17.5);
  clock.reset(27.5);
  now += 1000;
  assert.equal(clock.remaining(), 26.5);
  now += 100000;
  assert.equal(clock.remaining(), 0);
  assert.equal(formatTime(150), '02:30');
  assert.equal(formatTime(60), '01:00');
  assert.equal(formatTime(14.2), '00:15');
  assert.equal(formatTime(-1), '00:00');
});
test('three end reasons; empty shelf can still brew remaining mixture', () => {
  const state = createGame(() => 0);
  assert.equal(getEndReason(state), null);
  assert.equal(getEndReason({ ...state, timeLeft: 0 }), 'Time is up');
  assert.equal(getEndReason({ ...state, lives: 0 }), 'No lives left');
  const stock = Object.fromEntries(
    Object.keys(state.shelfStock).map((k) => [k, 0]),
  );
  assert.equal(
    getEndReason({ ...state, shelfStock: stock }),
    'Out of ingredients',
  );
  assert.equal(
    getEndReason({
      ...addIngredient(state, 'dragon-tears'),
      shelfStock: stock,
    }),
    null,
  );
});
