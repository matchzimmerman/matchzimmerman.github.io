import './styles.css';
import { FieldEngine } from './engine/FieldEngine.ts';
import { Controls } from './ui/controls.ts';

const controls = new Controls();
let engine: FieldEngine | null = null;

try {
  engine = new FieldEngine(
    document.querySelector<HTMLCanvasElement>('#field')!,
    document.querySelector<HTMLElement>('#pressure-cursor')!,
    {
      settings: controls.renderSettings,
      telemetry: controls.renderTelemetry,
      audio: controls.renderAudio,
      error: controls.renderError,
    },
  );
  controls.bind(engine);
  document.body.classList.add('ready');
} catch (error) {
  console.error('FIELD ENGINE could not initialize:', error);
  controls.renderError('This browser could not start WebGL 2. Try an updated browser with hardware acceleration enabled.');
  document.querySelector<HTMLElement>('#run-state')!.textContent = 'UNAVAILABLE';
  document.querySelector<HTMLButtonElement>('#reload')?.addEventListener('click', () => location.reload());
}

// Dispose on navigation, but preserve state for the browser back/forward cache.
window.addEventListener('pagehide', event => {
  if (!event.persisted) { engine?.dispose(); controls.dispose(); }
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => { engine?.dispose(); controls.dispose(); });
}
