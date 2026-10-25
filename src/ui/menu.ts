import { formatTime } from '../logic/timer.ts';
import { DIFFICULTY_SETTINGS, isDifficulty } from '../data/difficulty.ts';
import { loadDifficulty, saveDifficulty, loadGame } from '../storage/save.ts';
import type { Difficulty, DifficultySettings } from '../data/difficulty';
import {
  clearLeaderboard,
  formatResultDate,
  loadLeaderboard,
} from '../storage/leaderboard';
export interface StartGameRequest {
  mode: 'new';
  difficulty: Difficulty;
  settings: DifficultySettings;
}
export function bindStartScreen(root: HTMLElement): () => void {
  const abort = new AbortController();
  const { signal } = abort;
  let difficulty = loadDifficulty();
  let filter: Difficulty = difficulty;
  const running = () => Boolean(root.querySelector('.is-running'));
  let trigger: HTMLElement | null = null;
  let returnDialog: HTMLDialogElement | null = null;
  const get = <T extends HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Missing menu element: ${selector}`);
    return el;
  };
  function refreshMenu(): void {
    const rules = DIFFICULTY_SETTINGS[difficulty];
    root
      .querySelectorAll<HTMLButtonElement>('[data-difficulty]')
      .forEach((button) => {
        button.disabled = running();
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.difficulty === difficulty),
        );
      });
    get('#difficulty-summary').textContent =
      `${rules.shelfSize} ingredients | Up to ${rules.cauldronLimit} per mix | ${rules.startTime} seconds | ${rules.lives} lives`;
    get('#difficulty-details').textContent =
      `Tolerance +/-${rules.tolerance} | ${rules.scorePerBrew} points per brew | +${rules.timeBonus}s bonus | ${rules.reactionCount} reactions`;
    const saved = loadGame();
    get<HTMLButtonElement>('[data-action="continue"]').hidden =
      !saved || running();
    const summary = get('#resume-summary');
    summary.hidden = !saved;
    summary.textContent = saved
      ? 'Saved ' +
        DIFFICULTY_SETTINGS[saved.difficulty].label +
        ' run | ' +
        saved.score +
        ' points | ' +
        formatTime(saved.timeLeft) +
        ' remaining'
      : '';
  }
  function refreshLeaderboard(): void {
    const entries = loadLeaderboard(filter);
    const body = get<HTMLTableSectionElement>('#leaderboard-rows');
    body.replaceChildren();
    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      [
        String(index + 1),
        entry.name,
        String(entry.score),
        DIFFICULTY_SETTINGS[filter].label,
        formatResultDate(entry.date),
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
    get('#leaderboard-caption').textContent =
      `${DIFFICULTY_SETTINGS[filter].label} | Top 10`;
    get('#leaderboard-empty').hidden = entries.length > 0;
    get('.leaderboard-scroll').hidden = !entries.length;
    get<HTMLButtonElement>('[data-action="clear-leaderboard"]').hidden =
      !entries.length;
  }
  function openDialog(name: string): void {
    const dialog = root.querySelector<HTMLDialogElement>(`#${name}-dialog`);
    if (!dialog || dialog.open) return;
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.closest('dialog')
    )
      trigger = document.activeElement;
    returnDialog =
      name === 'leaderboard'
        ? root.querySelector<HTMLDialogElement>('#game-over-dialog[open]')
        : null;
    if (name === 'leaderboard') {
      const runDifficulty = returnDialog?.dataset.difficulty;
      filter = isDifficulty(runDifficulty) ? runDifficulty : difficulty;
      get<HTMLSelectElement>('#leaderboard-difficulty').value = filter;
      get('#leaderboard-status').textContent = '';
      refreshLeaderboard();
    }
    if (name === 'menu') refreshMenu();
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((open) => open.close());
    dialog.showModal();
  }
  function requestNewGame(): void {
    if (running()) return;
    returnDialog = null;
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((dialog) => dialog.close());
    root.dispatchEvent(
      new CustomEvent<StartGameRequest>('game:start', {
        bubbles: true,
        detail: {
          mode: 'new',
          difficulty,
          settings: { ...DIFFICULTY_SETTINGS[difficulty] },
        },
      }),
    );
  }
  root.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('button')
          : null;
      if (!button || button.disabled) return;
      if (button.dataset.dialog) openDialog(button.dataset.dialog);
      if (isDifficulty(button.dataset.difficulty) && !running()) {
        difficulty = button.dataset.difficulty;
        saveDifficulty(difficulty);
        refreshMenu();
      }
      if (button.id === 'start-game' || button.dataset.action === 'new-game')
        requestNewGame();
      if (button.dataset.action === 'continue' && !running()) {
        const saved = loadGame();
        if (saved) {
          returnDialog = null;
          root
            .querySelectorAll<HTMLDialogElement>('dialog[open]')
            .forEach((dialog) => dialog.close());
          root.dispatchEvent(
            new CustomEvent('game:continue', { bubbles: true, detail: saved }),
          );
        } else refreshMenu();
      }
      if (button.dataset.action === 'clear-leaderboard') {
        get<HTMLDialogElement>('#clear-confirmation').showModal();
        get<HTMLButtonElement>('[data-action="cancel-clear"]').focus();
      }
      if (button.dataset.action === 'cancel-clear')
        get<HTMLDialogElement>('#clear-confirmation').close();
      if (button.dataset.action === 'confirm-clear') {
        const cleared = clearLeaderboard(filter);
        get<HTMLDialogElement>('#clear-confirmation').close();
        refreshLeaderboard();
        get('#leaderboard-status').textContent = cleared
          ? 'Leaderboard cleared.'
          : 'Scores could not be cleared. Please try again.';
      }
    },
    { signal },
  );
  root.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) =>
    dialog.addEventListener(
      'close',
      () => {
        if (dialog.id === 'clear-confirmation') {
          root
            .querySelector<HTMLButtonElement>(
              '[data-action="clear-leaderboard"]:not([hidden])',
            )
            ?.focus();
          return;
        }
        if (!root.querySelector('dialog[open]')) {
          if (dialog.id === 'leaderboard-dialog' && returnDialog) {
            const origin = returnDialog;
            returnDialog = null;
            origin.showModal();
          } else trigger?.focus();
        }
      },
      { signal },
    ),
  );
  window.addEventListener(
    'storage',
    () => {
      refreshLeaderboard();
      refreshMenu();
    },
    { signal },
  );
  get<HTMLSelectElement>('#leaderboard-difficulty').addEventListener(
    'change',
    (event) => {
      const value = (event.target as HTMLSelectElement).value;
      if (isDifficulty(value)) {
        filter = value;
        refreshLeaderboard();
      }
    },
    { signal },
  );
  root.addEventListener('game:exit', refreshMenu, { signal });
  refreshMenu();
  return () => abort.abort();
}
