import {
  message,
  attribute,
  setMessage,
  setAttributeMessage,
} from '../i18n/index.ts';
import type { GameState } from '../state/game-state.ts';
import {
  PARAMETERS,
  BAR_LIMITS,
  barPosition,
  inRange,
} from '../logic/cauldron.ts';
import { calculateMixture } from '../logic/reactions.ts';
const labels = {
  temperature: 'common.temperature',
  density: 'common.density',
  magicPower: 'common.magicPower',
} as const;
export function updateParameterBars(root: HTMLElement, state: GameState): void {
  let panel = root.querySelector<HTMLElement>('.parameter-bars');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'parameter-bars';
    setAttributeMessage(panel, 'aria-label', 'game.parameters');
    panel.innerHTML = `${PARAMETERS.map((key) => `<div class="parameter-row" data-parameter="${key}"><div class="parameter-label"><span>${message(labels[key])}</span><output></output></div><div class="parameter-track" role="meter" ${attribute('aria-label', labels[key])} aria-valuemin="${-BAR_LIMITS[key]}" aria-valuemax="${BAR_LIMITS[key]}"><span class="parameter-target"></span><span class="parameter-zero" aria-hidden="true"></span><span class="parameter-marker" aria-hidden="true"></span></div><span class="parameter-range"></span></div>`).join('')}`;
    root.querySelector('.recipe-panel')?.append(panel);
  }
  const values = calculateMixture(state.cauldronIngredients, state.difficulty);
  PARAMETERS.forEach((key) => {
    const row = panel.querySelector<HTMLElement>(`[data-parameter="${key}"]`)!;
    const range = state.activeRecipe[key];
    row.querySelector('output')!.textContent = String(values[key]);
    setMessage(
      row.querySelector<HTMLElement>('.parameter-range')!,
      'game.target',
      range,
    );
    const meter = row.querySelector<HTMLElement>('[role="meter"]')!;
    meter.setAttribute('aria-valuenow', String(values[key]));
    setAttributeMessage(meter, 'aria-valuetext', 'game.meter', {
      value: values[key],
      ...range,
    });
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
