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
      panel = document.createElement('div');
      panel.className = 'run-panel';
      get('.cauldron-hero').append(panel);
    }
    panel.innerHTML = renderMixture(state);
  }

  function start(): void {
    state = createGame();
    screen.classList.add('is-running');
    menuButton.disabled = true;
    primary.innerHTML =
      '<div class="run-primary"><p>Select ingredients from the shelf.</p><button class="run-button" type="button" data-action="exit-run">Return to Menu</button></div>';
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
    root.querySelector('.run-panel')?.remove();
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
