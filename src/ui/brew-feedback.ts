import { asset } from './assets';
import { reactionVisual } from './reaction-visuals';
import type { GameState } from '../state/game-state';

const SPRITES = {
  success: 'effects/brew-success-splash',
  failure: 'final-polish/vfx-reaction-eruption-overlay',
  eruption: 'final-polish/vfx-reaction-eruption-overlay',
  steam: 'final-polish/vfx-reaction-steam-burst-blue',
  arcane: 'final-polish/vfx-reaction-arcane-vortex-purple',
} as const;

export function bindBrewFeedback(root: HTMLElement) {
  const screen = root.querySelector<HTMLElement>('.start-screen')!;
  const effects = root.querySelector<HTMLElement>('.cauldron-effects')!;
  const abort = new AbortController();
  const reset = () => {
    effects.replaceChildren();
    screen.classList.remove('brew-failed');
  };
  const show = (kind: keyof typeof SPRITES) => {
    reset();
    const burst = document.createElement('span');
    burst.className = `brew-burst brew-burst-${kind}`;
    const sprite = (name: string, className: string) =>
      `<img class="${className}" src="${asset(name, 'webp')}" alt="" draggable="false" />`;
    burst.innerHTML = `<span class="brew-inner-glow"></span>${sprite(SPRITES[kind], 'brew-vfx-layer')}`;
    if (kind === 'success') {
      burst.insertAdjacentHTML(
        'beforeend',
        sprite(
          'final-polish/vfx-summoning-circle-emerald-gold',
          'brew-summoning-circle',
        ),
      );
      for (let index = 0; index < 6; index++) {
        const mote = document.createElement('i');
        mote.className = 'brew-mote';
        mote.style.setProperty('--mote-x', `${30 + index * 8}%`);
        mote.style.setProperty('--mote-delay', `${180 + index * 60}ms`);
        burst.append(mote);
      }
    }
    effects.append(burst);
  };
  root.addEventListener(
    'animationend',
    (event) => {
      if (
        event.target instanceof Element &&
        event.target.classList.contains('brew-burst')
      )
        event.target.remove();
      if (event.animationName === 'brew-shake')
        screen.classList.remove('brew-failed');
    },
    { signal: abort.signal },
  );
  return {
    reset,
    play(result: 'success' | 'failure') {
      show(result);
      if (
        result === 'failure' &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        // Restart the CSS animation even for consecutive failed brews.
        void screen.offsetWidth;
        screen.classList.add('brew-failed');
      }
    },
    react(previous: GameState, selectedId: string) {
      const visual = reactionVisual(previous, selectedId);
      if (visual) show(visual);
    },
    dispose() {
      reset();
      abort.abort();
    },
  };
}
