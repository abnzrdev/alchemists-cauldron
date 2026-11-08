import type { Difficulty } from '../data/difficulty.ts';
import {
  isRecord,
  readStoredJson,
  removeStoredValue,
  writeStoredJson,
} from './localStorage.ts';
export interface LeaderboardEntry {
  name: string;
  score: number;
  date: number;
}
export const LEADERBOARD_KEY = 'alchemists-cauldron:leaderboard:level-1';
export function isPlayerName(name: string): boolean {
  return /^[\p{L}\p{N} _-]{2,15}$/u.test(name) && name.trim().length >= 2;
}
export function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isPlayerName(value.name) &&
    typeof value.score === 'number' &&
    Number.isSafeInteger(value.score) &&
    value.score >= 0 &&
    typeof value.date === 'number' &&
    value.date >= 0 &&
    Number.isFinite(new Date(value.date).getTime())
  );
}
export function sortResults(
  entries: readonly LeaderboardEntry[],
): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, 10);
}
export const leaderboardKey = (difficulty: Difficulty): string =>
  difficulty === 'medium'
    ? LEADERBOARD_KEY
    : `alchemists-cauldron:leaderboard:${difficulty}`;
export function loadLeaderboard(
  difficulty: Difficulty = 'medium',
): LeaderboardEntry[] {
  const data = readStoredJson(leaderboardKey(difficulty));
  return Array.isArray(data)
    ? sortResults(data.filter(isLeaderboardEntry))
    : [];
}
export function qualifies(
  score: number,
  date: number,
  entries: readonly LeaderboardEntry[] = loadLeaderboard(),
): boolean {
  if (!Number.isSafeInteger(score) || score < 0) return false;
  const ranked = sortResults(entries);
  const last = ranked[9];
  return (
    !last || score > last.score || (score === last.score && date < last.date)
  );
}
export function saveResult(
  entry: LeaderboardEntry,
  difficulty: Difficulty = 'medium',
): boolean {
  if (!isLeaderboardEntry(entry)) return false;
  return writeStoredJson(
    leaderboardKey(difficulty),
    sortResults([
      ...loadLeaderboard(difficulty),
      { ...entry, name: entry.name.trim() },
    ]),
  );
}
export function clearLeaderboard(difficulty: Difficulty = 'medium'): boolean {
  return removeStoredValue(leaderboardKey(difficulty));
}
export function formatResultDate(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
