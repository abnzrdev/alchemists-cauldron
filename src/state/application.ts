import {
  message,
  attribute,
  entityKey,
  ref,
  setMessage,
  clearMessage,
  setAttributeMessage,
} from '../i18n/index.ts';
import { bindIngredientDrag } from '../ui/ingredient-drag.ts';
import { updateCauldronLiquid } from '../ui/cauldron-liquid.ts';
import { getReactions } from '../data/reactions.ts';
import { evaluateReactions } from '../logic/reactions.ts';
import { bindIngredientTooltip } from '../ui/ingredient-tooltip.ts';
import { bindBrewFeedback } from '../ui/brew-feedback.ts';
import { bindGameShortcuts } from '../ui/keyboard-shortcuts.ts';
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
import { pourOut } from '../logic/pour-out.ts';
import { updateParameterBars } from '../ui/parameter-bars.ts';
import { addIngredient, canAddIngredient, createGame } from './game-state.ts';
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
  const feedback = bindBrewFeedback(root);
  const unbindShortcuts = bindGameShortcuts(
    root,
    () => state?.status === 'playing',
  );
  const tooltip = bindIngredientTooltip(
    root,
    () => state?.status === 'playing' && state.difficulty === 'hard',
  );

  const drag = bindIngredientDrag(root, {
    canAdd: (id) => state !== null && canAddIngredient(state, id),
    add: selectIngredient,
  });

  function selectIngredient(id: string): void {
    tick();
    if (!state) return;
    const previous = state;
    const next = addIngredient(state, id);
    if (next === state) return;
    state = next;
    clock?.reset(state.timeLeft);
    persist();
    render();
    feedback.react(previous, id);
    if (state.lives < previous.lives)
      setMessage(get('#brew-feedback'), 'game.volatile');
    else if (state.timeLeft < previous.timeLeft)
      setMessage(get('#brew-feedback'), 'game.steam');
    if (finishIfNeeded()) return;
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
  }

  function render(): void {
    tooltip.reset();
    drag.reset();
    if (!state) return;
    get('.slot-group-left').innerHTML = renderShelf(state, 0);
    get('.slot-group-right').innerHTML = renderShelf(state, 1);
    get('.cauldron-content').innerHTML = state.cauldronIngredients
      .map(renderIngredientIcon)
      .join('');
    updateCauldronLiquid(root, state.cauldronIngredients.length > 0);
    let panel = root.querySelector<HTMLElement>('.run-panel');
    if (!panel) {
      const recipe = document.createElement('section');
      recipe.className = 'recipe-panel';
      setAttributeMessage(recipe, 'aria-label', 'game.recipe');
      get('.cauldron-hero').append(recipe);
      panel = document.createElement('div');
      panel.className = 'run-panel';
      recipe.append(panel);
    }
    const active = evaluateReactions(
      state.cauldronIngredients,
      getReactions(state.difficulty),
    ).active;
    panel.innerHTML = `<h2 class="recipe-title">${message(entityKey('recipes', state.activeRecipe.id))}</h2>${renderMixture(state)}<p class="reaction-status" role="status">${active.length ? message('game.active', { reactions: active.map((item) => ref(entityKey('reactions', item.id))) }) : ''}</p>`;
    get('#game-score').textContent = String(state.score);
    updateTime();
    setMessage(get('#game-lives'), 'game.lives', {
      count: state.lives,
      total: DIFFICULTY_SETTINGS[state.difficulty].lives,
    });
    get<HTMLButtonElement>('[data-action="brew"]').disabled =
      !state.cauldronIngredients.length || state.status !== 'playing';
    get<HTMLButtonElement>('[data-action="pour-out"]').disabled =
      !state.cauldronIngredients.length || state.status !== 'playing';
    updateParameterBars(root, state);
  }

  function persist(): void {
    if (!state) return;
    lastSavedSecond = Math.ceil(state.timeLeft);
    const saved = saveGame(state);
    if (saved) clearMessage(get('#save-status'));
    else setMessage(get('#save-status'), 'game.saveError');
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
      setMessage(
        get('#game-over-reason'),
        reason === 'Time is up'
          ? 'game.timeUp'
          : reason === 'No lives left'
            ? 'game.livesOut'
            : 'game.ingredientsOut',
      );
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
    feedback.reset();
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
      `<progress id="time-progress" class="time-progress" max="${DIFFICULTY_SETTINGS[difficulty].startTime}" value="${state.timeLeft}" ${attribute('aria-label', 'game.remaining')}></progress>`,
    );
    if (!saved) timer = setInterval(tick, 100);
    screen.classList.add('is-running');
    menuButton.disabled = true;
    primary.innerHTML = `<div class="run-primary"><p id="game-lives" aria-live="polite"></p><p class="save-status" id="save-status" role="status"></p><p id="brew-feedback" role="status">${message('game.select')}</p><button class="run-button brew-button" type="button" data-action="brew" disabled>${message('common.brew')}</button><button class="run-button" type="button" data-action="pour-out" disabled>${message('common.pour')}</button><button class="run-button" type="button" data-action="pause">${message('common.pause')}</button><button class="run-button" type="button" data-action="exit-run">${message('common.returnMenu')}</button></div>`;
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
    feedback.reset();
    tooltip.reset();
    drag.reset();
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
    updateCauldronLiquid(root, false);
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
      if (button.dataset.action === 'pour-out') {
        tick();
        if (!state || state.status !== 'playing') return;
        const next = pourOut(state);
        if (next === state) return;
        state = next;
        clock?.reset(state.timeLeft);
        persist();
        render();
        setMessage(get('#brew-feedback'), 'game.emptied');
        finishIfNeeded();
        return;
      }
      if (button.dataset.action === 'brew') {
        tick();
        if (state?.status !== 'playing') return;
      }
      if (button.dataset.action === 'brew' && state) {
        const outcome = brew(state);
        state = outcome.state;
        persist();
        clock?.reset(state.timeLeft);
        render();
        if (outcome.result === 'success')
          setMessage(get('#brew-feedback'), 'game.success', {
            points: DIFFICULTY_SETTINGS[state.difficulty].scorePerBrew,
            seconds: DIFFICULTY_SETTINGS[state.difficulty].timeBonus,
            maximum: DIFFICULTY_SETTINGS[state.difficulty].startTime,
          });
        else
          setMessage(
            get('#brew-feedback'),
            state.lives ? 'game.failure' : 'game.noLives',
          );
        if (outcome.result !== 'ignored') feedback.play(outcome.result);
        if (finishIfNeeded()) return;
        root
          .querySelector<HTMLButtonElement>('[data-ingredient]:not(:disabled)')
          ?.focus();
        return;
      }
      const id = button.dataset.ingredient;
      if (id) selectIngredient(id);
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
    drag.dispose();
    tooltip.dispose();
    feedback.dispose();
    unbindShortcuts();
    root.querySelector('#game-over-dialog')?.remove();
    root.querySelector('#pause-dialog')?.remove();
  };
}
