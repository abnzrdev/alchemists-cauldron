import { bindLocalization } from './i18n/index.ts';
import { registerPwa } from './pwa/register.ts';
import { mountGame } from './state/application';
import './styles/main.scss';
import {
  bindStartScreen,
  observeCompositionSizing,
  renderStartScreen,
} from './ui/startScreen';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element not found');
}

app.innerHTML = renderStartScreen();
const compositionObserver = observeCompositionSizing(app);
const unbindStartScreen = bindStartScreen(app);
const unbindGame = mountGame(app);
const unbindLocalization = bindLocalization(app);
registerPwa(app);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    compositionObserver.disconnect();
    unbindStartScreen();
    unbindGame();
    unbindLocalization();
  });
}
