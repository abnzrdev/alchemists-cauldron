import type { Ingredient } from '../data/ingredients.ts';
import type { Difficulty } from '../data/difficulty.ts';
import { getReactions } from '../data/reactions.ts';
import type { IReaction } from '../data/reactions.ts';
import { calculateCauldron } from './cauldron.ts';

export function evaluateReactions(
  ingredients: readonly Ingredient[],
  reactions: readonly IReaction[],
) {
  const base = calculateCauldron(ingredients);
  const active = reactions.filter((reaction) =>
    reaction.isActive({ ingredients, base }),
  );
  const values = active.reduce(
    (current, reaction) => reaction.apply(current).values,
    base,
  );
  return { values, active };
}

export function calculateMixture(
  ingredients: readonly Ingredient[],
  difficulty: Difficulty,
) {
  return evaluateReactions(ingredients, getReactions(difficulty)).values;
}

export function reactionTransition(
  before: readonly Ingredient[],
  after: readonly Ingredient[],
  reactions: readonly IReaction[],
) {
  const previous = evaluateReactions(before, reactions).active;
  const current = evaluateReactions(after, reactions);
  const fired = current.active.filter(
    (reaction) => !previous.some((item) => item.id === reaction.id),
  );
  let timeCost = 0;
  let lifeCost = 0;
  let clear = false;
  for (const reaction of fired) {
    const effect = reaction.apply(current.values);
    timeCost += effect.timeCost ?? 0;
    lifeCost += effect.lifeCost ?? 0;
    clear ||= effect.clear ?? false;
  }
  return { ...current, fired, timeCost, lifeCost, clear };
}
