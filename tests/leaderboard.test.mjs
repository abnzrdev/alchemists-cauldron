import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEADERBOARD_KEY,
  isPlayerName,
  loadLeaderboard,
  saveResult,
  clearLeaderboard,
  qualifies,
  formatResultDate,
} from '../src/storage/leaderboard.ts';
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete globalThis.localStorage;
});
function storage(initial = null) {
  const data = new Map(initial ? [[LEADERBOARD_KEY, initial]] : []);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    },
  });
  return data;
}
test('names require 2-15 allowed characters and meaningful trimmed content', () => {
  for (const n of [
    'Al',
    'Mage_01',
    'A-B',
    '\u041c\u0430\u0433',
    'a'.repeat(15),
  ])
    assert.equal(isPlayerName(n), true);
  for (const n of [
    '',
    'x',
    '  ',
    ' a ',
    'a'.repeat(16),
    'Mage!',
    '<script>',
    'a\nb',
  ])
    assert.equal(isPlayerName(n), false);
});
test('single Top10 sorts descending, earlier ties first, persists and clears', () => {
  const data = storage();
  for (let i = 0; i < 12; i++)
    assert.equal(
      saveResult({ name: `Mage${i}`, score: i * 200, date: 1000 + i }),
      true,
    );
  assert.equal(loadLeaderboard().length, 10);
  assert.equal(loadLeaderboard()[0].score, 2200);
  assert.equal(data.size, 1);
  saveResult({ name: 'Tie', score: 2200, date: 500 });
  assert.equal(loadLeaderboard()[0].name, 'Tie');
  assert.equal(qualifies(0, 2000), false);
  assert.equal(qualifies(2200, 2000), true);
  assert.equal(clearLeaderboard(), true);
  assert.deepEqual(loadLeaderboard(), []);
});
test('full leaderboard tie at cutoff preserves earlier result', () => {
  storage(
    JSON.stringify(
      Array.from({ length: 10 }, (_, i) => ({
        name: `Mage${i}`,
        score: 100,
        date: 100 + i,
      })),
    ),
  );
  assert.equal(qualifies(100, 110), false);
  assert.equal(qualifies(100, 99), true);
  assert.equal(qualifies(99, 0), false);
});
test('malformed or unavailable storage never throws; invalid rows discarded', () => {
  storage('{broken');
  assert.deepEqual(loadLeaderboard(), []);
  storage(
    JSON.stringify([
      { name: 'Mage', score: 200, date: 1000 },
      { name: '<bad>', score: 999, date: 1 },
      { name: 'Bad', score: -1, date: 1 },
      null,
    ]),
  );
  assert.equal(loadLeaderboard().length, 1);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });
  assert.deepEqual(loadLeaderboard(), []);
  assert.equal(saveResult({ name: 'Mage', score: 0, date: 1 }), false);
  assert.equal(clearLeaderboard(), false);
});
test('date uses required local DD.MM.YYYY HH:MM format', () => {
  assert.equal(
    formatResultDate(new Date(2026, 9, 25, 9, 5).getTime()),
    '25.10.2026 09:05',
  );
});

test('difficulty lists remain independent and preserve existing Medium results', () => {
  storage();
  saveResult({ name: 'MediumMage', score: 200, date: 1 });
  saveResult({ name: 'EasyMage', score: 100, date: 2 }, 'easy');
  saveResult({ name: 'HardMage', score: 300, date: 3 }, 'hard');
  assert.equal(loadLeaderboard()[0].name, 'MediumMage');
  assert.equal(loadLeaderboard('easy')[0].name, 'EasyMage');
  assert.equal(loadLeaderboard('hard')[0].name, 'HardMage');
  clearLeaderboard('easy');
  assert.deepEqual(loadLeaderboard('easy'), []);
  assert.equal(loadLeaderboard('hard').length, 1);
  assert.equal(loadLeaderboard().length, 1);
});
