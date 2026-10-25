import { LEVEL_ONE_SETTINGS } from '../data/levelOne';
import { DIFFICULTY_SETTINGS, isDifficulty } from '../data/difficulty';
import type { Difficulty, DifficultySettings } from '../data/difficulty';
import {
  clearLeaderboard,
  formatResultDate,
  loadLeaderboard,
} from '../storage/leaderboard';
import { loadGame, saveDifficulty } from '../storage/save';
import type { SavedGame } from '../storage/save';

export interface StartGameRequest {
  mode: 'new';
  difficulty: Difficulty;
  settings: DifficultySettings;
}
export interface ContinueGameRequest {
  difficulty: Difficulty;
  settings: DifficultySettings;
  state: SavedGame;
}

export function bindStartScreen(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let difficulty: Difficulty = 'medium';
  let dialogTrigger: HTMLElement | null = null;
  let clearDifficulty: Difficulty | null = null;
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing start screen element: ${selector}`);
    return element;
  };
  const leaderboardFilter = get<HTMLSelectElement>('#leaderboard-difficulty');

  function refreshMenu(): void {
    root
      .querySelectorAll<HTMLButtonElement>('[data-difficulty]')
      .forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          String(button.dataset.difficulty === difficulty),
        );
      });
    const rules = LEVEL_ONE_SETTINGS;
    get('#difficulty-summary').textContent =
      `${rules.shelfSize} ingredients · Up to ${rules.cauldronLimit} per mix · ${rules.startTime} seconds · ${rules.lives} lives`;
    get('#difficulty-details').textContent =
      `Tolerance ±${rules.tolerance} · ${rules.scorePerBrew} points per brew · +${rules.timeBonus}s bonus · ${rules.reactionCount} reactions`;
    get<HTMLButtonElement>('[data-action="continue"]').hidden = true;
    get('#resume-summary').textContent =
      'Level 1 uses Medium. Difficulty selection and saved-run continuation arrive in Level 2.';
  }

  function refreshLeaderboard(): void {
    const selected = leaderboardFilter.value;
    if (!isDifficulty(selected)) return;
    const entries = loadLeaderboard(selected);
    const body = get<HTMLTableSectionElement>('#leaderboard-rows');
    body.replaceChildren();
    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      [
        String(index + 1),
        entry.name,
        String(entry.score),
        DIFFICULTY_SETTINGS[selected].label,
        formatResultDate(entry.date),
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
    get('#leaderboard-caption').textContent =
      `${DIFFICULTY_SETTINGS[selected].label} · Top 10`;
    get('#leaderboard-empty').hidden = entries.length > 0;
    get('.leaderboard-scroll').hidden = entries.length === 0;
    get<HTMLButtonElement>('[data-action="clear-leaderboard"]').hidden =
      entries.length === 0;
    get('#clear-confirmation').hidden = true;
    clearDifficulty = null;
  }

  function openDialog(name: string): void {
    const dialog = root.querySelector<HTMLDialogElement>(`#${name}-dialog`);
    if (!dialog || dialog.open) return;
    if (
      document.activeElement instanceof HTMLElement &&
      !document.activeElement.closest('dialog')
    ) {
      dialogTrigger = document.activeElement;
    }
    if (name === 'menu') refreshMenu();
    if (name === 'leaderboard') {
      leaderboardFilter.value = difficulty;
      get('#leaderboard-status').textContent = '';
      refreshLeaderboard();
    }
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((open) => open.close());
    dialog.showModal();
  }

  function requestNewGame(): void {
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((dialog) => dialog.close());
    const detail: StartGameRequest = {
      mode: 'new',
      difficulty,
      settings: { ...LEVEL_ONE_SETTINGS },
    };
    // The run module commits the replacement save once it has created a new state.
    root.dispatchEvent(
      new CustomEvent<StartGameRequest>('game:start', {
        bubbles: true,
        detail,
      }),
    );
  }

  function requestContinue(): void {
    const saved = loadGame();
    if (!saved) {
      refreshMenu();
      return;
    }
    const detail: ContinueGameRequest = {
      difficulty: saved.difficulty,
      settings: { ...DIFFICULTY_SETTINGS[saved.difficulty] },
      state: { ...saved, status: 'paused' },
    };
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((dialog) => dialog.close());
    root.dispatchEvent(
      new CustomEvent<ContinueGameRequest>('game:continue', {
        bubbles: true,
        detail,
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
      if (isDifficulty(button.dataset.difficulty)) {
        difficulty = button.dataset.difficulty;
        saveDifficulty(difficulty);
        refreshMenu();
      }
      if (button.id === 'start-game' || button.dataset.action === 'new-game')
        requestNewGame();
      if (button.dataset.action === 'continue') requestContinue();
      if (
        button.dataset.action === 'clear-leaderboard' &&
        isDifficulty(leaderboardFilter.value)
      ) {
        clearDifficulty = leaderboardFilter.value;
        get('#clear-confirmation').hidden = false;
        get<HTMLButtonElement>('[data-action="cancel-clear"]').focus();
      }
      if (button.dataset.action === 'cancel-clear') {
        get('#clear-confirmation').hidden = true;
        clearDifficulty = null;
        get<HTMLButtonElement>('[data-action="clear-leaderboard"]').focus();
      }
      if (button.dataset.action === 'confirm-clear' && clearDifficulty) {
        const cleared = clearLeaderboard(clearDifficulty);
        refreshLeaderboard();
        get('#leaderboard-status').textContent = cleared
          ? 'Leaderboard cleared.'
          : 'Scores could not be cleared. Please try again.';
        leaderboardFilter.focus();
      }
    },
    { signal },
  );
  leaderboardFilter.addEventListener(
    'change',
    () => {
      get('#leaderboard-status').textContent = '';
      refreshLeaderboard();
    },
    { signal },
  );
  root.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) =>
    dialog.addEventListener(
      'close',
      () => {
        if (!root.querySelector('dialog[open]')) dialogTrigger?.focus();
      },
      { signal },
    ),
  );
  window.addEventListener(
    'storage',
    () => {
      refreshMenu();
      refreshLeaderboard();
    },
    { signal },
  );
  refreshMenu();
  return () => controller.abort();
}
