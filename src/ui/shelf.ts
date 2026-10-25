import type { Ingredient } from '../data/ingredients.ts';
import { DIFFICULTY_SETTINGS } from '../data/difficulty.ts';
import type { GameState } from '../state/game-state.ts';
import { getShelfIngredients, canAddIngredient } from '../state/game-state.ts';
import { asset } from './assets.ts';

export function renderIngredientIcon(ingredient: Ingredient): string {
  return `<img class="ingredient-glyph" src="${asset(`ingredients/${ingredient.id}`, 'webp')}" alt="" aria-hidden="true" draggable="false" width="512" height="512" />`;
}
const signed = (value: number) =>
  value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0';

export function renderIngredientStats(ingredient: Ingredient): string {
  return `<span class="ingredient-card-stats"><span>Temperature <strong>${signed(ingredient.temperature)}</strong></span><span>Density <strong>${signed(ingredient.density)}</strong></span><span>Magic Power <strong>${signed(ingredient.magicPower)}</strong></span></span>`;
}

export function renderShelf(state: GameState, side: 0 | 1): string {
  const full =
    state.cauldronIngredients.length >=
    DIFFICULTY_SETTINGS[state.difficulty].cauldronLimit;
  const ingredients = getShelfIngredients(state.difficulty);
  const half = ingredients.length / 2;
  return ingredients
    .slice(side * half, (side + 1) * half)
    .map((ingredient) => {
      const stock = state.shelfStock[ingredient.id];
      const empty = stock === 0;
      return `<button class="ingredient-card${empty ? ' ingredient-card-empty' : ''}" type="button" data-ingredient="${ingredient.id}" draggable="${canAddIngredient(state, ingredient.id)}" ${empty || full || state.status !== 'playing' ? 'disabled' : ''} aria-label="${ingredient.name}${empty ? ', out of stock' : ''}">
      ${empty ? '' : `<span class="ingredient-card-heading">${renderIngredientIcon(ingredient)}<span>${ingredient.name}</span></span>${state.difficulty === 'hard' ? '' : renderIngredientStats(ingredient)}`}
      <span class="stock-badge" aria-label="Stock ${stock}">${stock}</span>
    </button>`;
    })
    .join('');
}

export function renderMixture(state: GameState): string {
  const full =
    state.cauldronIngredients.length ===
    DIFFICULTY_SETTINGS[state.difficulty].cauldronLimit;
  return `<p class="ingredient-counter${full ? ' ingredient-counter-full' : ''}" id="ingredient-counter" tabindex="-1" role="status">Ingredients: ${state.cauldronIngredients.length} / ${DIFFICULTY_SETTINGS[state.difficulty].cauldronLimit}</p>
    <ol class="mixture-order" aria-label="Ingredients in addition order">${state.cauldronIngredients.map((ingredient) => `<li>${ingredient.name}</li>`).join('')}</ol>`;
}
