import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTS } from '../src/data/ingredients.ts';
import {
  createGame,
  addIngredient,
  clearCauldron,
} from '../src/state/game-state.ts';

test('official ordered catalogue and Level 1 fixed Medium settings', () => {
  assert.deepEqual(
    INGREDIENTS.map(({ name, temperature, density, magicPower }) => [
      name,
      temperature,
      density,
      magicPower,
    ]),
    [
      ['Dragon Tears', 25, 8, 10],
      ['Fairy Dust', 12, 9, 12],
      ['Frost Lotus', -18, 4, 14],
      ['Mandrake Root', -5, 20, 8],
      ['Caustic Acid', 10, 14, 22],
      ['Essence of the Void', -20, -10, 40],
      ['Phoenix Feather', 50, -10, 30],
      ['Toad Slime', 5, 30, 0],
    ],
  );
  const state = createGame(() => 0);
  assert.equal(state.difficulty, 'medium');
  assert.equal(state.timeLeft, 150);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
  assert.equal(Object.keys(state.shelfStock).length, 6);
});
test('new games independently generate inclusive stock 2 through 15', () => {
  assert.deepEqual(
    Object.values(createGame(() => 0).shelfStock),
    Array(6).fill(2),
  );
  assert.deepEqual(
    Object.values(createGame(() => 0.99999).shelfStock),
    Array(6).fill(15),
  );
  let n = 0;
  const game = createGame(() => n++ / 6);
  assert.equal(new Set(Object.values(game.shelfStock)).size, 6);
});
test('spending is immutable, preserves duplicates and order, blocks exhausted/full/invalid selections', () => {
  const initial = createGame(() => 0);
  let state = addIngredient(initial, 'dragon-tears');
  state = addIngredient(state, 'dragon-tears');
  assert.equal(initial.shelfStock['dragon-tears'], 2);
  assert.equal(state.shelfStock['dragon-tears'], 0);
  assert.equal(addIngredient(state, 'dragon-tears'), state);
  assert.equal(addIngredient(state, 'phoenix-feather'), state);
  assert.equal(
    addIngredient({ ...state, status: 'paused' }, 'fairy-dust')
      .cauldronIngredients.length,
    2,
  );
  state = addIngredient(state, 'fairy-dust');
  state = addIngredient(state, 'frost-lotus');
  assert.deepEqual(
    state.cauldronIngredients.map((i) => i.id),
    ['dragon-tears', 'dragon-tears', 'fairy-dust', 'frost-lotus'],
  );
  assert.equal(addIngredient(state, 'mandrake-root'), state);
  const cleared = clearCauldron(state);
  assert.deepEqual(cleared.cauldronIngredients, []);
  assert.deepEqual(cleared.shelfStock, state.shelfStock);
  assert.equal(
    addIngredient(cleared, 'mandrake-root').cauldronIngredients.length,
    1,
  );
});
