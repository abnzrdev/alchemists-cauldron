import type { GameState } from '../state/game-state.ts';
import { clearCauldron } from '../state/game-state.ts';
import { LEVEL_ONE_SETTINGS } from '../data/levelOne.ts';
import { pickRecipe } from '../data/recipes.ts';
import type { Recipe } from '../data/recipes.ts';
import { calculateCauldron, inRange, PARAMETERS } from './cauldron.ts';
import type { CauldronValues } from './cauldron.ts';
export function matchesRecipe(values: CauldronValues, recipe: Recipe): boolean {
  return PARAMETERS.every((key) =>
    inRange(values[key], recipe[key], LEVEL_ONE_SETTINGS.tolerance),
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
      calculateCauldron(state.cauldronIngredients),
      state.activeRecipe,
    )
  ) {
    return {
      state: {
        ...cleared,
        score: state.score + LEVEL_ONE_SETTINGS.scorePerBrew,
        timeLeft: Math.min(
          LEVEL_ONE_SETTINGS.startTime,
          state.timeLeft + LEVEL_ONE_SETTINGS.timeBonus,
        ),
        activeRecipe: pickRecipe('medium', random),
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
