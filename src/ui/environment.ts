import { asset } from './assets';

// Architectural scenery is independent of every interactive game element.
export function renderEnvironment(): string {
  return `<div class="workshop-environment" aria-hidden="true">
    <div class="workshop-arch"></div>
    <div class="workshop-column workshop-column-left"></div>
    <div class="workshop-column workshop-column-right"></div>
    <img class="workshop-candle workshop-candle-left" src="${asset('EnvironmentCandleSconce')}" alt="" />
    <img class="workshop-candle workshop-candle-right" src="${asset('EnvironmentCandleSconce')}" alt="" />
    <img class="workshop-ember workshop-ember-left" src="${asset('EmberGlowLeft')}" alt="" />
    <img class="workshop-ember workshop-ember-right" src="${asset('EmberGlowRight')}" alt="" />
  </div>`;
}
