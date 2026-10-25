import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addIngredient } from '../src/state/game-state.ts';
import { pourOut } from '../src/logic/pour-out.ts';
import { calculateMixture } from '../src/logic/reactions.ts';

test('Pour Out clears with exactly ten seconds spent; unrelated state and stock preserved', () => {
  const initial = addIngredient(
    createGame(() => 0),
    'fairy-dust',
  );
  const result = pourOut(initial);
  assert.deepEqual(result, {
    ...initial,
    timeLeft: 140,
    cauldronIngredients: [],
  });
  assert.equal(initial.cauldronIngredients.length, 1);
  assert.deepEqual(calculateMixture(result.cauldronIngredients, 'medium'), {
    temperature: 0,
    density: 0,
    magicPower: 0,
  });
  assert.equal(result.shelfStock['fairy-dust'], 1);
});
test('empty, paused and finished pours ignored; final seconds end without life penalty', () => {
  const empty = createGame(() => 0);
  assert.equal(pourOut(empty), empty);
  const filled = addIngredient(empty, 'fairy-dust');
  for (const status of ['paused', 'game-over']) {
    const state = { ...filled, status };
    assert.equal(pourOut(state), state);
  }
  const result = pourOut({ ...filled, timeLeft: 4 });
  assert.equal(result.timeLeft, 0);
  assert.equal(result.status, 'game-over');
  assert.equal(result.lives, 3);
});
