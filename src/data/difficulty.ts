export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface DifficultySettings {
  label: string;
  shelfSize: number;
  cauldronLimit: number;
  startTime: number;
  tolerance: number;
  lives: number;
  scorePerBrew: number;
  timeBonus: number;
  reactionCount: number;
}

// Values from the official difficulty table. Medium is the Level 1 rule set.
export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    label: 'Easy',
    shelfSize: 4,
    cauldronLimit: 4,
    startTime: 180,
    tolerance: 12,
    lives: 5,
    scorePerBrew: 100,
    timeBonus: 15,
    reactionCount: 0,
  },
  medium: {
    label: 'Medium',
    shelfSize: 6,
    cauldronLimit: 4,
    startTime: 150,
    tolerance: 8,
    lives: 3,
    scorePerBrew: 200,
    timeBonus: 10,
    reactionCount: 2,
  },
  hard: {
    label: 'Hard',
    shelfSize: 8,
    cauldronLimit: 5,
    startTime: 150,
    tolerance: 5,
    lives: 3,
    scorePerBrew: 300,
    timeBonus: 5,
    reactionCount: 3,
  },
};

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.some((difficulty) => difficulty === value);
}
