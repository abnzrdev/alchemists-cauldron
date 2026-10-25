export function renderPause(): string {
  return `<dialog class="game-dialog" id="pause-dialog" aria-labelledby="pause-title"><h2 id="pause-title">Experiment paused</h2><p>Your time and mixture are preserved.</p><button type="button" class="panel-button panel-button-primary" data-action="resume">Resume</button><button type="button" class="panel-button" data-action="exit-run">Exit to Menu</button></dialog>`;
}
