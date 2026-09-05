import { AudioInput } from './audio.ts';
import type { AudioStatus } from './audio.ts';
import { ProceduralField } from './geometry.ts';
import { InteractionSystem } from './interaction.ts';
import { ModeController } from './modes.ts';
import { createScene } from './scene.ts';
import { DEFAULT_SETTINGS, damp } from './types.ts';
import type { AudioSource, EngineSettings, FieldState, ModeId, Telemetry } from './types.ts';

export interface EngineEvents {
  telemetry: (data: Telemetry) => void;
  settings: (settings: Readonly<EngineSettings>) => void;
  audio: (status: AudioStatus) => void;
  error: (message: string | null) => void;
}

/** Owns lifecycle and scheduling; individual systems own their behavior and resources. */
export class FieldEngine {
  readonly settings: EngineSettings;
  private readonly context;
  private readonly field;
  private readonly interaction;
  private readonly audio;
  private readonly modes = new ModeController();
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly controller = new AbortController();
  private readonly state: FieldState;
  private raf = 0;
  private lastFrame = 0;
  private elapsed = 0;
  private telemetryTime = 0;
  private measuredTime = 0;
  private frames = 0;
  private fps = 60;
  private slowWindows = 0;
  private quality: Telemetry['quality'] = 'standard';
  private audioRequest = 0;
  private lostContext = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, cursor: HTMLElement, private readonly events: EngineEvents) {
    this.settings = { ...DEFAULT_SETTINGS, paused: this.reducedMotion.matches };
    this.context = createScene(canvas);
    this.field = new ProceduralField(this.context.compact);
    this.context.scene.add(this.field.group);
    this.interaction = new InteractionSystem(canvas, this.context.camera, this.field.surface, cursor);
    this.audio = new AudioInput(status => {
      if (!status.active && !status.pending) {
        this.settings.audioReactive = false;
        this.events.settings(this.settings);
      }
      this.events.audio(status);
    });
    this.state = { time: 0, intensity: this.settings.intensity, audio: 0, profile: this.modes.current, pressures: this.interaction.pressures };
    this.field.setDensity(this.settings.density);
    this.field.update(this.state);
    this.context.renderer.render(this.context.scene, this.context.camera);
    const options = { signal: this.controller.signal };
    document.addEventListener('visibilitychange', this.onVisibility, options);
    canvas.addEventListener('webglcontextlost', this.onContextLost, options);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, options);
    this.reducedMotion.addEventListener('change', this.onReducedMotion, options);
    this.events.settings(this.settings);
    this.events.audio({ active: false, pending: false, message: 'Choose a source to modulate the field.' });
    this.raf = requestAnimationFrame(this.frame);
  }

  setMode(mode: ModeId): void {
    this.settings.mode = mode;
    this.modes.set(mode);
    this.events.settings(this.settings);
  }

  setIntensity(intensity: number): void {
    this.settings.intensity = Math.min(1, Math.max(0, intensity));
    this.events.settings(this.settings);
  }

  setDensity(density: number): void {
    this.settings.density = Math.min(1, Math.max(0, density));
    this.field.setDensity(this.settings.density);
    if (this.settings.paused) this.field.update(this.state);
    this.events.settings(this.settings);
  }

  togglePause(): void {
    this.settings.paused = !this.settings.paused;
    this.events.settings(this.settings);
  }

  async setAudio(enabled: boolean, source = this.settings.audioSource): Promise<void> {
    const request = ++this.audioRequest;
    this.settings.audioSource = source;
    this.settings.audioReactive = false;
    this.events.settings(this.settings);
    if (!enabled) { this.audio.stop(); return; }
    const active = await this.audio.enable(source);
    if (request !== this.audioRequest || this.disposed) return;
    this.settings.audioReactive = active;
    this.events.settings(this.settings);
  }

  setAudioSource(source: AudioSource): void {
    this.settings.audioSource = source;
    if (this.settings.audioReactive) void this.setAudio(true, source);
    else { this.audioRequest++; this.audio.stop(); this.events.settings(this.settings); }
  }

  reset(): void {
    this.audioRequest++;
    this.audio.stop();
    Object.assign(this.settings, DEFAULT_SETTINGS, { paused: this.reducedMotion.matches });
    this.modes.reset();
    this.interaction.clear();
    this.elapsed = this.state.time = 0;
    this.state.audio = 0;
    this.state.intensity = this.settings.intensity;
    this.field.setDensity(this.settings.density);
    this.field.update(this.state);
    this.events.settings(this.settings);
  }

  private frame = (now: number): void => {
    if (this.disposed || document.hidden || this.lostContext) return;
    const rawDt = this.lastFrame ? (now - this.lastFrame) / 1000 : 1 / 60;
    const dt = Math.min(rawDt, 0.05);
    this.lastFrame = now;
    if (!this.settings.paused) {
      this.elapsed += dt;
      this.modes.update(dt);
      this.state.intensity = damp(this.state.intensity, this.settings.intensity, 5, dt);
      this.state.time += dt * this.modes.current.speed * this.state.intensity * 1.6;
      this.interaction.update(dt);
      this.state.audio = this.audio.update(dt, this.elapsed);
      this.field.update(this.state);
    }
    this.context.renderer.render(this.context.scene, this.context.camera);
    this.telemetryTime += rawDt;
    this.measuredTime += rawDt;
    this.frames++;
    if (this.telemetryTime >= 0.25) {
      this.events.telemetry({
        fps: this.settings.paused ? 0 : this.fps,
        pressure: Math.min(1, this.interaction.pressures.reduce((sum, point) => sum + point.strength, 0)),
        audio: this.state.audio,
        time: this.elapsed,
        vertices: this.field.vertexCount,
        quality: this.quality,
      });
      this.telemetryTime = 0;
    }
    if (this.measuredTime >= 1.5) {
      this.fps = Math.round(this.frames / this.measuredTime);
      this.slowWindows = this.fps < 38 && !this.settings.paused ? this.slowWindows + 1 : 0;
      if (this.slowWindows >= 2) {
        if (this.context.lowerResolution()) this.quality = 'adaptive';
        this.slowWindows = 0;
      }
      this.frames = this.measuredTime = 0;
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private onVisibility = (): void => {
    cancelAnimationFrame(this.raf);
    this.lastFrame = 0;
    this.interaction.clear();
    if (document.hidden) {
      // Release hardware when the page goes into the background.
      if (this.settings.audioSource === 'microphone') void this.setAudio(false);
    } else if (!this.lostContext) this.raf = requestAnimationFrame(this.frame);
  };

  private onReducedMotion = (): void => {
    if (this.reducedMotion.matches) {
      this.settings.paused = true;
      this.events.settings(this.settings);
    }
  };

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    this.lostContext = true;
    cancelAnimationFrame(this.raf);
    void this.setAudio(false);
    this.events.error('The graphics connection was interrupted. Waiting to restore the field…');
  };

  private onContextRestored = (): void => {
    this.lostContext = false;
    this.lastFrame = 0;
    this.events.error(null);
    if (!document.hidden) this.raf = requestAnimationFrame(this.frame);
  };

  dispose(): void {
    this.disposed = true;
    this.audioRequest++;
    cancelAnimationFrame(this.raf);
    this.controller.abort();
    this.interaction.dispose();
    this.audio.dispose();
    this.field.dispose();
    this.context.dispose();
  }
}
