import { DIFFICULTY_SETTINGS, isDifficulty } from '../data/difficulty.ts';
import type { Difficulty } from '../data/difficulty.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { RECIPES } from '../data/recipes.ts';
import type { GameState } from '../state/game-state.ts';
import { PARAMETERS } from '../logic/cauldron.ts';
import {
  isRecord,
  readStoredJson,
  removeStoredValue,
  writeStoredJson,
} from './localStorage.ts';

export const SAVE_KEY = 'alchemists-cauldron:save';
export const SAVE_VERSION = 1;
const DIFFICULTY_KEY = 'alchemists-cauldron:difficulty';
export type SavedGame = GameState & { status: 'playing' | 'paused' };
const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function isValidSave(value: unknown): value is SavedGame {
  if (!isRecord(value) || !isDifficulty(value.difficulty)) return false;
  const rules = DIFFICULTY_SETTINGS[value.difficulty];
  if (
    (value.status !== 'playing' && value.status !== 'paused') ||
    !integer(value.score) ||
    value.score % rules.scorePerBrew !== 0 ||
    typeof value.timeLeft !== 'number' ||
    !Number.isFinite(value.timeLeft) ||
    value.timeLeft <= 0 ||
    value.timeLeft > rules.startTime ||
    !integer(value.lives) ||
    value.lives < 1 ||
    value.lives > rules.lives ||
    !isRecord(value.shelfStock) ||
    !Array.isArray(value.cauldronIngredients) ||
    value.cauldronIngredients.length > rules.cauldronLimit ||
    !isRecord(value.activeRecipe)
  )
    return false;
  const shelf = INGREDIENTS.slice(0, rules.shelfSize);
  const stock = value.shelfStock;
  if (
    Object.keys(stock).length !== shelf.length ||
    !shelf.every(
      (item) =>
        Object.hasOwn(stock, item.id) &&
        integer(stock[item.id]) &&
        (stock[item.id] as number) <= 15,
    )
  )
    return false;
  const recipe = value.activeRecipe;
  const official = RECIPES.find(
    (item) => item.id === recipe.id && item.difficulty === value.difficulty,
  );
  if (
    !official ||
    recipe.name !== official.name ||
    recipe.difficulty !== official.difficulty ||
    !PARAMETERS.every((key) => {
      const range = recipe[key];
      return (
        isRecord(range) &&
        range.min === official[key].min &&
        range.max === official[key].max
      );
    })
  )
    return false;
  const counts: Record<string, number> = {};
  for (const item of value.cauldronIngredients) {
    if (!isRecord(item)) return false;
    const officialIngredient = shelf.find(
      (ingredient) => ingredient.id === item.id,
    );
    if (
      !officialIngredient ||
      item.name !== officialIngredient.name ||
      item.icon !== officialIngredient.icon ||
      !PARAMETERS.every((key) => item[key] === officialIngredient[key])
    )
      return false;
    counts[officialIngredient.id] = (counts[officialIngredient.id] ?? 0) + 1;
    if (
      (stock[officialIngredient.id] as number) + counts[officialIngredient.id] >
      15
    )
      return false;
  }
  return (
    value.cauldronIngredients.length > 0 ||
    shelf.some((item) => (stock[item.id] as number) > 0)
  );
}
function snapshot(state: SavedGame): SavedGame {
  return {
    difficulty: state.difficulty,
    status: state.status,
    score: state.score,
    timeLeft: state.timeLeft,
    lives: state.lives,
    activeRecipe: structuredClone(state.activeRecipe),
    cauldronIngredients: state.cauldronIngredients.map((item) => ({ ...item })),
    shelfStock: { ...state.shelfStock },
  };
}
export function loadGame(): SavedGame | null {
  const data = readStoredJson(SAVE_KEY);
  if (
    !isRecord(data) ||
    data.version !== SAVE_VERSION ||
    !isValidSave(data.state)
  ) {
    clearSave();
    return null;
  }
  return snapshot(data.state);
}
export function saveGame(state: GameState): boolean {
  if (state.status === 'game-over') return clearSave();
  return (
    isValidSave(state) &&
    writeStoredJson(SAVE_KEY, { version: SAVE_VERSION, state: snapshot(state) })
  );
}
export function clearSave(): boolean {
  return removeStoredValue(SAVE_KEY);
}
export function loadDifficulty(): Difficulty {
  const value = readStoredJson(DIFFICULTY_KEY);
  return isDifficulty(value) ? value : 'medium';
}
export function saveDifficulty(value: Difficulty): boolean {
  return writeStoredJson(DIFFICULTY_KEY, value);
}
