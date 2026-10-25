import type { Difficulty } from '../data/difficulty';
import { isRecord, readStoredJson, removeStoredValue } from './localStorage';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: number;
}
export const leaderboardKey = (difficulty: Difficulty): string =>
  `alchemists-cauldron:leaderboard:${difficulty}`;

export function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    /^[\p{L}\p{N} _-]{2,15}$/u.test(value.name) &&
    value.name.trim().length >= 2 &&
    typeof value.score === 'number' &&
    Number.isSafeInteger(value.score) &&
    value.score >= 0 &&
    typeof value.date === 'number' &&
    value.date >= 0 &&
    Number.isFinite(new Date(value.date).getTime())
  );
}

export function loadLeaderboard(difficulty: Difficulty): LeaderboardEntry[] {
  const data = readStoredJson(leaderboardKey(difficulty));
  if (!Array.isArray(data)) return [];
  return data
    .filter(isLeaderboardEntry)
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, 10);
}

export function clearLeaderboard(difficulty: Difficulty): boolean {
  return removeStoredValue(leaderboardKey(difficulty));
}

export function formatResultDate(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
