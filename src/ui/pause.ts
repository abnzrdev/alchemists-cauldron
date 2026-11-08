import { message, renderLanguageSelector } from '../i18n/index.ts';
export function renderPause(): string {
  return `<dialog class="game-dialog" id="pause-dialog" aria-labelledby="pause-title">${renderLanguageSelector('pause-language')}<h2 id="pause-title">${message('pause.title')}</h2><p>${message('pause.intro')}</p><button type="button" class="panel-button panel-button-primary" data-action="resume">${message('pause.resume')}</button><button type="button" class="panel-button" data-action="exit-run">${message('pause.exit')}</button></dialog>`;
}
