import type { Difficulty } from './difficulty.ts';
export interface Range {
  min: number;
  max: number;
}
export interface Recipe {
  id: string;
  difficulty: Difficulty;
  name: string;
  temperature: Range;
  density: Range;
  magicPower: Range;
}
// Exact fixed recipe table from the official README; no worked examples added.
export const RECIPES: readonly Recipe[] = [
  {
    id: 'moon-mist',
    difficulty: 'easy',
    name: 'Moon Mist',
    temperature: {
      min: 32,
      max: 42,
    },
    density: {
      min: 12,
      max: 22,
    },
    magicPower: {
      min: 17,
      max: 27,
    },
  },
  {
    id: 'root-bloom',
    difficulty: 'easy',
    name: 'Root Bloom',
    temperature: {
      min: 2,
      max: 12,
    },
    density: {
      min: 24,
      max: 34,
    },
    magicPower: {
      min: 15,
      max: 25,
    },
  },
  {
    id: 'frost-steam',
    difficulty: 'easy',
    name: 'Frost Steam',
    temperature: {
      min: 2,
      max: 12,
    },
    density: {
      min: 7,
      max: 17,
    },
    magicPower: {
      min: 19,
      max: 29,
    },
  },
  {
    id: 'quiet-swirl',
    difficulty: 'easy',
    name: 'Quiet Swirl',
    temperature: {
      min: -28,
      max: -18,
    },
    density: {
      min: 19,
      max: 29,
    },
    magicPower: {
      min: 17,
      max: 27,
    },
  },
  {
    id: 'bright-dew',
    difficulty: 'easy',
    name: 'Bright Dew',
    temperature: {
      min: 27,
      max: 37,
    },
    density: {
      min: 32,
      max: 42,
    },
    magicPower: {
      min: 25,
      max: 35,
    },
  },
  {
    id: 'snow-dust',
    difficulty: 'easy',
    name: 'Snow Dust',
    temperature: {
      min: -16,
      max: -6,
    },
    density: {
      min: 28,
      max: 38,
    },
    magicPower: {
      min: 29,
      max: 39,
    },
  },
  {
    id: 'acid-spark',
    difficulty: 'medium',
    name: 'Acid Spark',
    temperature: {
      min: 17,
      max: 27,
    },
    density: {
      min: 18,
      max: 28,
    },
    magicPower: {
      min: 29,
      max: 39,
    },
  },
  {
    id: 'void-ember',
    difficulty: 'medium',
    name: 'Void Ember',
    temperature: {
      min: 0,
      max: 10,
    },
    density: {
      min: 0,
      max: 10,
    },
    magicPower: {
      min: 45,
      max: 55,
    },
  },
  {
    id: 'heavy-acid',
    difficulty: 'medium',
    name: 'Heavy Acid',
    temperature: {
      min: 0,
      max: 10,
    },
    density: {
      min: 29,
      max: 39,
    },
    magicPower: {
      min: 25,
      max: 35,
    },
  },
  {
    id: 'frost-acid',
    difficulty: 'medium',
    name: 'Frost Acid',
    temperature: {
      min: -13,
      max: -3,
    },
    density: {
      min: 13,
      max: 23,
    },
    magicPower: {
      min: 31,
      max: 41,
    },
  },
  {
    id: 'dusty-void',
    difficulty: 'medium',
    name: 'Dusty Void',
    temperature: {
      min: -13,
      max: -3,
    },
    density: {
      min: 0,
      max: 10,
    },
    magicPower: {
      min: 47,
      max: 57,
    },
  },
  {
    id: 'dragon-void',
    difficulty: 'medium',
    name: 'Dragon Void',
    temperature: {
      min: 25,
      max: 35,
    },
    density: {
      min: 1,
      max: 11,
    },
    magicPower: {
      min: 55,
      max: 65,
    },
  },
  {
    id: 'rooted-night',
    difficulty: 'medium',
    name: 'Rooted Night',
    temperature: {
      min: -18,
      max: -8,
    },
    density: {
      min: 14,
      max: 24,
    },
    magicPower: {
      min: 55,
      max: 65,
    },
  },
  {
    id: 'phoenix-pulse',
    difficulty: 'hard',
    name: 'Phoenix Pulse',
    temperature: {
      min: 57,
      max: 67,
    },
    density: {
      min: 0,
      max: 10,
    },
    magicPower: {
      min: 37,
      max: 47,
    },
  },
  {
    id: 'slime-crown',
    difficulty: 'hard',
    name: 'Slime Crown',
    temperature: {
      min: -5,
      max: 5,
    },
    density: {
      min: 45,
      max: 55,
    },
    magicPower: {
      min: 3,
      max: 13,
    },
  },
  {
    id: 'void-flame',
    difficulty: 'hard',
    name: 'Void Flame',
    temperature: {
      min: 25,
      max: 35,
    },
    density: {
      min: 0,
      max: 10,
    },
    magicPower: {
      min: 60,
      max: 70,
    },
  },
  {
    id: 'acid-bog',
    difficulty: 'hard',
    name: 'Acid Bog',
    temperature: {
      min: 10,
      max: 20,
    },
    density: {
      min: 39,
      max: 49,
    },
    magicPower: {
      min: 17,
      max: 27,
    },
  },
  {
    id: 'frozen-ash',
    difficulty: 'hard',
    name: 'Frozen Ash',
    temperature: {
      min: 27,
      max: 37,
    },
    density: {
      min: 0,
      max: 10,
    },
    magicPower: {
      min: 39,
      max: 49,
    },
  },
  {
    id: 'triple-eclipse',
    difficulty: 'hard',
    name: 'Triple Eclipse',
    temperature: {
      min: -20,
      max: -10,
    },
    density: {
      min: 19,
      max: 29,
    },
    magicPower: {
      min: 60,
      max: 70,
    },
  },
  {
    id: 'ember-soup',
    difficulty: 'hard',
    name: 'Ember Soup',
    temperature: {
      min: 62,
      max: 72,
    },
    density: {
      min: 24,
      max: 34,
    },
    magicPower: {
      min: 37,
      max: 47,
    },
  },
];
export function getRecipesByDifficulty(
  difficulty: Difficulty,
): readonly Recipe[] {
  return RECIPES.filter((recipe) => recipe.difficulty === difficulty);
}
export function pickRecipe(
  difficulty: Difficulty,
  random: () => number = Math.random,
): Recipe {
  const recipes = getRecipesByDifficulty(difficulty);
  return recipes[Math.floor(random() * recipes.length)];
}
