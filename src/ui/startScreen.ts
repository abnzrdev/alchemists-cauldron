import { renderPanels } from './panels';
export { bindStartScreen } from './menu';
import { renderEnvironment } from './environment';
import { asset } from './assets';

function counter(label: string, icon: string): string {
  return `
    <div class="counter-slot" data-scale-width="280">
      <div class="game-counter" role="group" aria-label="${label}">
        <img class="counter-plaque" src="${asset('CarvedPlaque')}" alt="" />
        <img class="counter-inset" src="${asset('InsetPanel')}" alt="" />
        <div class="counter-content">
          <img src="${asset(icon)}" alt="" />
          <div class="counter-details"><span>${label}</span><output id="game-${label.toLowerCase()}" aria-label="${label}">0</output></div>
        </div>
      </div>
    </div>`;
}

function circularControl(label: 'Help' | 'Menu'): string {
  const icon =
    label === 'Help'
      ? `<span class="book-icon"><i class="book-page book-page-left"></i><i class="book-page book-page-right"></i><i class="book-spine"></i><i class="book-cover"></i>${[0, 1, 2].map((i) => `<i class="book-line book-line-left ${i === 1 ? 'book-line-short' : ''}" style="--line:${i}"></i><i class="book-line book-line-right ${i === 1 ? 'book-line-short' : ''}" style="--line:${i}"></i>`).join('')}</span>`
      : '<span class="menu-icon"><i></i><i></i><i></i></span>';
  return `<button class="circular-control circular-control-${label.toLowerCase()}" type="button" data-dialog="${label.toLowerCase()}" aria-haspopup="dialog">
    <span class="control-ring" aria-hidden="true">
      <img class="ring-outer" src="${asset('RingOuter')}" alt="" />
      <img class="ring-inner" src="${asset('RingInnerPlate')}" alt="" />
      <img class="ring-highlight" src="${asset('RingHighlight')}" alt="" />
      ${icon}
      <img class="sparkle-top" src="${asset('SparkleTop')}" alt="" />
      <img class="sparkle-left" src="${asset('SparkleBottomLeft')}" alt="" />
      <img class="sparkle-right" src="${asset('SparkleBottomLeft')}" alt="" />
    </span><span class="control-label">${label.toUpperCase()}</span>
  </button>`;
}

export function renderEmptySlots(start: number): string {
  return Array.from({ length: 3 }, (_, index) => {
    const slot = start + index;
    return `<article class="ingredient-slot" data-slot-index="${slot}" aria-label="Empty ingredient slot ${slot}">
      <!-- Reserved for an accessible expanded detail area during gameplay. -->
      <div class="ingredient-content" hidden>
        <span class="ingredient-icon" data-field="icon"></span>
        <h2 class="ingredient-name" data-field="name"></h2>
        <dl class="ingredient-stats">
          <div><dt>Temperature</dt><dd data-field="temperature"></dd></div>
          <div><dt>Density</dt><dd data-field="density"></dd></div>
          <div><dt>Magic Power</dt><dd data-field="magic-power"></dd></div>
        </dl>
        <output class="ingredient-stock" data-field="stock" aria-label="Stock"></output>
      </div>
    </article>`;
  }).join('');
}

export function renderStartScreen(): string {
  return `<main class="start-screen">
    ${renderEnvironment()}
    <header class="game-header">
      ${counter('Time', 'Hourglass')}
      <div class="title-slot" data-scale-width="545.6"><div class="game-title">
        <span class="title-star" aria-hidden="true">✦</span><h1>Alchemist’s Cauldron</h1>
        <img class="title-flask" src="${asset('FlaskConical')}" alt="" />
        <div class="title-flourish" aria-hidden="true">
          <img class="flourish-vine flourish-vine-left" src="${asset('LeftVine')}" alt="" />
          <img class="flourish-leaves flourish-leaves-left" src="${asset('LeftLeaves')}" alt="" />
          <img class="flourish-vine flourish-vine-right" src="${asset('RightVine')}" alt="" />
          <img class="flourish-leaves flourish-leaves-right" src="${asset('RightLeaves')}" alt="" />
          <img class="flourish-stars" src="${asset('GoldStarbursts')}" alt="" />
        </div>
      </div></div>
      ${counter('Score', 'Compass')}
    </header>
    <section class="cauldron-hero" aria-label="Alchemist’s cauldron">
      <div class="hero-art" data-scale-width="600"><div class="hero-composition">
        <div class="cauldron-content" aria-hidden="true"></div>
        <div class="cauldron-effects" aria-hidden="true"></div>
        <img class="cauldron" src="${asset('Cauldron', 'png')}" alt="Empty engraved bronze cauldron" />
      </div></div>
    </section>
    <div class="primary-action"><div class="start-slot" data-scale-width="528">
      <button class="start-button" type="button" id="start-game">
        <img class="start-plaque" src="${asset('StartPlaque')}" alt="" />
        <img class="start-inset" src="${asset('StartInset')}" alt="" />
        <span class="start-seal" aria-hidden="true"></span><span class="start-seal-center" aria-hidden="true"></span>
        <span class="start-label">Start Game</span>
      </button>
    </div></div>
    <section class="ingredient-slots" aria-label="Ingredient inventory">
      <div class="slot-group slot-group-left">${renderEmptySlots(1)}</div><div class="slot-group slot-group-right">${renderEmptySlots(4)}</div>
    </section>
    <nav class="secondary-controls" aria-label="Game controls">${circularControl('Help')}${circularControl('Menu')}</nav>
    ${renderPanels()}
  </main>`;
}

// Preserve intrinsic SVG geometry while scaling each decorative composition as a unit.
export function observeCompositionSizing(root: HTMLElement): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      const element = target as HTMLElement;
      element.style.setProperty(
        '--composition-scale',
        String(contentRect.width / Number(element.dataset.scaleWidth)),
      );
    }
  });
  root
    .querySelectorAll<HTMLElement>('[data-scale-width]')
    .forEach((slot) => observer.observe(slot));
  return observer;
}
