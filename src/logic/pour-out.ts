import type { GameState } from '../state/game-state.ts';
import { clearCauldron } from '../state/game-state.ts';

export const POUR_OUT_COST = 10;

export function pourOut(state: GameState): GameState {
  if (state.status !== 'playing' || state.cauldronIngredients.length === 0)
    return state;
  const timeLeft = Math.max(0, state.timeLeft - POUR_OUT_COST);
  return {
    ...clearCauldron(state),
    timeLeft,
    status: timeLeft > 0 ? 'playing' : 'game-over',
  };
}
