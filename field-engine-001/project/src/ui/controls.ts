import { MODES } from '../engine/modes.ts';
import type { AudioStatus } from '../engine/audio.ts';
import type { FieldEngine } from '../engine/FieldEngine.ts';
import type { AudioSource, EngineSettings, ModeId, Telemetry } from '../engine/types.ts';

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing interface element: ${id}`);
  return value as T;
}

export class Controls {
  private readonly controller = new AbortController();
  private readonly modeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-mode]')];
  private readonly intensity = element<HTMLInputElement>('intensity');
  private readonly density = element<HTMLInputElement>('density');
  private readonly audioToggle = element<HTMLInputElement>('audio-toggle');
  private readonly audioSource = element<HTMLSelectElement>('audio-source');
  private readonly audioStatus = element('audio-status');
  private readonly pause = element<HTMLButtonElement>('pause');
  private readonly pressureLevel = element('pressure-level');
  private readonly audioLevel = element('audio-level');
  private readonly clock = element('clock');
  private readonly fps = element('fps');
  private pendingAudio = false;

  bind(engine: FieldEngine): void {
    const options = { signal: this.controller.signal };
    for (const button of this.modeButtons) {
      button.addEventListener('click', () => engine.setMode(button.dataset.mode as ModeId), options);
    }
    this.intensity.addEventListener('input', () => engine.setIntensity(Number(this.intensity.value) / 100), options);
    this.density.addEventListener('input', () => engine.setDensity(Number(this.density.value) / 100), options);
    this.audioToggle.addEventListener('change', () => { void engine.setAudio(this.audioToggle.checked); }, options);
    this.audioSource.addEventListener('change', () => engine.setAudioSource(this.audioSource.value as AudioSource), options);
    this.pause.addEventListener('click', () => engine.togglePause(), options);
    element('reset').addEventListener('click', () => engine.reset(), options);
    element('reload').addEventListener('click', () => location.reload(), options);
    document.addEventListener('keydown', event => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(target.tagName) || target.isContentEditable || event.metaKey || event.ctrlKey || event.altKey) return;
      const mode = ({ '1': 'calm', '2': 'pressure', '3': 'rupture' } as Record<string, ModeId>)[event.key];
      if (mode) engine.setMode(mode);
      if (event.code === 'Space') { event.preventDefault(); engine.togglePause(); }
    }, options);
    const detail = element<HTMLDetailsElement>('parameters');
    detail.open = window.innerWidth > 760;
  }

  renderSettings = (settings: Readonly<EngineSettings>): void => {
    document.body.dataset.mode = settings.mode;
    document.body.classList.toggle('is-paused', settings.paused);
    for (const button of this.modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === settings.mode));
    this.intensity.value = String(Math.round(settings.intensity * 100));
    this.density.value = String(Math.round(settings.density * 100));
    element('intensity-value').textContent = `${this.intensity.value}%`;
    element('density-value').textContent = `${this.density.value}%`;
    this.intensity.style.setProperty('--fill', `${this.intensity.value}%`);
    this.density.style.setProperty('--fill', `${this.density.value}%`);
    this.audioToggle.checked = settings.audioReactive || this.pendingAudio;
    this.audioSource.value = settings.audioSource;
    this.pause.setAttribute('aria-pressed', String(settings.paused));
    this.pause.setAttribute('aria-label', settings.paused ? 'Resume motion' : 'Pause motion');
    element('pause-label').textContent = settings.paused ? 'RESUME' : 'PAUSE';
    element('run-state').textContent = settings.paused ? 'PAUSED' : 'RUNNING';
    element('mode-name').textContent = MODES[settings.mode].label;
    element('mode-description').textContent = MODES[settings.mode].description;
  };

  renderAudio = (status: AudioStatus): void => {
    this.pendingAudio = status.pending;
    this.audioToggle.checked = status.active || status.pending;
    this.audioToggle.setAttribute('aria-busy', String(status.pending));
    this.audioStatus.textContent = status.message;
    if (!status.active) this.audioLevel.style.setProperty('--level', '0%');
  };

  renderTelemetry = (data: Telemetry): void => {
    this.pressureLevel.style.setProperty('--level', `${data.pressure * 100}%`);
    this.audioLevel.style.setProperty('--level', `${data.audio * 100}%`);
    element('pressure-value').textContent = data.pressure.toFixed(2);
    const minutes = Math.floor(data.time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(data.time % 60).toString().padStart(2, '0');
    this.clock.textContent = `${minutes}:${seconds}`;
    this.fps.textContent = data.fps ? `${data.fps} FPS` : 'STILL';
    this.fps.title = `${data.vertices.toLocaleString()} vertices · ${data.quality} resolution`;
  };

  renderError = (message: string | null): void => {
    element('error').hidden = !message;
    if (message) element('error-message').textContent = message;
  };

  dispose(): void { this.controller.abort(); }
}
