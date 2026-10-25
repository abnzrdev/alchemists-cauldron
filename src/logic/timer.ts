import type { GameState } from '../state/game-state.ts';
export type EndReason = 'Time is up' | 'No lives left' | 'Out of ingredients';
export function getEndReason(state: GameState): EndReason | null {
  if (state.timeLeft <= 0) return 'Time is up';
  if (state.lives <= 0) return 'No lives left';
  if (
    !state.cauldronIngredients.length &&
    Object.values(state.shelfStock).every((stock) => stock === 0)
  )
    return 'Out of ingredients';
  return null;
}
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
export class RunClock {
  private endTime: number;
  private readonly now: () => number;
  constructor(seconds: number, now: () => number = Date.now) {
    this.now = now;
    this.endTime = this.now() + seconds * 1000;
  }
  remaining(): number {
    return Math.max(0, (this.endTime - this.now()) / 1000);
  }
  reset(seconds: number): void {
    this.endTime = this.now() + seconds * 1000;
  }
}
