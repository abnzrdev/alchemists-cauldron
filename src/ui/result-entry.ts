import type { Difficulty } from '../data/difficulty.ts';
import { loadLeaderboard } from '../storage/leaderboard.ts';
import { isPlayerName, qualifies, saveResult } from '../storage/leaderboard.ts';
export function mountResultEntry(root: HTMLElement): {
  prepare: (score: number, difficulty: Difficulty) => void;
  dispose: () => void;
} {
  const form = root.querySelector<HTMLFormElement>('#result-form')!;
  const input = root.querySelector<HTMLInputElement>('#player-name')!;
  const feedback = root.querySelector<HTMLElement>('#result-status')!;
  const abort = new AbortController();
  let pending: { score: number; date: number; difficulty: Difficulty } | null =
    null;
  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      if (!pending) return;
      const name = input.value.trim();
      if (!isPlayerName(name)) {
        feedback.textContent =
          'Use 2-15 characters: letters, digits, spaces, _ or -.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      if (
        !qualifies(
          pending.score,
          pending.date,
          loadLeaderboard(pending.difficulty),
        )
      ) {
        form.hidden = true;
        pending = null;
        feedback.textContent =
          'The Top 10 changed. This result no longer qualifies.';
        return;
      }
      if (!saveResult({ ...pending, name }, pending.difficulty)) {
        feedback.textContent =
          'Your score could not be saved. Storage may be unavailable. Try again or continue without saving.';
        return;
      }
      pending = null;
      form.hidden = true;
      feedback.textContent = 'Result saved to the selected difficulty Top 10.';
    },
    { signal: abort.signal },
  );
  return {
    prepare(score, difficulty) {
      pending = { score, date: Date.now(), difficulty };
      form.reset();
      input.removeAttribute('aria-invalid');
      feedback.textContent = '';
      form.hidden = !qualifies(
        score,
        pending.date,
        loadLeaderboard(difficulty),
      );
    },
    dispose() {
      abort.abort();
    },
  };
}
