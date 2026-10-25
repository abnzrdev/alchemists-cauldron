import type { Ingredient } from '../data/ingredients.ts';

export function createStock(
  ingredients: readonly Ingredient[],
  random: () => number = Math.random,
): Record<string, number> {
  return Object.fromEntries(
    ingredients.map((ingredient) => [
      ingredient.id,
      Math.floor(random() * 14) + 2,
    ]),
  );
}
