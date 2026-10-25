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

export function mountLevelOne(root: HTMLElement): () => void {
  let state: GameState | null = null;
  const abort = new AbortController();
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
    get('.slot-group-right').innerHTML = renderShelf(state, 3);
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
    get('#game-time').textContent = String(state.timeLeft);
    get<HTMLButtonElement>('[data-action="brew"]').disabled =
      !state.cauldronIngredients.length || state.status !== 'playing';
    updateParameterBars(root, state);
  }

  function start(): void {
    state = createGame();
    screen.classList.add('is-running');
    menuButton.disabled = true;
    primary.innerHTML =
      '<div class="run-primary"><p id="brew-feedback" role="status">Select ingredients from the shelf.</p><button class="run-button brew-button" type="button" data-action="brew" disabled>Brew</button><button class="run-button" type="button" data-action="exit-run">Return to Menu</button></div>';
    render();
    root
      .querySelector<HTMLButtonElement>('[data-ingredient]:not(:disabled)')
      ?.focus();
  }

  function exit(): void {
    state = null;
    screen.classList.remove('is-running');
    menuButton.disabled = false;
    get('.slot-group-left').innerHTML = renderEmptySlots(1);
    get('.slot-group-right').innerHTML = renderEmptySlots(4);
    get('.cauldron-content').replaceChildren();
    root.querySelector('.recipe-panel')?.remove();
    get('#game-time').textContent = '0';
    get('#game-score').textContent = '0';
    primary.replaceChildren(...startContent);
    get<HTMLButtonElement>('#start-game').focus();
  }

  root.addEventListener('game:start', start, { signal: abort.signal });
  root.addEventListener(
    'click',
    (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('button')
          : null;
      if (!button || button.disabled) return;
      if (button.dataset.action === 'exit-run') {
        exit();
        return;
      }
      if (button.dataset.action === 'brew' && state) {
        const outcome = brew(state);
        state = outcome.state;
        render();
        get('#brew-feedback').textContent =
          outcome.result === 'success'
            ? 'Potion brewed! +200 points and +10 seconds (maximum 150).'
            : state.lives
              ? 'The brew failed. One life lost. Try a new mixture.'
              : 'No lives remain. Return to the menu to start again.';
        root
          .querySelector<HTMLButtonElement>('[data-ingredient]:not(:disabled)')
          ?.focus();
        return;
      }
      const id = button.dataset.ingredient;
      if (!id || !state) return;
      state = addIngredient(state, id);
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
  return () => abort.abort();
}
