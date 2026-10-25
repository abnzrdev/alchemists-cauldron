import { asset } from './assets.ts';

export function renderCauldronLiquid(): string {
  return `<div class="cauldron-liquid" aria-hidden="true" hidden>
    <img class="potion-liquid-image" src="${asset('effects/potion-liquid-emerald', 'webp')}" alt="" draggable="false" />
    <span class="liquid-ripple"></span><span class="liquid-ripple liquid-ripple-delayed"></span>
    <i class="liquid-bubble"></i><i class="liquid-bubble"></i><i class="liquid-bubble"></i>
  </div>`;
}

export function updateCauldronLiquid(root: HTMLElement, filled: boolean): void {
  const liquid = root.querySelector<HTMLElement>('.cauldron-liquid');
  if (liquid) liquid.hidden = !filled;
  root
    .querySelector<HTMLImageElement>('.cauldron')
    ?.setAttribute(
      'alt',
      filled
        ? 'Engraved bronze cauldron containing ingredients'
        : 'Empty engraved bronze cauldron',
    );
}
