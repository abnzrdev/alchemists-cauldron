import { pickRecipe } from '../data/recipes.ts';
import type { Recipe } from '../data/recipes.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import type { Ingredient } from '../data/ingredients.ts';
import { DIFFICULTY_SETTINGS } from '../data/difficulty.ts';
import type { Difficulty } from '../data/difficulty.ts';
import { createStock } from '../logic/stock.ts';
import { reactionTransition } from '../logic/reactions.ts';
import { getReactions } from '../data/reactions.ts';

export interface GameState {
  activeRecipe: Recipe;
  status: 'playing' | 'paused' | 'game-over';
  difficulty: Difficulty;
  score: number;
  timeLeft: number;
  lives: number;
  shelfStock: Record<string, number>;
  cauldronIngredients: Ingredient[];
}

export const getShelfIngredients = (difficulty: Difficulty) =>
  INGREDIENTS.slice(0, DIFFICULTY_SETTINGS[difficulty].shelfSize);

export function createGame(
  random: () => number = Math.random,
  difficulty: Difficulty = 'medium',
): GameState {
  return {
    activeRecipe: pickRecipe(difficulty, random),
    status: 'playing',
    difficulty,
    score: 0,
    timeLeft: DIFFICULTY_SETTINGS[difficulty].startTime,
    lives: DIFFICULTY_SETTINGS[difficulty].lives,
    shelfStock: createStock(getShelfIngredients(difficulty), random),
    cauldronIngredients: [],
  };
}

export function canAddIngredient(state: GameState, id: string): boolean {
  return (
    state.status === 'playing' &&
    state.cauldronIngredients.length <
      DIFFICULTY_SETTINGS[state.difficulty].cauldronLimit &&
    state.shelfStock[id] > 0 &&
    getShelfIngredients(state.difficulty).some((item) => item.id === id)
  );
}

export function addIngredient(state: GameState, id: string): GameState {
  if (!canAddIngredient(state, id)) return state;
  const ingredient = getShelfIngredients(state.difficulty).find(
    (item) => item.id === id,
  );
  if (!ingredient) return state;
  const ingredients = [...state.cauldronIngredients, ingredient];
  const effect = reactionTransition(
    state.cauldronIngredients,
    ingredients,
    getReactions(state.difficulty),
  );
  const timeLeft = Math.max(0, state.timeLeft - effect.timeCost);
  const lives = Math.max(0, state.lives - effect.lifeCost);
  return {
    ...state,
    shelfStock: { ...state.shelfStock, [id]: state.shelfStock[id] - 1 },
    cauldronIngredients: effect.clear ? [] : ingredients,
    timeLeft,
    lives,
    status: timeLeft > 0 && lives > 0 ? state.status : 'game-over',
  };
}

// Brewing consumes the mix; it never replenishes ingredient stock.
export function clearCauldron(state: GameState): GameState {
  return { ...state, cauldronIngredients: [] };
}
