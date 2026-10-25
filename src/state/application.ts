import { DIFFICULTY_SETTINGS, isDifficulty } from '../data/difficulty.ts';
import type { Difficulty } from '../data/difficulty.ts';
import {
  loadDifficulty,
  saveGame,
  clearSave,
  isValidSave,
} from '../storage/save.ts';
import type { SavedGame } from '../storage/save.ts';
import type { StartGameRequest } from '../ui/menu.ts';
import { mountResultEntry } from '../ui/result-entry.ts';
import { pauseGame, resumeGame } from './pause.ts';
import { renderPause } from '../ui/pause.ts';
import { RunClock, formatTime, getEndReason } from '../logic/timer.ts';
import { renderGameOver } from '../ui/game-over.ts';
import { brew } from '../logic/brewing.ts';
import { updateParameterBars } from '../ui/parameter-bars.ts';
import { addIngredient, createGame } from './game-state.ts';
import type { GameState } from './game-state.ts';
import { renderEmptySlots } from '../ui/startScreen.ts';
import {
  renderIngredientIcon,
  renderMixture,
  renderShelf,
} from '../ui/shelf.ts';

export function mountGame(root: HTMLElement): () => void {
  let state: GameState | null = null;
  const abort = new AbortController();
  let clock: RunClock | null = null;
  let lastSavedSecond = -1;
  let timer: ReturnType<typeof setInterval> | undefined;
  root.insertAdjacentHTML('beforeend', renderGameOver() + renderPause());
  const results = mountResultEntry(root);
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing game element: ${selector}`);
    return element;
  };
  const primary = get('.primary-action');
  const startContent = [...primary.childNodes];
  const screen = get('.start-screen');
  const menuButton = get<HTMLButtonElement>('.circular-control-menu');

  function render(): void {
    if (!state) return;
    get('.slot-group-left').innerHTML = renderShelf(state, 0);
    get('.slot-group-right').innerHTML = renderShelf(state, 1);
    get('.cauldron-content').innerHTML = state.cauldronIngredients
      .map(renderIngredientIcon)
      .join('');
    let panel = root.querySelector<HTMLElement>('.run-panel');
    if (!panel) {
      const recipe = document.createElement('section');
      recipe.className = 'recipe-panel';
      recipe.setAttribute('aria-label', 'Current recipe');
      get('.cauldron-hero').append(recipe);
      panel = document.createElement('div');
      panel.className = 'run-panel';
      recipe.append(panel);
    }
    panel.innerHTML = `<h2 class="recipe-title">${state.activeRecipe.name}</h2>${renderMixture(state)}`;
    get('#game-score').textContent = String(state.score);
    updateTime();
    get('#game-lives').textContent =
      `Lives: ${state.lives} / ${DIFFICULTY_SETTINGS[state.difficulty].lives}`;
    get<HTMLButtonElement>('[data-action="brew"]').disabled =
      !state.cauldronIngredients.length || state.status !== 'playing';
    updateParameterBars(root, state);
  }

  function persist(): void {
    if (!state) return;
    lastSavedSecond = Math.ceil(state.timeLeft);
    const saved = saveGame(state);
    get('#save-status').textContent = saved
      ? ''
      : 'Progress could not be saved on this device.';
  }

  function updateTime(): void {
    if (!state) return;
    get('#game-time').textContent = formatTime(state.timeLeft);
    get<HTMLProgressElement>('#time-progress').value = state.timeLeft;
    get('#game-time')
      .closest('.counter-details')
      ?.classList.toggle('timer-urgent', state.timeLeft < 15);
  }

  function finishIfNeeded(): boolean {
    if (!state) return false;
    const reason = getEndReason(state);
    if (!reason) return false;
    clearInterval(timer);
    state = { ...state, status: 'game-over' };
    persist();
    render();
    const dialog = get<HTMLDialogElement>('#game-over-dialog');
    if (!dialog.open) {
      root
        .querySelectorAll<HTMLDialogElement>('dialog[open]')
        .forEach((open) => open.close());
      get('#game-over-reason').textContent = reason;
      get('#final-score').textContent = String(state.score);
      results.prepare(state.score, state.difficulty);
      dialog.dataset.difficulty = state.difficulty;
      dialog.showModal();
    }
    return true;
  }

  function tick(): void {
    if (state?.status !== 'playing' || !clock) return;
    state = { ...state, timeLeft: clock.remaining() };
    updateTime();
    if (!finishIfNeeded() && Math.ceil(state.timeLeft) !== lastSavedSecond)
      persist();
  }

  function concealField(concealed: boolean): void {
    screen.classList.toggle('is-paused', concealed);
    root
      .querySelectorAll<HTMLElement>(
        '.game-header, .cauldron-hero, .ingredient-slots, .primary-action',
      )
      .forEach((field) => {
        field.inert = concealed;
      });
  }

  function pause(showDialog = true): void {
    if (state?.status !== 'playing') return;
    tick();
    if (state.status !== 'playing') return;
    state = pauseGame(state, clock?.remaining() ?? state.timeLeft);
    persist();
    clearInterval(timer);
    concealField(true);
    render();
    if (showDialog) {
      root
        .querySelectorAll<HTMLDialogElement>('dialog[open]')
        .forEach((dialog) => dialog.close());
      get<HTMLDialogElement>('#pause-dialog').showModal();
    }
  }

  function resume(): void {
    if (state?.status !== 'paused') return;
    state = resumeGame(state);
    persist();
    clock?.reset(state.timeLeft);
    get<HTMLDialogElement>('#pause-dialog').close();
    concealField(false);
    render();
    timer = setInterval(tick, 100);
    get<HTMLButtonElement>('[data-action="pause"]').focus();
  }

  function start(
    difficulty: Difficulty = loadDifficulty(),
    saved?: SavedGame,
  ): void {
    concealField(false);
    clearInterval(timer);
    root
      .querySelectorAll<HTMLDialogElement>('dialog[open]')
      .forEach((dialog) => dialog.close());
    root.querySelector('.recipe-panel')?.remove();
    root.querySelector('#time-progress')?.remove();
    state = saved
      ? { ...saved, status: 'paused' }
      : createGame(Math.random, difficulty);
    if (!saved) clearSave();
    screen.classList.toggle('is-hard', difficulty === 'hard');
    clock = new RunClock(state.timeLeft);
    get('#game-time').parentElement?.insertAdjacentHTML(
      'beforeend',
      `<progress id="time-progress" class="time-progress" max="${DIFFICULTY_SETTINGS[difficulty].startTime}" value="${state.timeLeft}" aria-label="Remaining time"></progress>`,
    );
    if (!saved) timer = setInterval(tick, 100);
    screen.classList.add('is-running');
    menuButton.disabled = true;
    primary.innerHTML =
      '<div class="run-primary"><p id="game-lives" aria-live="polite"></p><p class="save-status" id="save-status" role="status"></p><p id="brew-feedback" role="status">Select ingredients from the shelf.</p><button class="run-button brew-button" type="button" data-action="brew" disabled>Brew</button><button class="run-button" type="button" data-action="pause">Pause</button><button class="run-button" type="button" data-action="exit-run">Return to Menu</button></div>';
    render();
    persist();
    if (saved) {
      concealField(true);
      get<HTMLDialogElement>('#pause-dialog').showModal();
      return;
    }
    root
      .querySelector<HTMLButtonElement>('[data-ingredient]:not(:disabled)')
      ?.focus();
  }

  function exit(): void {
    clearSave();
    concealField(false);
    get<HTMLDialogElement>('#pause-dialog').close();
    clearInterval(timer);
    clock = null;
    get<HTMLDialogElement>('#game-over-dialog').close();
    root.querySelector('#time-progress')?.remove();
    get('#game-time')
      .closest('.counter-details')
      ?.classList.remove('timer-urgent');
    state = null;
    screen.classList.remove('is-running', 'is-hard');
    menuButton.disabled = false;
    get('.slot-group-left').innerHTML = renderEmptySlots(1);
    get('.slot-group-right').innerHTML = renderEmptySlots(4);
    get('.cauldron-content').replaceChildren();
    root.querySelector('.recipe-panel')?.remove();
    get('#game-time').textContent = '0';
    get('#game-score').textContent = '0';
    primary.replaceChildren(...startContent);
    get<HTMLButtonElement>('#start-game').focus();
    root.dispatchEvent(new Event('game:exit'));
  }

  root.addEventListener(
    'game:start',
    (event) => {
      if (state?.status === 'playing' || state?.status === 'paused') return;
      const detail = (event as CustomEvent<StartGameRequest>).detail;
      if (isDifficulty(detail?.difficulty)) start(detail.difficulty);
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    'game:continue',
    (event) => {
      if (state?.status === 'playing' || state?.status === 'paused') return;
      const saved: unknown = (event as CustomEvent<unknown>).detail;
      if (isValidSave(saved)) start(saved.difficulty, saved);
    },
    { signal: abort.signal },
  );
  window.addEventListener(
    'pagehide',
    () => {
      if (state?.status === 'playing') pause(false);
    },
    { signal: abort.signal },
  );
  window.addEventListener(
    'pageshow',
    () => {
      if (state?.status === 'paused' && !root.querySelector('dialog[open]'))
        get<HTMLDialogElement>('#pause-dialog').showModal();
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('button')
          : null;
      if (!button || button.disabled) return;
      if (button.dataset.dialog === 'menu' && state?.status === 'game-over')
        exit();
      if (button.dataset.action === 'pause') {
        pause();
        return;
      }
      if (button.dataset.action === 'resume') {
        resume();
        return;
      }
      if (button.dataset.dialog === 'help') {
        pause(false);
      }
      if (button.dataset.action === 'play-again') {
        start(state?.difficulty);
        return;
      }
      if (button.dataset.action === 'exit-run') {
        exit();
        return;
      }
      if (button.dataset.ingredient || button.dataset.action === 'brew') {
        tick();
        if (state?.status !== 'playing') return;
      }
      if (button.dataset.action === 'brew' && state) {
        const outcome = brew(state);
        state = outcome.state;
        persist();
        clock?.reset(state.timeLeft);
        render();
        get('#brew-feedback').textContent =
          outcome.result === 'success'
            ? `Potion brewed! +${DIFFICULTY_SETTINGS[state.difficulty].scorePerBrew} points and +${DIFFICULTY_SETTINGS[state.difficulty].timeBonus} seconds (maximum ${DIFFICULTY_SETTINGS[state.difficulty].startTime}).`
            : state.lives
              ? 'The brew failed. One life lost. Try a new mixture.'
              : 'No lives remain. Return to the menu to start again.';
        if (finishIfNeeded()) return;
        root
          .querySelector<HTMLButtonElement>('[data-ingredient]:not(:disabled)')
          ?.focus();
        return;
      }
      const id = button.dataset.ingredient;
      if (!id || !state) return;
      state = addIngredient(state, id);
      persist();
      render();
      const same = root.querySelector<HTMLButtonElement>(
        `[data-ingredient="${id}"]:not(:disabled)`,
      );
      (
        same ??
        root.querySelector<HTMLButtonElement>(
          '[data-ingredient]:not(:disabled)',
        ) ??
        get('#ingredient-counter')
      ).focus();
    },
    { signal: abort.signal },
  );
  get<HTMLDialogElement>('#game-over-dialog').addEventListener(
    'cancel',
    (event) => event.preventDefault(),
    { signal: abort.signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) pause();
    },
    { signal: abort.signal },
  );
  get<HTMLDialogElement>('#pause-dialog').addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      resume();
    },
    { signal: abort.signal },
  );
  get<HTMLDialogElement>('#help-dialog').addEventListener(
    'close',
    () => {
      if (state?.status === 'paused' && !root.querySelector('dialog[open]'))
        get<HTMLDialogElement>('#pause-dialog').showModal();
    },
    { signal: abort.signal },
  );
  return () => {
    clearInterval(timer);
    abort.abort();
    results.dispose();
    root.querySelector('#game-over-dialog')?.remove();
    root.querySelector('#pause-dialog')?.remove();
  };
}
