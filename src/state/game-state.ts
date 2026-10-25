import { pickRecipe } from '../data/recipes.ts';
import type { Recipe } from '../data/recipes.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import type { Ingredient } from '../data/ingredients.ts';
import { LEVEL_ONE_SETTINGS } from '../data/levelOne.ts';
import { createStock } from '../logic/stock.ts';

export interface GameState {
  activeRecipe: Recipe;
  status: 'playing' | 'paused' | 'game-over';
  difficulty: 'medium';
  score: number;
  timeLeft: number;
  lives: number;
  shelfStock: Record<string, number>;
  cauldronIngredients: Ingredient[];
}

export const LEVEL_ONE_INGREDIENTS = INGREDIENTS.slice(
  0,
  LEVEL_ONE_SETTINGS.shelfSize,
);

export function createGame(random: () => number = Math.random): GameState {
  return {
    activeRecipe: pickRecipe('medium', random),
    status: 'playing',
    difficulty: 'medium',
    score: 0,
    timeLeft: LEVEL_ONE_SETTINGS.startTime,
    lives: LEVEL_ONE_SETTINGS.lives,
    shelfStock: createStock(LEVEL_ONE_INGREDIENTS, random),
    cauldronIngredients: [],
  };
}

export function addIngredient(state: GameState, id: string): GameState {
  if (
    state.status !== 'playing' ||
    state.cauldronIngredients.length >= LEVEL_ONE_SETTINGS.cauldronLimit ||
    !(state.shelfStock[id] > 0)
  )
    return state;
  const ingredient = LEVEL_ONE_INGREDIENTS.find((item) => item.id === id);
  if (!ingredient) return state;
  return {
    ...state,
    shelfStock: { ...state.shelfStock, [id]: state.shelfStock[id] - 1 },
    cauldronIngredients: [...state.cauldronIngredients, ingredient],
  };
}

// Brewing consumes the mix; it never replenishes ingredient stock.
export function clearCauldron(state: GameState): GameState {
  return { ...state, cauldronIngredients: [] };
}
