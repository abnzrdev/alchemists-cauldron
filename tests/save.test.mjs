import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_KEY,
  SAVE_VERSION,
  saveGame,
  loadGame,
  clearSave,
  isValidSave,
} from '../src/storage/save.ts';
import { createGame, addIngredient } from '../src/state/game-state.ts';
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete globalThis.localStorage;
});
function storage(raw) {
  const data = new Map(raw === undefined ? [] : [[SAVE_KEY, raw]]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    },
  });
  return data;
}
for (const difficulty of ['easy', 'medium', 'hard'])
  test(`${difficulty}: roundtrip preserves all fields, duplicates and exact stock without reroll`, () => {
    const data = storage();
    let state = createGame(() => 0.999, difficulty);
    state = addIngredient(addIngredient(state, 'dragon-tears'), 'dragon-tears');
    state = { ...state, timeLeft: 123.456, status: 'paused', score: 0 };
    assert.equal(saveGame(state), true);
    assert.equal(JSON.parse(data.get(SAVE_KEY)).version, SAVE_VERSION);
    const loaded = loadGame();
    assert.deepEqual(loaded, state);
    assert.notEqual(loaded.cauldronIngredients, state.cauldronIngredients);
    loaded.shelfStock['dragon-tears'] = 0;
    assert.equal(loadGame().shelfStock['dragon-tears'], 13);
  });
test('reject corrupted fields, foreign catalogue values and impossible stock/capacity', () => {
  const state = createGame(() => 0);
  const invalid = [
    null,
    {},
    { ...state, difficulty: 'expert' },
    { ...state, status: 'menu' },
    { ...state, status: 'game-over' },
    { ...state, timeLeft: 0 },
    { ...state, timeLeft: 151 },
    { ...state, timeLeft: NaN },
    { ...state, lives: 0 },
    { ...state, lives: 4 },
    { ...state, score: -1 },
    { ...state, score: 1 },
    { ...state, activeRecipe: { ...state.activeRecipe, difficulty: 'easy' } },
    { ...state, activeRecipe: { ...state.activeRecipe, id: 'fake' } },
    {
      ...state,
      activeRecipe: {
        ...state.activeRecipe,
        temperature: { min: 0, max: 999 },
      },
    },
    { ...state, shelfStock: { ...state.shelfStock, injected: 2 } },
    { ...state, shelfStock: { ...state.shelfStock, 'dragon-tears': 16 } },
    { ...state, shelfStock: { ...state.shelfStock, 'dragon-tears': 1.5 } },
    {
      ...state,
      cauldronIngredients: Array(5).fill(createGame(() => 0).activeRecipe),
    },
    { ...state, cauldronIngredients: [{ id: 'fake' }] },
  ];
  for (const value of invalid)
    assert.equal(isValidSave(value), false, JSON.stringify(value));
  const used = addIngredient(state, 'dragon-tears');
  assert.equal(
    isValidSave({
      ...used,
      cauldronIngredients: [
        { ...used.cauldronIngredients[0], temperature: 999 },
      ],
    }),
    false,
  );
  assert.equal(
    isValidSave({
      ...used,
      shelfStock: { ...used.shelfStock, 'dragon-tears': 15 },
    }),
    false,
  );
});
test('missing, malformed, outdated and unfinished-schema data is removed safely', () => {
  for (const raw of [
    undefined,
    '{broken',
    'null',
    JSON.stringify(createGame(() => 0)),
    JSON.stringify({ version: 0, state: createGame(() => 0) }),
    JSON.stringify({ version: 999, state: createGame(() => 0) }),
  ]) {
    const data = storage(raw);
    assert.equal(loadGame(), null);
    assert.equal(data.has(SAVE_KEY), false);
  }
});
test('finished games cannot continue, but an empty shelf with a mixture can', () => {
  storage();
  const state = createGame(() => 0);
  const stock = Object.fromEntries(
    Object.keys(state.shelfStock).map((id) => [id, 0]),
  );
  assert.equal(isValidSave({ ...state, shelfStock: stock }), false);
  assert.equal(
    isValidSave({ ...addIngredient(state, 'dragon-tears'), shelfStock: stock }),
    true,
  );
  saveGame(state);
  assert.equal(saveGame({ ...state, status: 'game-over' }), true);
  assert.equal(loadGame(), null);
});
test('new game replaces old save and explicit clear removes it', () => {
  storage();
  saveGame(
    addIngredient(
      createGame(() => 0, 'hard'),
      'phoenix-feather',
    ),
  );
  saveGame(createGame(() => 0, 'easy'));
  assert.equal(loadGame().difficulty, 'easy');
  assert.deepEqual(loadGame().cauldronIngredients, []);
  clearSave();
  assert.equal(loadGame(), null);
});
test('inaccessible reads, writes and removals do not throw', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });
  assert.equal(loadGame(), null);
  assert.equal(saveGame(createGame(() => 0)), false);
  assert.equal(clearSave(), false);
});
