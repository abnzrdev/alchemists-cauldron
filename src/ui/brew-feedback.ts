export function bindBrewFeedback(root: HTMLElement) {
  const screen = root.querySelector<HTMLElement>('.start-screen')!;
  const effects = root.querySelector<HTMLElement>('.cauldron-effects')!;
  const abort = new AbortController();
  const reset = () => {
    effects.replaceChildren();
    screen.classList.remove('brew-failed');
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
      reset();
      const burst = document.createElement('span');
      burst.className = `brew-burst brew-burst-${result}`;
      effects.append(burst);
      if (
        result === 'failure' &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        // Restart the CSS animation even for consecutive failed brews.
        void screen.offsetWidth;
        screen.classList.add('brew-failed');
      }
    },
    dispose() {
      reset();
      abort.abort();
    },
  };
}
