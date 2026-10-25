import type { Ingredient } from './ingredients.ts';
import type { Difficulty } from './difficulty.ts';
import type { CauldronValues } from '../logic/cauldron.ts';

interface ReactionContext {
  ingredients: readonly Ingredient[];
  base: CauldronValues;
}
export interface ReactionEffect {
  values: CauldronValues;
  timeCost?: number;
  lifeCost?: number;
  clear?: boolean;
}
export interface IReaction {
  id: string;
  name: string;
  isActive: (context: ReactionContext) => boolean;
  apply: (values: CauldronValues) => ReactionEffect;
}
const pair = (context: ReactionContext, first: string, second: string) =>
  [first, second].every((id) =>
    context.ingredients.some((item) => item.id === id),
  );

export const REACTIONS: readonly IReaction[] = [
  {
    id: 'bubbling',
    name: 'Bubbling',
    isActive: (c) => pair(c, 'fairy-dust', 'caustic-acid'),
    apply: (v) => ({
      values: { ...v, magicPower: v.magicPower * 1.5 },
      timeCost: 10,
    }),
  },
  {
    id: 'volatile-mix',
    name: 'Volatile Mix',
    isActive: (c) => pair(c, 'phoenix-feather', 'essence-of-the-void'),
    apply: (v) => ({ values: { ...v }, lifeCost: 1, clear: true }),
  },
  {
    id: 'solar-frost',
    name: 'Solar Frost',
    isActive: (c) => pair(c, 'dragon-tears', 'frost-lotus'),
    apply: (v) => ({
      values: { ...v, temperature: 0, density: v.density * 1.2 },
    }),
  },
  {
    id: 'rooted-steam',
    name: 'Rooted Steam',
    isActive: (c) => pair(c, 'mandrake-root', 'toad-slime'),
    apply: (v) => ({
      values: {
        ...v,
        density: v.density * 1.25,
        magicPower: v.magicPower * 0.9,
      },
    }),
  },
  {
    id: 'ashen-bloom',
    name: 'Ashen Bloom',
    isActive: (c) => pair(c, 'phoenix-feather', 'fairy-dust'),
    apply: (v) => ({
      values: {
        ...v,
        temperature: v.temperature + 10,
        magicPower: v.magicPower * 1.25,
      },
    }),
  },
  {
    id: 'annihilation',
    name: 'Annihilation',
    isActive: (c) =>
      c.ingredients.some((i) => i.temperature > 15) &&
      c.ingredients.some((i) => i.temperature < -15),
    apply: (v) => ({
      values: { ...v, temperature: 0, density: v.density * 2 },
    }),
  },
  {
    id: 'pressure-spike',
    name: 'Pressure Spike',
    isActive: (c) => c.base.density >= 70,
    apply: (v) => ({
      values: { ...v, density: 70, magicPower: v.magicPower * 1.1 },
    }),
  },
  {
    id: 'magma-flux',
    name: 'Magma Flux',
    isActive: (c) => c.base.temperature >= 60,
    apply: (v) => ({
      values: {
        ...v,
        magicPower: v.magicPower * 1.2,
        density: v.density * 0.9,
      },
    }),
  },
  {
    id: 'deep-freeze',
    name: 'Deep Freeze',
    isActive: (c) => c.base.temperature <= -20,
    apply: (v) => ({
      values: {
        ...v,
        density: v.density * 1.15,
        magicPower: v.magicPower * 0.85,
      },
    }),
  },
  {
    id: 'arcane-saturation',
    name: 'Arcane Saturation',
    isActive: (c) => c.base.magicPower >= 80,
    apply: (v) => ({
      values: { ...v, magicPower: 80, temperature: v.temperature + 5 },
    }),
  },
  {
    id: 'steam-burst',
    name: 'Steam Burst',
    isActive: (c) =>
      pair(c, 'dragon-tears', 'caustic-acid') && c.base.temperature >= 35,
    apply: (v) => ({
      values: { ...v, temperature: v.temperature + 10 },
      timeCost: 5,
    }),
  },
  {
    id: 'black-ice',
    name: 'Black Ice',
    isActive: (c) =>
      pair(c, 'frost-lotus', 'essence-of-the-void') && c.base.density <= 0,
    apply: (v) => ({
      values: {
        ...v,
        temperature: v.temperature - 10,
        magicPower: v.magicPower * 1.2,
      },
    }),
  },
  {
    id: 'heavy-spark',
    name: 'Heavy Spark',
    isActive: (c) =>
      pair(c, 'fairy-dust', 'toad-slime') && c.base.density >= 40,
    apply: (v) => ({
      values: {
        ...v,
        density: v.density * 1.2,
        magicPower: v.magicPower * 1.1,
      },
    }),
  },
  {
    id: 'burning-root',
    name: 'Burning Root',
    isActive: (c) =>
      pair(c, 'mandrake-root', 'phoenix-feather') && c.base.temperature >= 40,
    apply: (v) => ({
      values: {
        ...v,
        temperature: v.temperature + 15,
        density: v.density * 0.9,
      },
    }),
  },
  {
    id: 'void-resonance',
    name: 'Void Resonance',
    isActive: (c) =>
      pair(c, 'essence-of-the-void', 'dragon-tears') && c.base.magicPower >= 50,
    apply: (v) => ({
      values: {
        ...v,
        magicPower: v.magicPower * 1.3,
        temperature: v.temperature - 5,
      },
    }),
  },
];

// Owner-approved fixed subsets: the official documents specify counts, not IDs.
export const ENABLED_REACTIONS: Record<Difficulty, readonly string[]> = {
  easy: [],
  medium: ['pressure-spike', 'steam-burst'],
  hard: ['volatile-mix', 'magma-flux', 'black-ice'],
};
export const getReactions = (difficulty: Difficulty) =>
  REACTIONS.filter((reaction) =>
    ENABLED_REACTIONS[difficulty].includes(reaction.id),
  );
