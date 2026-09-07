import workletUrl from './sound.worklet.ts?worker&url';
import { mapStrike } from './sound-mapping.ts';
import type { Excitation, ModeId } from './types.ts';

export interface SoundStatus { active: boolean; pending: boolean; message: string }

/** Output is separate from microphone analysis. The context starts only on a click. */
export class SoundEngine {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private gain: GainNode | null = null;
  private generation = 0;
  private volume = 0.55;
  private readonly onStatus: (status: SoundStatus) => void;
  active = false;

  constructor(onStatus: (status: SoundStatus) => void) { this.onStatus = onStatus; }

  async start(): Promise<boolean> {
    if (this.active) return true;
    this.stop();
    const generation = this.generation;
    this.onStatus({ active: false, pending: true, message: 'Opening sound…' });
    try {
      const context = new AudioContext({ latencyHint: 'interactive' });
      this.context = context;
      // Resume before awaiting worklet loading, while the initiating gesture is live.
      const resume = context.resume();
      await Promise.all([resume, context.audioWorklet.addModule(workletUrl)]);
      if (generation !== this.generation) return false;
      if (context.state !== 'running') throw new Error('Audio was not started by the browser.');
      this.node = new AudioWorkletNode(context, 'field-resonator', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      this.gain = context.createGain();
      this.gain.gain.value = this.volume ** 2;
      this.node.connect(this.gain).connect(context.destination);
      this.node.onprocessorerror = () => {
        this.stop();
        this.onStatus({ active: false, pending: false, message: 'Sound was interrupted. Tap Start sound to reconnect.' });
      };
      context.onstatechange = () => {
        if (generation !== this.generation) return;
        if (context.state !== 'running' && this.active) {
          this.stop();
          this.onStatus({ active: false, pending: false, message: 'Sound paused by the device. Tap Start sound to reconnect.' });
        }
      };
      this.active = true;
      this.onStatus({ active: true, pending: false, message: 'Sound on. Touch the material to play.' });
      return true;
    } catch {
      if (generation !== this.generation) return false;
      this.stop();
      this.onStatus({ active: false, pending: false, message: 'Sound could not start. Try again in a current browser over HTTPS.' });
      return false;
    }
  }

  excite(event: Excitation, mode: ModeId): void {
    if (this.active) this.node?.port.postMessage({ type: 'strike', strike: mapStrike(event, mode) });
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gain && this.context) this.gain.gain.setTargetAtTime(this.volume ** 2, this.context.currentTime, 0.035);
  }

  clear(): void { this.node?.port.postMessage({ type: 'reset' }); }

  stop(): void {
    this.generation++;
    this.active = false;
    const context = this.context;
    if (context) context.onstatechange = null;
    this.node?.disconnect();
    this.node?.port.close();
    this.gain?.disconnect();
    this.node = this.gain = null;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
    this.onStatus({ active: false, pending: false, message: 'Start sound, then touch, drag and release.' });
  }

  dispose(): void { this.stop(); }
}
