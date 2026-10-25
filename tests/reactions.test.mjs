import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTS } from '../src/data/ingredients.ts';
import { REACTIONS, getReactions } from '../src/data/reactions.ts';
import { calculateCauldron } from '../src/logic/cauldron.ts';
import {
  calculateMixture,
  evaluateReactions,
  reactionTransition,
} from '../src/logic/reactions.ts';
import {
  createGame,
  addIngredient,
  clearCauldron,
} from '../src/state/game-state.ts';
import { brew } from '../src/logic/brewing.ts';
const mix = (...ids) => ids.map((id) => INGREDIENTS.find((i) => i.id === id));
const fixtures = [
  ['bubbling', ['fairy-dust', 'caustic-acid'], [22, 23, 51], 10, 0, false],
  [
    'volatile-mix',
    ['phoenix-feather', 'essence-of-the-void'],
    [30, -20, 70],
    0,
    1,
    true,
  ],
  ['solar-frost', ['dragon-tears', 'frost-lotus'], [0, 14.4, 24], 0, 0, false],
  [
    'rooted-steam',
    ['mandrake-root', 'toad-slime'],
    [0, 62.5, 7.2],
    0,
    0,
    false,
  ],
  [
    'ashen-bloom',
    ['phoenix-feather', 'fairy-dust'],
    [72, -1, 52.5],
    0,
    0,
    false,
  ],
  ['annihilation', ['dragon-tears', 'frost-lotus'], [0, 24, 24], 0, 0, false],
  [
    'pressure-spike',
    Array(4).fill('mandrake-root'),
    [-20, 70, 35.2],
    0,
    0,
    false,
  ],
  [
    'magma-flux',
    ['phoenix-feather', 'phoenix-feather'],
    [100, -18, 72],
    0,
    0,
    false,
  ],
  ['deep-freeze', ['essence-of-the-void'], [-20, -11.5, 34], 0, 0, false],
  [
    'arcane-saturation',
    ['essence-of-the-void', 'essence-of-the-void'],
    [-35, -20, 80],
    0,
    0,
    false,
  ],
  ['steam-burst', ['dragon-tears', 'caustic-acid'], [45, 22, 32], 5, 0, false],
  [
    'black-ice',
    ['frost-lotus', 'essence-of-the-void'],
    [-48, -6, 64.8],
    0,
    0,
    false,
  ],
  [
    'heavy-spark',
    ['fairy-dust', 'toad-slime', 'toad-slime'],
    [22, 82.8, 13.2],
    0,
    0,
    false,
  ],
  [
    'burning-root',
    ['mandrake-root', 'phoenix-feather'],
    [60, 9, 38],
    0,
    0,
    false,
  ],
  [
    'void-resonance',
    ['essence-of-the-void', 'dragon-tears'],
    [0, -2, 65],
    0,
    0,
    false,
  ],
];
for (const [id, ids, values, timeCost, lifeCost, clear] of fixtures) {
  test(`${id}: official trigger, exact effect and activation edge`, () => {
    const reaction = REACTIONS.find((r) => r.id === id);
    const ingredients = mix(...ids);
    const original = structuredClone(ingredients);
    assert.equal(
      reaction.isActive({ ingredients: [], base: calculateCauldron([]) }),
      false,
    );
    const outcome = reactionTransition([], ingredients, [reaction]);
    assert.equal(outcome.fired.length, 1);
    ['temperature', 'density', 'magicPower'].forEach((key, index) =>
      assert.ok(
        Math.abs(outcome.values[key] - values[index]) < 1e-9,
        `${key}: ${outcome.values[key]}`,
      ),
    );
    assert.equal(outcome.timeCost, timeCost);
    assert.equal(outcome.lifeCost, lifeCost);
    assert.equal(outcome.clear, clear);
    const again = reactionTransition(ingredients, ingredients, [reaction]);
    assert.equal(again.fired.length, 0);
    assert.equal(again.timeCost, 0);
    assert.equal(again.lifeCost, 0);
    assert.equal(again.clear, false);
    assert.equal(
      reactionTransition([], ingredients, [reaction]).fired.length,
      1,
    );
    assert.deepEqual(ingredients, original);
  });
}
test('threshold triggers use unmodified base totals and exact inclusive/strict comparisons', () => {
  const active = (id, base, ingredients = []) =>
    REACTIONS.find((r) => r.id === id).isActive({
      base: { temperature: 0, density: 0, magicPower: 0, ...base },
      ingredients,
    });
  for (const [id, key, boundary, inactive] of [
    ['pressure-spike', 'density', 70, 69.99],
    ['magma-flux', 'temperature', 60, 59.99],
    ['deep-freeze', 'temperature', -20, -19.99],
    ['arcane-saturation', 'magicPower', 80, 79.99],
  ]) {
    assert.equal(active(id, { [key]: boundary }), true);
    assert.equal(active(id, { [key]: inactive }), false);
  }
  assert.equal(
    active('annihilation', {}, [{ temperature: 15 }, { temperature: -16 }]),
    false,
  );
  assert.equal(
    active('annihilation', {}, [{ temperature: 16 }, { temperature: -15 }]),
    false,
  );
  assert.equal(
    active('annihilation', {}, [{ temperature: 16 }, { temperature: -16 }]),
    true,
  );
  for (const [id, ids, key, boundary, outside] of [
    ['steam-burst', ['dragon-tears', 'caustic-acid'], 'temperature', 35, 34.99],
    ['black-ice', ['frost-lotus', 'essence-of-the-void'], 'density', 0, 0.01],
    ['heavy-spark', ['fairy-dust', 'toad-slime'], 'density', 40, 39.99],
    [
      'burning-root',
      ['mandrake-root', 'phoenix-feather'],
      'temperature',
      40,
      39.99,
    ],
    [
      'void-resonance',
      ['essence-of-the-void', 'dragon-tears'],
      'magicPower',
      50,
      49.99,
    ],
  ]) {
    assert.equal(active(id, { [key]: boundary }, mix(...ids)), true);
    assert.equal(active(id, { [key]: outside }, mix(...ids)), false);
    assert.equal(active(id, { [key]: boundary }, mix(ids[0])), false);
  }
});
test('configured subsets, fresh recalculation, transition penalties and cleared stock', () => {
  assert.deepEqual(
    ['easy', 'medium', 'hard'].map((d) => getReactions(d).length),
    [0, 2, 3],
  );
  const ingredients = mix('dragon-tears', 'caustic-acid');
  assert.deepEqual(
    calculateMixture(ingredients, 'easy'),
    calculateCauldron(ingredients),
  );
  let state = createGame(() => 0.99);
  state = addIngredient(addIngredient(state, 'dragon-tears'), 'caustic-acid');
  assert.equal(state.timeLeft, 145);
  assert.equal(
    calculateMixture(state.cauldronIngredients, 'medium').temperature,
    45,
  );
  state = addIngredient(state, 'fairy-dust');
  assert.equal(state.timeLeft, 145);
  assert.equal(
    calculateMixture(state.cauldronIngredients, 'medium').temperature,
    57,
  );
  state = addIngredient(clearCauldron(state), 'dragon-tears');
  state = addIngredient(state, 'caustic-acid');
  assert.equal(state.timeLeft, 140);
  const timeout = addIngredient(
    { ...clearCauldron(state), timeLeft: 2 },
    'dragon-tears',
  );
  assert.equal(addIngredient(timeout, 'caustic-acid').status, 'game-over');
  let hard = createGame(() => 0.99, 'hard');
  hard = addIngredient(
    addIngredient(hard, 'phoenix-feather'),
    'essence-of-the-void',
  );
  assert.equal(hard.lives, 2);
  assert.equal(hard.cauldronIngredients.length, 0);
  assert.equal(hard.shelfStock['phoenix-feather'], 14);
  assert.equal(hard.shelfStock['essence-of-the-void'], 14);
  hard = addIngredient({ ...hard, lives: 1 }, 'phoenix-feather');
  assert.equal(addIngredient(hard, 'essence-of-the-void').status, 'game-over');
});
test('brewing checks reaction-adjusted values and pure evaluation never repeats penalties', () => {
  let state = createGame(() => 0.99);
  state = addIngredient(addIngredient(state, 'dragon-tears'), 'caustic-acid');
  const values = calculateMixture(state.cauldronIngredients, 'medium');
  const recipe = {
    ...state.activeRecipe,
    temperature: { min: 45, max: 45 },
    density: { min: 22, max: 22 },
    magicPower: { min: 32, max: 32 },
  };
  assert.equal(
    brew({ ...state, activeRecipe: recipe }, () => 0).result,
    'success',
  );
  for (let i = 0; i < 5; i++)
    assert.deepEqual(
      evaluateReactions(state.cauldronIngredients, getReactions('medium'))
        .values,
      values,
    );
  assert.equal(state.timeLeft, 145);
});
