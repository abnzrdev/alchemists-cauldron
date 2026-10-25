import { INGREDIENTS } from '../data/ingredients.ts';
import { getReactions } from '../data/reactions.ts';
import { reactionTransition } from '../logic/reactions.ts';
import type { GameState } from '../state/game-state.ts';

export type ReactionVisual = 'arcane' | 'steam' | 'eruption';
const VISUALS: Readonly<Record<string, ReactionVisual>> = {
  'pressure-spike': 'steam',
  'steam-burst': 'steam',
  'volatile-mix': 'eruption',
  'magma-flux': 'eruption',
  'black-ice': 'arcane',
};

// Observe a successful addition; never mutate state or reapply its effects.
export function reactionVisual(
  previous: GameState,
  selectedId: string,
): ReactionVisual | undefined {
  const selected = INGREDIENTS.find((item) => item.id === selectedId);
  if (!selected) return undefined;
  const { fired } = reactionTransition(
    previous.cauldronIngredients,
    [...previous.cauldronIngredients, selected],
    getReactions(previous.difficulty),
  );
  const visuals = fired.map((reaction) => VISUALS[reaction.id]);
  // A destructive eruption takes priority over a simultaneous heat/steam glow.
  return visuals.includes('eruption')
    ? 'eruption'
    : visuals.includes('arcane')
      ? 'arcane'
      : visuals.includes('steam')
        ? 'steam'
        : undefined;
}
