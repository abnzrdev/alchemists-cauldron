export const INGREDIENT_DRAG_TYPE = 'application/x-alchemists-ingredient';

interface DragActions {
  canAdd: (id: string) => boolean;
  add: (id: string) => void;
}

export function bindIngredientDrag(
  root: HTMLElement,
  actions: DragActions,
): {
  reset: () => void;
  dispose: () => void;
} {
  const abort = new AbortController();
  const { signal } = abort;
  const zone = root.querySelector<HTMLElement>('.hero-art')!;
  let draggedId: string | null = null;
  const reset = () => {
    draggedId = null;
    zone.classList.remove('is-drop-target');
  };
  const overZone = (target: EventTarget | null) =>
    target instanceof Node && zone.contains(target);

  root.addEventListener(
    'dragstart',
    (event) => {
      const card =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('[data-ingredient]')
          : null;
      const id = card?.dataset.ingredient;
      if (!id || card?.disabled || !event.dataTransfer || !actions.canAdd(id)) {
        event.preventDefault();
        reset();
        return;
      }
      draggedId = id;
      event.dataTransfer.setData(INGREDIENT_DRAG_TYPE, id);
      event.dataTransfer.effectAllowed = 'copy';
    },
    { signal },
  );
  root.addEventListener(
    'dragover',
    (event) => {
      const valid =
        overZone(event.target) &&
        draggedId !== null &&
        actions.canAdd(draggedId);
      zone.classList.toggle('is-drop-target', valid);
      if (valid && event.dataTransfer) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    { signal },
  );
  root.addEventListener(
    'dragleave',
    (event) => {
      if (overZone(event.target) && !overZone(event.relatedTarget))
        zone.classList.remove('is-drop-target');
    },
    { signal },
  );
  root.addEventListener(
    'drop',
    (event) => {
      const id = event.dataTransfer?.getData(INGREDIENT_DRAG_TYPE);
      const valid =
        overZone(event.target) &&
        id === draggedId &&
        Boolean(id) &&
        actions.canAdd(id!);
      reset();
      if (!valid || !id) return;
      event.preventDefault();
      actions.add(id);
    },
    { signal },
  );
  root.addEventListener('dragend', reset, { signal });
  return {
    reset,
    dispose() {
      reset();
      abort.abort();
    },
  };
}
