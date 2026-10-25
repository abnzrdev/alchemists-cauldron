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

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    compositionObserver.disconnect();
    unbindStartScreen();
  });
}
