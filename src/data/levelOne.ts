import { DIFFICULTY_SETTINGS } from './difficulty.ts';

// Level 1 is fixed Medium, but reactions belong exclusively to Level 3.
export const LEVEL_ONE_SETTINGS = {
  ...DIFFICULTY_SETTINGS.medium,
  reactionCount: 0,
} as const;
