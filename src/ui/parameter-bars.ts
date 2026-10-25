import type { GameState } from '../state/game-state.ts';
import {
  PARAMETERS,
  BAR_LIMITS,
  barPosition,
  calculateCauldron,
  inRange,
} from '../logic/cauldron.ts';
const labels = {
  temperature: 'Temperature',
  density: 'Density',
  magicPower: 'Magic Power',
};
export function updateParameterBars(root: HTMLElement, state: GameState): void {
  let panel = root.querySelector<HTMLElement>('.parameter-bars');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'parameter-bars';
    panel.setAttribute('aria-label', 'Cauldron parameters');
    panel.innerHTML = `<p class="bar-recipe"></p>${PARAMETERS.map((key) => `<div class="parameter-row" data-parameter="${key}"><div class="parameter-label"><span>${labels[key]}</span><output></output></div><div class="parameter-track" role="meter" aria-label="${labels[key]}" aria-valuemin="${-BAR_LIMITS[key]}" aria-valuemax="${BAR_LIMITS[key]}"><span class="parameter-target"></span><span class="parameter-zero" aria-hidden="true"></span><span class="parameter-marker" aria-hidden="true"></span></div><span class="parameter-range"></span></div>`).join('')}`;
    root.querySelector('.cauldron-hero')?.append(panel);
  }
  panel.querySelector('.bar-recipe')!.textContent = state.activeRecipe.name;
  const values = calculateCauldron(state.cauldronIngredients);
  PARAMETERS.forEach((key) => {
    const row = panel.querySelector<HTMLElement>(`[data-parameter="${key}"]`)!;
    const range = state.activeRecipe[key];
    row.querySelector('output')!.textContent = String(values[key]);
    row.querySelector('.parameter-range')!.textContent =
      `Target: ${range.min} to ${range.max}`;
    const meter = row.querySelector<HTMLElement>('[role="meter"]')!;
    meter.setAttribute('aria-valuenow', String(values[key]));
    meter.setAttribute(
      'aria-valuetext',
      `${values[key]}; recipe target ${range.min} to ${range.max}`,
    );
    meter.style.setProperty(
      '--marker-position',
      `${barPosition(values[key], BAR_LIMITS[key])}%`,
    );
    meter.style.setProperty(
      '--target-start',
      `${barPosition(range.min, BAR_LIMITS[key])}%`,
    );
    meter.style.setProperty(
      '--target-width',
      `${((range.max - range.min) / (2 * BAR_LIMITS[key])) * 100}%`,
    );
    meter.classList.toggle('parameter-in-range', inRange(values[key], range));
  });
}
