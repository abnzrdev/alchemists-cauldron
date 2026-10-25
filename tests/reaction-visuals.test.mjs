import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, addIngredient } from '../src/state/game-state.ts';
import { reactionVisual } from '../src/ui/reaction-visuals.ts';

test('reaction textures follow activation edges without changing supplied state', () => {
  const cases = [
    ['medium', ['dragon-tears'], 'caustic-acid', 'steam'],
    [
      'medium',
      ['mandrake-root', 'mandrake-root', 'mandrake-root'],
      'mandrake-root',
      'steam',
    ],
    ['hard', ['frost-lotus'], 'essence-of-the-void', 'arcane'],
    ['hard', ['phoenix-feather'], 'essence-of-the-void', 'eruption'],
    ['hard', ['dragon-tears', 'dragon-tears'], 'fairy-dust', 'eruption'],
    ['easy', ['dragon-tears'], 'fairy-dust', undefined],
    ['medium', ['fairy-dust'], 'fairy-dust', undefined],
    ['medium', ['dragon-tears', 'caustic-acid'], 'fairy-dust', undefined],
  ];
  for (const [difficulty, ids, selected, expected] of cases) {
    const state = ids.reduce(
      (current, id) => addIngredient(current, id),
      createGame(() => 0.99, difficulty),
    );
    const before = structuredClone(state);
    assert.equal(reactionVisual(state, selected), expected);
    assert.deepEqual(state, before);
  }
});
