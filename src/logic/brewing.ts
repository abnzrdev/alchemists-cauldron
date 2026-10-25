import type { GameState } from '../state/game-state.ts';
import { clearCauldron } from '../state/game-state.ts';
import { DIFFICULTY_SETTINGS } from '../data/difficulty.ts';
import { pickRecipe } from '../data/recipes.ts';
import type { Recipe } from '../data/recipes.ts';
import { inRange, PARAMETERS } from './cauldron.ts';
import { calculateMixture } from './reactions.ts';
import type { CauldronValues } from './cauldron.ts';
export function matchesRecipe(values: CauldronValues, recipe: Recipe): boolean {
  return PARAMETERS.every((key) =>
    inRange(
      values[key],
      recipe[key],
      DIFFICULTY_SETTINGS[recipe.difficulty].tolerance,
    ),
  );
}
export function brew(
  state: GameState,
  random: () => number = Math.random,
): { state: GameState; result: 'success' | 'failure' | 'ignored' } {
  if (
    state.status !== 'playing' ||
    !state.cauldronIngredients.length ||
    state.lives <= 0
  )
    return { state, result: 'ignored' };
  const cleared = clearCauldron(state);
  if (
    matchesRecipe(
      calculateMixture(state.cauldronIngredients, state.difficulty),
      state.activeRecipe,
    )
  ) {
    return {
      state: {
        ...cleared,
        score: state.score + DIFFICULTY_SETTINGS[state.difficulty].scorePerBrew,
        timeLeft: Math.min(
          DIFFICULTY_SETTINGS[state.difficulty].startTime,
          state.timeLeft + DIFFICULTY_SETTINGS[state.difficulty].timeBonus,
        ),
        activeRecipe: pickRecipe(state.difficulty, random),
      },
      result: 'success',
    };
  }
  const lives = Math.max(0, state.lives - 1);
  return {
    state: { ...cleared, lives, status: lives ? 'playing' : 'game-over' },
    result: 'failure',
  };
}
