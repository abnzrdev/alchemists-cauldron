import { setMessage, clearMessage } from '../i18n/index.ts';
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
        setMessage(feedback, 'result.invalid');
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
        setMessage(feedback, 'result.changed');
        return;
      }
      if (!saveResult({ ...pending, name }, pending.difficulty)) {
        setMessage(feedback, 'result.error');
        return;
      }
      pending = null;
      form.hidden = true;
      setMessage(feedback, 'result.saved');
    },
    { signal: abort.signal },
  );
  return {
    prepare(score, difficulty) {
      pending = { score, date: Date.now(), difficulty };
      form.reset();
      input.removeAttribute('aria-invalid');
      clearMessage(feedback);
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
