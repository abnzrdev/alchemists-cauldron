import type { Ingredient } from '../data/ingredients.ts';
import type { Range } from '../data/recipes.ts';
export const PARAMETERS = ['temperature', 'density', 'magicPower'] as const;
export type Parameter = (typeof PARAMETERS)[number];
export type CauldronValues = Record<Parameter, number>;
export function calculateCauldron(
  ingredients: readonly Ingredient[],
): CauldronValues {
  return ingredients.reduce(
    (sum, item) => ({
      temperature: sum.temperature + item.temperature,
      density: sum.density + item.density,
      magicPower: sum.magicPower + item.magicPower,
    }),
    { temperature: 0, density: 0, magicPower: 0 },
  );
}
export function inRange(value: number, range: Range, tolerance = 0): boolean {
  return value >= range.min - tolerance && value <= range.max + tolerance;
}
// Symmetric domains cover all possible Hard mixtures, including five repeats.
export const BAR_LIMITS: CauldronValues = {
  temperature: 250,
  density: 150,
  magicPower: 200,
};
export function barPosition(value: number, limit: number): number {
  return ((value + limit) / (2 * limit)) * 100;
}
