import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addIngredient } from '../src/state/game-state.ts';
import { pauseGame, resumeGame } from '../src/state/pause.ts';
test('pause preserves exact time and state, blocks selections, resumes same mixture', () => {
  const state = addIngredient(
    createGame(() => 0),
    'dragon-tears',
  );
  const paused = pauseGame(state, 123.456);
  assert.equal(paused.status, 'paused');
  assert.equal(paused.timeLeft, 123.456);
  assert.equal(paused.shelfStock, state.shelfStock);
  assert.equal(paused.cauldronIngredients, state.cauldronIngredients);
  assert.equal(addIngredient(paused, 'fairy-dust'), paused);
  assert.equal(pauseGame(paused, 1), paused);
  const resumed = resumeGame(paused);
  assert.equal(resumed.status, 'playing');
  assert.equal(resumed.timeLeft, 123.456);
  assert.equal(resumeGame(resumed), resumed);
});
