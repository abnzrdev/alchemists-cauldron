import { DIFFICULTY_SETTINGS, isDifficulty } from '../data/difficulty';
import type { Difficulty } from '../data/difficulty';
import {
  isRecord,
  readStoredJson,
  removeStoredValue,
  writeStoredJson,
} from './localStorage';

export const SAVE_KEY = 'alchemists-cauldron:save';
const DIFFICULTY_KEY = 'alchemists-cauldron:difficulty';

export interface SavedIngredient {
  id: string;
  name: string;
  icon: string;
  temperature: number;
  density: number;
  magicPower: number;
}

interface RecipeRange {
  min: number;
  max: number;
}
export interface SavedRecipe {
  id: string;
  name: string;
  difficulty: Difficulty;
  temperature: RecipeRange;
  density: RecipeRange;
  magicPower: RecipeRange;
}

export interface SavedGame {
  difficulty: Difficulty;
  status: 'playing' | 'paused';
  score: number;
  timeLeft: number;
  lives: number;
  activeRecipe: SavedRecipe;
  cauldronIngredients: SavedIngredient[];
  shelfStock: Record<string, number>;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isNonnegativeInteger = (value: unknown): value is number =>
  isFiniteNumber(value) && Number.isSafeInteger(value) && value >= 0;
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function isRange(value: unknown): value is RecipeRange {
  return (
    isRecord(value) &&
    isFiniteNumber(value.min) &&
    isFiniteNumber(value.max) &&
    value.min <= value.max
  );
}

function isIngredient(value: unknown): value is SavedIngredient {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.name) &&
    typeof value.icon === 'string' &&
    isFiniteNumber(value.temperature) &&
    isFiniteNumber(value.density) &&
    isFiniteNumber(value.magicPower)
  );
}

function isRecipe(
  value: unknown,
  difficulty: Difficulty,
): value is SavedRecipe {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.name) &&
    value.difficulty === difficulty &&
    isRange(value.temperature) &&
    isRange(value.density) &&
    isRange(value.magicPower)
  );
}

export function isValidSave(value: unknown): value is SavedGame {
  if (!isRecord(value) || !isDifficulty(value.difficulty)) return false;
  const rules = DIFFICULTY_SETTINGS[value.difficulty];
  if (
    (value.status !== 'playing' && value.status !== 'paused') ||
    !isNonnegativeInteger(value.score) ||
    !isFiniteNumber(value.timeLeft) ||
    value.timeLeft <= 0 ||
    !isNonnegativeInteger(value.lives) ||
    value.lives < 1 ||
    value.lives > rules.lives ||
    !isRecipe(value.activeRecipe, value.difficulty) ||
    !isRecord(value.shelfStock) ||
    !Array.isArray(value.cauldronIngredients) ||
    value.cauldronIngredients.length > rules.cauldronLimit ||
    !value.cauldronIngredients.every(isIngredient)
  )
    return false;
  const shelfStock = value.shelfStock;
  const stock = Object.entries(shelfStock);
  return (
    stock.length === rules.shelfSize &&
    stock.every(
      ([id, quantity]) =>
        isText(id) && isNonnegativeInteger(quantity) && quantity <= 15,
    ) &&
    value.cauldronIngredients.every((ingredient) =>
      Object.hasOwn(shelfStock, ingredient.id),
    ) &&
    (stock.some(([, quantity]) => isFiniteNumber(quantity) && quantity > 0) ||
      value.cauldronIngredients.length > 0)
  );
}

export function loadGame(): SavedGame | null {
  const data = readStoredJson(SAVE_KEY);
  return isValidSave(data) ? data : null;
}

export function saveGame(state: SavedGame): boolean {
  return isValidSave(state) && writeStoredJson(SAVE_KEY, state);
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
