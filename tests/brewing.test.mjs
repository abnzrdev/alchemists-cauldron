import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addIngredient } from '../src/state/game-state.ts';
import { brew, matchesRecipe } from '../src/logic/brewing.ts';
import { RECIPES } from '../src/data/recipes.ts';
test('inclusive tolerance applies to all parameters independently', () => {
  const recipe = RECIPES[6];
  assert.equal(
    matchesRecipe({ temperature: 9, density: 10, magicPower: 21 }, recipe),
    true,
  );
  assert.equal(
    matchesRecipe({ temperature: 35, density: 36, magicPower: 47 }, recipe),
    true,
  );
  for (const key of ['temperature', 'density', 'magicPower']) {
    assert.equal(
      matchesRecipe(
        {
          temperature: 22,
          density: 23,
          magicPower: 34,
          [key]: recipe[key].min - 9,
        },
        recipe,
      ),
      false,
    );
    assert.equal(
      matchesRecipe(
        {
          temperature: 22,
          density: 23,
          magicPower: 34,
          [key]: recipe[key].max + 9,
        },
        recipe,
      ),
      false,
    );
  }
});
test('success scores 200, caps bonus at 150, clears mix, conserves stock, picks Medium', () => {
  let state = createGame(() => 0);
  state = addIngredient(addIngredient(state, 'fairy-dust'), 'caustic-acid');
  const original = { ...state.shelfStock };
  let outcome = brew({ ...state, timeLeft: 145 }, () => 0.999);
  assert.equal(outcome.result, 'success');
  assert.equal(outcome.state.score, 200);
  assert.equal(outcome.state.timeLeft, 150);
  assert.equal(outcome.state.activeRecipe.name, 'Rooted Night');
  assert.equal(outcome.state.cauldronIngredients.length, 0);
  assert.deepEqual(outcome.state.shelfStock, original);
  outcome = brew({ ...state, timeLeft: 100 }, () => 0);
  assert.equal(outcome.state.timeLeft, 110);
});
test('failure loses exactly one life, keeps recipe/stock, clears; empty and paused brew ignored', () => {
  const initial = createGame(() => 0);
  assert.equal(brew(initial).state, initial);
  const state = addIngredient(initial, 'dragon-tears');
  const outcome = brew(state);
  assert.equal(outcome.result, 'failure');
  assert.equal(outcome.state.lives, 2);
  assert.equal(outcome.state.activeRecipe, state.activeRecipe);
  assert.equal(outcome.state.score, 0);
  assert.deepEqual(outcome.state.shelfStock, state.shelfStock);
  assert.equal(outcome.state.cauldronIngredients.length, 0);
  assert.equal(brew({ ...state, status: 'paused' }).result, 'ignored');
  assert.equal(brew({ ...state, lives: 1 }).state.status, 'game-over');
});
