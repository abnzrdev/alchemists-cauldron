const KEY_ACTIONS: Readonly<Record<string, string>> = {
  '1': 'ingredient-0',
  '2': 'ingredient-1',
  '3': 'ingredient-2',
  '4': 'ingredient-3',
  '5': 'ingredient-4',
  '6': 'ingredient-5',
  '7': 'ingredient-6',
  '8': 'ingredient-7',
  b: 'brew',
  x: 'pour-out',
  p: 'pause',
};

export function shortcutAction(key: string): string | undefined {
  return Object.hasOwn(KEY_ACTIONS, key.toLowerCase())
    ? KEY_ACTIONS[key.toLowerCase()]
    : undefined;
}

export function bindGameShortcuts(
  root: HTMLElement,
  isPlaying: () => boolean,
): () => void {
  const abort = new AbortController();
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        !isPlaying() ||
        root.querySelector('dialog[open]') ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
        )
      )
        return;
      const action = shortcutAction(event.key);
      if (!action) return;
      const control = action.startsWith('ingredient-')
        ? root.querySelectorAll<HTMLButtonElement>('[data-ingredient]')[
            Number(action.slice('ingredient-'.length))
          ]
        : root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (!control || control.disabled) return;
      event.preventDefault();
      control.click();
    },
    { signal: abort.signal },
  );
  return () => abort.abort();
}
