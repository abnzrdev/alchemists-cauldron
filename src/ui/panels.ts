import {
  message,
  attribute,
  textBinding,
  t,
  renderLanguageSelector,
} from '../i18n/index.ts';
import { DIFFICULTIES } from '../data/difficulty';

export function renderPanels(): string {
  const difficulties = DIFFICULTIES.map(
    (difficulty) =>
      `<button class="difficulty-button" type="button" data-difficulty="${difficulty}" aria-pressed="${difficulty === 'medium'}">${message(`common.${difficulty}`)}</button>`,
  ).join('');
  return `
    <dialog class="game-dialog menu-dialog" id="menu-dialog" aria-labelledby="menu-title">
      ${renderLanguageSelector('menu-language')}<h2 id="menu-title">${message('menu.title')}</h2>
      <p class="panel-intro">${message('menu.intro')}</p>
      <fieldset class="difficulty-picker"><legend>${message('menu.choose')}</legend><div class="difficulty-options">${difficulties}</div></fieldset>
      <p class="difficulty-summary" id="difficulty-summary" aria-live="polite"></p>
      <p class="difficulty-details" id="difficulty-details"></p>
      <div class="menu-actions">
        <button type="button" data-action="continue" hidden>${message('menu.continue')}</button>
        <p class="resume-summary" id="resume-summary" hidden></p>
        <button class="menu-primary" type="button" data-action="new-game">${message('menu.new')}</button>
        <button type="button" data-dialog="leaderboard">${message('common.leaderboard')}</button>
        <button type="button" data-dialog="help">${message('menu.help')}</button>
      </div>
      <form method="dialog" class="panel-footer"><button>${message('common.back')}</button></form>
    </dialog>
    <dialog class="game-dialog leaderboard-dialog" id="leaderboard-dialog" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">${message('leaderboard.title')}</h2>
      <label for="leaderboard-difficulty">${message('common.difficulty')}<select id="leaderboard-difficulty">${DIFFICULTIES.map((difficulty) => `<option value="${difficulty}" ${textBinding(`common.${difficulty}`)}>${t(`common.${difficulty}`)}</option>`).join('')}</select></label><p id="leaderboard-empty" class="panel-intro">${message('leaderboard.empty')}</p>
      <div class="leaderboard-scroll" tabindex="0" role="region" ${attribute('aria-label', 'leaderboard.top')} hidden>
        <table class="leaderboard-table"><caption id="leaderboard-caption"></caption><thead><tr><th scope="col">${message('leaderboard.rank')}</th><th scope="col">${message('leaderboard.name')}</th><th scope="col">${message('common.score')}</th><th scope="col">${message('common.difficulty')}</th><th scope="col">${message('leaderboard.date')}</th></tr></thead><tbody id="leaderboard-rows"></tbody></table>
      </div>
      <button type="button" data-action="clear-leaderboard" hidden>${message('leaderboard.clear')}</button>
      <dialog class="game-dialog clear-confirmation" id="clear-confirmation" aria-labelledby="clear-title"><h3 id="clear-title">${message('leaderboard.confirm')}</h3><p>${message('leaderboard.warning')}</p><button type="button" data-action="confirm-clear">${message('leaderboard.clearScores')}</button><button type="button" data-action="cancel-clear">${message('leaderboard.keep')}</button></dialog>
      <p class="panel-status" id="leaderboard-status" role="status"></p>
      <div class="panel-footer"><button type="button" data-dialog="menu">${message('common.backMenu')}</button><form method="dialog"><button>${message('common.close')}</button></form></div>
    </dialog>
    <dialog class="game-dialog" id="help-dialog" aria-labelledby="help-title">
      <h2 id="help-title">${message('help.title')}</h2>
      <p>${message('help.intro')}</p>
      <ol class="rules-list"><li>${message('help.step1')}</li><li>${message('help.step2')}</li><li>${message('help.step3')}</li><li>${message('help.step4')}</li><li>${message('help.step5')}</li></ol>
      <p>${message('help.medium')}</p>
      <p>${message('help.pour')}</p>
      <p>${message('help.keyboard')}</p>
      <p>${message('help.hard')}</p>
      <form method="dialog" class="panel-footer"><button>${message('common.back')}</button></form>
    </dialog>`;
}
