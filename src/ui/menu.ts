import { LEVEL_ONE_SETTINGS } from '../data/levelOne';
import type { DifficultySettings } from '../data/difficulty';
import {
  clearLeaderboard,
  formatResultDate,
  loadLeaderboard,
} from '../storage/leaderboard';
export interface StartGameRequest {
  mode: 'new';
  difficulty: 'medium';
  settings: DifficultySettings;
}
export function bindStartScreen(root: HTMLElement): () => void {
  const abort = new AbortController();
  const { signal } = abort;
  let trigger: HTMLElement | null = null;
  let returnDialog: HTMLDialogElement | null = null;
  const get = <T extends HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Missing menu element: ${selector}`);
    return el;
  };
  function refreshMenu(): void {
    const rules = LEVEL_ONE_SETTINGS;
    get('#difficulty-summary').textContent =
      `${rules.shelfSize} ingredients | Up to ${rules.cauldronLimit} per mix | ${rules.startTime} seconds | ${rules.lives} lives`;
    get('#difficulty-details').textContent =
      `Tolerance +/-${rules.tolerance} | ${rules.scorePerBrew} points per brew | +${rules.timeBonus}s bonus | No reactions`;
    get('#resume-summary').textContent =
      'Level 1 uses Medium. Difficulty selection and saved-run continuation arrive in Level 2.';
  }
  function refreshLeaderboard(): void {
    const entries = loadLeaderboard();
    const body = get<HTMLTableSectionElement>('#leaderboard-rows');
    body.replaceChildren();
    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      [
        String(index + 1),
        entry.name,
        String(entry.score),
        formatResultDate(entry.date),
      ].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
    get('#leaderboard-caption').textContent = 'Level 1 | Top 10';
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
    returnDialog = null;
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((dialog) => dialog.close());
    root.dispatchEvent(
      new CustomEvent<StartGameRequest>('game:start', {
        bubbles: true,
        detail: {
          mode: 'new',
          difficulty: 'medium',
          settings: { ...LEVEL_ONE_SETTINGS },
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
      if (button.id === 'start-game' || button.dataset.action === 'new-game')
        requestNewGame();
      if (button.dataset.action === 'clear-leaderboard') {
        get<HTMLDialogElement>('#clear-confirmation').showModal();
        get<HTMLButtonElement>('[data-action="cancel-clear"]').focus();
      }
      if (button.dataset.action === 'cancel-clear')
        get<HTMLDialogElement>('#clear-confirmation').close();
      if (button.dataset.action === 'confirm-clear') {
        const cleared = clearLeaderboard();
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
  window.addEventListener('storage', refreshLeaderboard, { signal });
  refreshMenu();
  return () => abort.abort();
}
