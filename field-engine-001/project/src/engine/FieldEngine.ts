import { AudioInput } from './audio.ts';
import { sampleField } from './behavior.ts';
import type { AudioStatus } from './audio.ts';
import { ProceduralField } from './geometry.ts';
import { InteractionSystem } from './interaction.ts';
import { ModeController } from './modes.ts';
import { MaterialField } from './material.ts';
import { SoundEngine } from './sound.ts';
import type { SoundStatus } from './sound.ts';
import { createScene } from './scene.ts';
import { DEFAULT_SETTINGS, damp } from './types.ts';
import type { AudioSource, EngineSettings, FieldSample, FieldState, ModeId, Telemetry } from './types.ts';

export interface EngineEvents {
  telemetry: (data: Telemetry) => void;
  settings: (settings: Readonly<EngineSettings>) => void;
  audio: (status: AudioStatus) => void;
  sound: (status: SoundStatus) => void;
  error: (message: string | null) => void;
}

/** Owns lifecycle and scheduling; individual systems own their behavior and resources. */
export class FieldEngine {
  readonly settings: EngineSettings;
  private readonly context;
  private readonly field;
  private readonly interaction;
  private readonly audio;
  private readonly sound;
  private readonly material;
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
  private previousAudio = 0;
  private lastPulse = -1;
  private demoReleaseAt = 0;
  private readonly cursorSample: FieldSample = { x: 0, y: 0, z: 0, energy: 0 };

  constructor(canvas: HTMLCanvasElement, cursor: HTMLElement, private readonly events: EngineEvents) {
    this.settings = { ...DEFAULT_SETTINGS, paused: this.reducedMotion.matches };
    this.context = createScene(canvas);
    this.field = new ProceduralField(this.context.compact);
    this.context.scene.add(this.field.group);
    this.sound = new SoundEngine(this.events.sound);
    this.material = new MaterialField(this.context.compact, event => this.sound.excite(event, this.settings.mode));
    this.interaction = new InteractionSystem(canvas, this.context.camera, this.field.surface, cursor, event => {
      if (!this.settings.paused) this.material.excite(event);
    }, (x, z) => {
      sampleField(x, z, this.state, this.cursorSample);
      return this.cursorSample;
    });
    this.audio = new AudioInput(status => {
      if (!status.active && !status.pending) {
        this.settings.audioReactive = false;
        this.events.settings(this.settings);
      }
      this.events.audio(status);
    });
    this.state = { time: 0, intensity: this.settings.intensity, audio: 0, profile: this.modes.current, pressures: this.interaction.pressures, material: this.material };
    this.field.setDensity(this.settings.density);
    this.field.update(this.state);
    this.context.renderer.render(this.context.scene, this.context.camera);
    const options = { signal: this.controller.signal };
    document.addEventListener('visibilitychange', this.onVisibility, options);
    canvas.addEventListener('webglcontextlost', this.onContextLost, options);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, options);
    this.reducedMotion.addEventListener('change', this.onReducedMotion, options);
    this.events.settings(this.settings);
    this.events.audio({ active: false, pending: false, message: 'Optional: let a pulse or microphone play the material.' });
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
    this.sound.clear();
    if (this.settings.paused) this.sound.stop();
    this.interaction.clear();
    this.events.settings(this.settings);
  }

  async toggleSound(): Promise<void> {
    if (this.sound.active) { this.sound.stop(); return; }
    const started = await this.sound.start();
    if (!started || this.disposed) return;
    if (this.settings.paused) this.togglePause();
    this.material.excite({ x: 0, z: 1, force: 1, kind: 'press' });
    this.demoReleaseAt = this.elapsed + 0.4;
  }

  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.sound.setVolume(this.settings.volume);
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
    this.sound.stop();
    this.material.reset();
    Object.assign(this.settings, DEFAULT_SETTINGS, { paused: this.reducedMotion.matches });
    this.modes.reset();
    this.interaction.clear();
    this.elapsed = this.state.time = 0;
    this.previousAudio = this.demoReleaseAt = 0;
    this.lastPulse = -1;
    this.state.audio = 0;
    this.state.intensity = this.settings.intensity;
    this.field.setDensity(this.settings.density);
    this.sound.setVolume(this.settings.volume);
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
      if (this.state.audio - this.previousAudio > 0.035 && this.elapsed - this.lastPulse > 0.28) {
        this.lastPulse = this.elapsed;
        const a = this.elapsed * 0.55;
        this.material.excite({ x: Math.cos(a) * 2.8, z: Math.sin(a) * 2.8, force: Math.max(0.3, this.state.audio), kind: 'pulse' });
      }
      this.previousAudio = this.state.audio;
      if (this.demoReleaseAt && this.elapsed >= this.demoReleaseAt) {
        this.demoReleaseAt = 0;
        this.material.excite({ x: 0, z: 1, force: 0.8, kind: 'release' });
      }
      this.material.advance(dt, this.interaction.pressures, this.modes.current, this.state.intensity);
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
        energy: this.material.energy,
        memory: this.material.trace,
        contacts: this.interaction.pressures.filter(point => point.down).length,
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
      this.sound.stop();
      // Release hardware when the page goes into the background.
      if (this.settings.audioSource === 'microphone') void this.setAudio(false);
    } else if (!this.lostContext) this.raf = requestAnimationFrame(this.frame);
  };

  private onReducedMotion = (): void => {
    if (this.reducedMotion.matches) {
      this.settings.paused = true;
      this.sound.clear();
      this.interaction.clear();
      this.events.settings(this.settings);
    }
  };

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    this.lostContext = true;
    cancelAnimationFrame(this.raf);
    void this.setAudio(false);
    this.sound.stop();
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
    this.sound.dispose();
    this.field.dispose();
    this.context.dispose();
  }
}
