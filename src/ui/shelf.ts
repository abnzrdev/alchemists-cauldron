import type { Ingredient } from '../data/ingredients.ts';
import { LEVEL_ONE_SETTINGS } from '../data/levelOne.ts';
import type { GameState } from '../state/game-state.ts';
import { LEVEL_ONE_INGREDIENTS } from '../state/game-state.ts';

export function renderIngredientIcon(ingredient: Ingredient): string {
  return `<svg class="ingredient-glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="${import.meta.env.BASE_URL}assets/ingredients.svg#${ingredient.icon}"></use></svg>`;
}
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

export function renderShelf(state: GameState, offset: number): string {
  const full =
    state.cauldronIngredients.length >= LEVEL_ONE_SETTINGS.cauldronLimit;
  return LEVEL_ONE_INGREDIENTS.slice(offset, offset + 3)
    .map((ingredient) => {
      const stock = state.shelfStock[ingredient.id];
      const empty = stock === 0;
      return `<button class="ingredient-card${empty ? ' ingredient-card-empty' : ''}" type="button" data-ingredient="${ingredient.id}" ${empty || full || state.status !== 'playing' ? 'disabled' : ''} aria-label="${ingredient.name}${empty ? ', out of stock' : ''}">
      ${empty ? '' : `<span class="ingredient-card-heading">${renderIngredientIcon(ingredient)}<span>${ingredient.name}</span></span><span class="ingredient-card-stats"><span>Temperature <strong>${signed(ingredient.temperature)}</strong></span><span>Density <strong>${signed(ingredient.density)}</strong></span><span>Magic Power <strong>${signed(ingredient.magicPower)}</strong></span></span>`}
      <span class="stock-badge" aria-label="Stock ${stock}">${stock}</span>
    </button>`;
    })
    .join('');
}

export function renderMixture(state: GameState): string {
  const full =
    state.cauldronIngredients.length === LEVEL_ONE_SETTINGS.cauldronLimit;
  return `<p class="ingredient-counter${full ? ' ingredient-counter-full' : ''}" id="ingredient-counter" tabindex="-1" role="status">Ingredients: ${state.cauldronIngredients.length} / ${LEVEL_ONE_SETTINGS.cauldronLimit}</p>
    <ol class="mixture-order" aria-label="Ingredients in addition order">${state.cauldronIngredients.map((ingredient) => `<li>${ingredient.name}</li>`).join('')}</ol>`;
}
