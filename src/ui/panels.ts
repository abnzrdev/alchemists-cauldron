import { DIFFICULTIES, DIFFICULTY_SETTINGS } from '../data/difficulty';

export function renderPanels(): string {
  const difficulties = DIFFICULTIES.map(
    (difficulty) =>
      `<button class="difficulty-button" type="button" data-difficulty="${difficulty}" aria-pressed="${difficulty === 'medium'}">${DIFFICULTY_SETTINGS[difficulty].label}</button>`,
  ).join('');
  return `
    <dialog class="game-dialog menu-dialog" id="menu-dialog" aria-labelledby="menu-title">
      <h2 id="menu-title">The alchemist’s menu</h2>
      <p class="panel-intro">Prepare your next experiment.</p>
      <fieldset class="difficulty-picker"><legend>Choose difficulty</legend><div class="difficulty-options">${difficulties}</div></fieldset>
      <p class="difficulty-summary" id="difficulty-summary" aria-live="polite"></p>
      <p class="difficulty-details" id="difficulty-details"></p>
      <div class="menu-actions">
        <button type="button" data-action="continue" hidden>Continue Game</button>
        <p class="resume-summary" id="resume-summary" hidden></p>
        <button class="menu-primary" type="button" data-action="new-game">New Game</button>
        <button type="button" data-dialog="leaderboard">Leaderboard</button>
        <button type="button" data-dialog="help">How to play</button>
      </div>
      <form method="dialog" class="panel-footer"><button>Back to the workshop</button></form>
    </dialog>
    <dialog class="game-dialog leaderboard-dialog" id="leaderboard-dialog" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">The alchemists’ leaderboard</h2>
      <label for="leaderboard-difficulty">Difficulty<select id="leaderboard-difficulty">${DIFFICULTIES.map((difficulty) => `<option value="${difficulty}">${DIFFICULTY_SETTINGS[difficulty].label}</option>`).join('')}</select></label><p id="leaderboard-empty" class="panel-intro">No scores yet. Complete a game to earn your place here.</p>
      <div class="leaderboard-scroll" tabindex="0" role="region" aria-label="Top ten scores" hidden>
        <table class="leaderboard-table"><caption id="leaderboard-caption"></caption><thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Score</th><th scope="col">Difficulty</th><th scope="col">Date</th></tr></thead><tbody id="leaderboard-rows"></tbody></table>
      </div>
      <button type="button" data-action="clear-leaderboard" hidden>Clear Leaderboard</button>
      <dialog class="game-dialog clear-confirmation" id="clear-confirmation" aria-labelledby="clear-title"><h3 id="clear-title">Clear these scores?</h3><p>This removes only the selected difficulty’s Top-10 results.</p><button type="button" data-action="confirm-clear">Clear scores</button><button type="button" data-action="cancel-clear">Keep scores</button></dialog>
      <p class="panel-status" id="leaderboard-status" role="status"></p>
      <div class="panel-footer"><button type="button" data-dialog="menu">Back to Menu</button><form method="dialog"><button>Close</button></form></div>
    </dialog>
    <dialog class="game-dialog" id="help-dialog" aria-labelledby="help-title">
      <h2 id="help-title">The alchemist’s guide</h2>
      <p>Click or drag a stocked ingredient into the cauldron. Easy and Medium show statistics directly; Hard shows them on hover or keyboard focus.</p>
      <ol class="rules-list"><li>Choose Easy, Medium or Hard in Menu, then start a new game.</li><li>Add ingredients to the cauldron. Each portion uses one item from your limited stock.</li><li>Match the recipe’s Temperature, Density, and Magic Power ranges, then Brew.</li><li>Successful brews earn points and extra time. Failed mixtures cost a life; used ingredients stay spent.</li><li>The run ends when time or lives run out, or when both the shelf and cauldron are empty.</li></ol>
      <p>Pause preserves your run. Easy has no reactions. Medium enables Pressure Spike (Density at least 70: Density becomes 70, Magic Power +10%) and Steam Burst (Dragon Tears + Caustic Acid, Temperature at least 35: Temperature +10, lose 5 seconds).</p>
      <p>Pour Out empties the cauldron for 10 seconds without losing a life or refunding stock.</p>
      <p>During play: 1–8 select ingredients in shelf order, B brews, X pours out, and P pauses. While paused, use the Resume button or Escape to resume; gameplay shortcuts are inactive. Enter and Space operate focused buttons normally. Shortcuts never run in text fields, on the Start Screen or on Game Over.</p>
      <p>Hard enables Volatile Mix (Phoenix Feather + Essence of the Void: lose one life and clear the cauldron), Magma Flux (Temperature at least 60: Magic Power +20%, Density −10%) and Black Ice (Frost Lotus + Essence of the Void, Density at most 0: Temperature −10, Magic Power +20%). Time and life costs occur only when a reaction becomes active; spent stock is never refunded.</p>
      <form method="dialog" class="panel-footer"><button>Back to the workshop</button></form>
    </dialog>`;
}
