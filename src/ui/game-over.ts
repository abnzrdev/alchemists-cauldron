export function renderGameOver(): string {
  return `<dialog class="game-dialog" id="game-over-dialog" aria-labelledby="game-over-title"><h2 id="game-over-title">Game Over</h2><p id="game-over-reason"></p><p>Final score: <strong id="final-score"></strong></p><button type="button" class="panel-button panel-button-primary" data-action="play-again">Play again</button><button type="button" class="panel-button" data-action="exit-run">Return to Menu</button></dialog>`;
}
