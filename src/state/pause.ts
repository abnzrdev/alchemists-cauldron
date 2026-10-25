import type { GameState } from './game-state.ts';
export function pauseGame(state: GameState, remaining: number): GameState {
  return state.status === 'playing'
    ? { ...state, status: 'paused', timeLeft: Math.max(0, remaining) }
    : state;
}
export function resumeGame(state: GameState): GameState {
  return state.status === 'paused' ? { ...state, status: 'playing' } : state;
}
