import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_SETTINGS } from '../src/data/difficulty.ts';
import { createGame, addIngredient } from '../src/state/game-state.ts';
import { brew, matchesRecipe } from '../src/logic/brewing.ts';
import { RECIPES } from '../src/data/recipes.ts';
import { calculateCauldron } from '../src/logic/cauldron.ts';
const expected = {
  easy: [4, 4, 180, 5, 12, 100, 15, 0],
  medium: [6, 4, 150, 3, 8, 200, 10, 2],
  hard: [8, 5, 150, 3, 5, 300, 5, 3],
};
for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`${difficulty}: official settings, catalogue, stock, capacity and recipe filtering`, () => {
    const r = DIFFICULTY_SETTINGS[difficulty];
    assert.deepEqual(
      [
        r.shelfSize,
        r.cauldronLimit,
        r.startTime,
        r.lives,
        r.tolerance,
        r.scorePerBrew,
        r.timeBonus,
        r.reactionCount,
      ],
      expected[difficulty],
    );
    let state = createGame(() => 0, difficulty);
    assert.equal(state.difficulty, difficulty);
    assert.equal(Object.keys(state.shelfStock).length, r.shelfSize);
    assert.equal(state.timeLeft, r.startTime);
    assert.equal(state.lives, r.lives);
    assert.equal(state.activeRecipe.difficulty, difficulty);
    assert.ok(Object.values(state.shelfStock).every((v) => v === 2));
    assert.ok(
      Object.values(createGame(() => 0.999, difficulty).shelfStock).every(
        (v) => v === 15,
      ),
    );
    const ids = Object.keys(state.shelfStock);
    for (let i = 0; i < r.cauldronLimit; i++)
      state = addIngredient(state, ids[Math.floor(i / 2)]);
    assert.equal(state.cauldronIngredients.length, r.cauldronLimit);
    assert.equal(addIngredient(state, ids.at(-1)), state);
  });
  test(`${difficulty}: tolerance boundaries and successful score/bonus/cap`, () => {
    let state = createGame(() => 0, difficulty);
    const r = DIFFICULTY_SETTINGS[difficulty];
    const mixes = {
      easy: ['dragon-tears', 'fairy-dust'],
      medium: ['fairy-dust', 'caustic-acid'],
      hard: ['phoenix-feather', 'fairy-dust'],
    };
    for (const id of mixes[difficulty]) state = addIngredient(state, id);
    assert.equal(
      matchesRecipe(
        calculateCauldron(state.cauldronIngredients),
        state.activeRecipe,
      ),
      true,
    );
    for (const key of ['temperature', 'density', 'magicPower']) {
      const vals = Object.fromEntries(
        ['temperature', 'density', 'magicPower'].map((k) => [
          k,
          state.activeRecipe[k].min,
        ]),
      );
      assert.equal(
        matchesRecipe(
          { ...vals, [key]: state.activeRecipe[key].min - r.tolerance },
          state.activeRecipe,
        ),
        true,
      );
      assert.equal(
        matchesRecipe(
          { ...vals, [key]: state.activeRecipe[key].min - r.tolerance - 1 },
          state.activeRecipe,
        ),
        false,
      );
    }
    const result = brew({ ...state, timeLeft: r.startTime - 2 }, () => 0.999);
    assert.equal(result.result, 'success');
    assert.equal(result.state.score, r.scorePerBrew);
    assert.equal(result.state.timeLeft, r.startTime);
    assert.equal(result.state.activeRecipe.difficulty, difficulty);
    assert.deepEqual(result.state.shelfStock, state.shelfStock);
    assert.equal(
      brew({ ...state, timeLeft: 20 }, () => 0).state.timeLeft,
      20 + r.timeBonus,
    );
  });
}
test('each pool contains only its official rows', () => {
  assert.equal(RECIPES.filter((r) => r.difficulty === 'easy').length, 6);
  assert.equal(RECIPES.filter((r) => r.difficulty === 'medium').length, 7);
  assert.equal(RECIPES.filter((r) => r.difficulty === 'hard').length, 7);
});
