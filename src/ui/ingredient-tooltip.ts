import { INGREDIENTS } from '../data/ingredients.ts';
import { positionTooltip } from './tooltip-position.ts';
import { renderIngredientStats } from './shelf.ts';

export function bindIngredientTooltip(
  root: HTMLElement,
  enabled: () => boolean,
) {
  const abort = new AbortController();
  const { signal } = abort;
  const tooltip = document.createElement('div');
  tooltip.id = 'ingredient-tooltip';
  tooltip.className = 'ingredient-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  root.append(tooltip);
  let active: HTMLElement | null = null;
  const reset = () => {
    active?.removeAttribute('aria-describedby');
    active = null;
    tooltip.hidden = true;
  };
  const place = () => {
    if (!active) return;
    const position = positionTooltip(
      active.getBoundingClientRect(),
      tooltip.getBoundingClientRect(),
      { width: innerWidth, height: innerHeight },
    );
    const size = tooltip.getBoundingClientRect();
    for (const element of root.querySelectorAll(
      '.parameter-bars, .circular-control, .primary-action',
    )) {
      const obstacle = element.getBoundingClientRect();
      const above =
        Math.min(active.getBoundingClientRect().top, obstacle.top) -
        size.height -
        8;
      if (
        position.left < obstacle.right &&
        position.left + size.width > obstacle.left &&
        position.top < obstacle.bottom &&
        position.top + size.height > obstacle.top &&
        above >= 8
      ) {
        position.top = above;
        position.upward = true;
      }
    }
    tooltip.style.left = `${position.left}px`;
    tooltip.style.top = `${position.top}px`;
    tooltip.classList.toggle('tooltip-left', position.leftward);
    tooltip.classList.toggle('tooltip-up', position.upward);
  };
  const show = (target: EventTarget | null) => {
    const card =
      target instanceof Element
        ? target.closest<HTMLElement>('[data-ingredient]')
        : null;
    const ingredient = INGREDIENTS.find(
      (item) => item.id === card?.dataset.ingredient,
    );
    if (!card && active?.contains(document.activeElement) && enabled()) return;
    if (
      !enabled() ||
      !card ||
      !ingredient ||
      card.classList.contains('ingredient-card-empty')
    ) {
      reset();
      return;
    }
    if (active !== card) {
      reset();
      active = card;
      tooltip.innerHTML = renderIngredientStats(ingredient);
      card.setAttribute('aria-describedby', tooltip.id);
      tooltip.hidden = false;
    }
    place();
  };
  root.addEventListener('pointerover', (event) => show(event.target), {
    signal,
  });
  root.addEventListener('focusin', (event) => show(event.target), { signal });
  root.addEventListener(
    'pointerout',
    (event) => {
      if (
        event.relatedTarget instanceof Node &&
        active?.contains(event.relatedTarget)
      )
        return;
      if (active?.contains(document.activeElement)) return;
      reset();
    },
    { signal },
  );
  root.addEventListener('focusout', reset, { signal });
  root.addEventListener('dragstart', reset, { signal });
  root.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') reset();
    },
    { signal },
  );
  window.addEventListener('resize', place, { signal });
  window.addEventListener('scroll', place, { signal, capture: true });
  return {
    reset,
    dispose() {
      abort.abort();
      reset();
      tooltip.remove();
    },
  };
}
