import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCauldron,
  barPosition,
  inRange,
} from '../src/logic/cauldron.ts';
import { INGREDIENTS } from '../src/data/ingredients.ts';
import {
  RECIPES,
  getRecipesByDifficulty,
  pickRecipe,
} from '../src/data/recipes.ts';
test('empty, repeated and negative ingredient sums use no reactions', () => {
  assert.deepEqual(calculateCauldron([]), {
    temperature: 0,
    density: 0,
    magicPower: 0,
  });
  assert.deepEqual(calculateCauldron([INGREDIENTS[5], INGREDIENTS[5]]), {
    temperature: -40,
    density: -20,
    magicPower: 80,
  });
  assert.deepEqual(calculateCauldron([INGREDIENTS[0], INGREDIENTS[1]]), {
    temperature: 37,
    density: 17,
    magicPower: 22,
  });
  assert.equal(barPosition(0, 100), 50);
  assert.equal(barPosition(-100, 100), 0);
  assert.equal(barPosition(100, 100), 100);
  assert.equal(inRange(-13, { min: -13, max: -3 }), true);
  assert.equal(inRange(-3, { min: -13, max: -3 }), true);
  assert.equal(inRange(-14, { min: -13, max: -3 }), false);
});
test('official fixed recipe pool filters by actual difficulty', () => {
  assert.equal(RECIPES.length, 20);
  assert.equal(getRecipesByDifficulty('easy').length, 6);
  assert.equal(getRecipesByDifficulty('hard').length, 7);
  assert.deepEqual(
    getRecipesByDifficulty('medium').map((r) => r.name),
    [
      'Acid Spark',
      'Void Ember',
      'Heavy Acid',
      'Frost Acid',
      'Dusty Void',
      'Dragon Void',
      'Rooted Night',
    ],
  );
  assert.equal(pickRecipe('medium', () => 0).name, 'Acid Spark');
  assert.equal(pickRecipe('medium', () => 0.999).name, 'Rooted Night');
  assert.equal(RECIPES.find((r) => r.name === 'Moon Mist').difficulty, 'easy');
});
