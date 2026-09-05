import { pulseEnvelope } from './behavior.ts';
import { damp } from './types.ts';
import type { AudioSource } from './types.ts';

export interface AudioStatus {
  active: boolean;
  pending: boolean;
  message: string;
}

/** Local analysis only. The microphone is never connected to speakers or a server. */
export class AudioInput {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private data: Float32Array<ArrayBuffer> | null = null;
  private source: AudioSource = 'pulse';
  private active = false;
  private generation = 0;
  private envelope = 0;

  constructor(private readonly onStatus: (status: AudioStatus) => void) {}

  async enable(source: AudioSource): Promise<boolean> {
    this.stop();
    const generation = this.generation;
    this.source = source;
    if (source === 'pulse') {
      this.active = true;
      this.onStatus({ active: true, pending: false, message: '72 BPM · silent visual pulse' });
      return true;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.onStatus({ active: false, pending: false, message: 'Microphone needs HTTPS or localhost. Pulse is available.' });
      return false;
    }
    this.onStatus({ active: false, pending: true, message: 'Waiting for microphone permission…' });
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    try {
      // Construct/resume inside the initiating gesture for mobile Safari.
      context = new AudioContext();
      this.context = context;
      await context.resume();
      if (generation !== this.generation) return false;
      stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      } });
      if (generation !== this.generation) {
        stream.getTracks().forEach(track => track.stop());
        if (context.state !== 'closed') await context.close();
        return false;
      }
      this.stream = stream;
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.sourceNode = context.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);
      this.data = new Float32Array(this.analyser.fftSize);
      this.active = true;
      const track = stream.getAudioTracks()[0];
      track?.addEventListener('ended', () => {
        if (generation !== this.generation) return;
        this.stop();
        this.onStatus({ active: false, pending: false, message: 'Microphone disconnected. Choose Pulse or reconnect.' });
      }, { once: true });
      this.onStatus({ active: true, pending: false, message: 'Microphone live · processed on this device' });
      return true;
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      if (generation !== this.generation) return false;
      this.stop();
      const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      this.onStatus({ active: false, pending: false, message: denied
        ? 'Microphone unavailable or denied. Try Pulse, or allow access in your browser.'
        : 'Could not open a microphone. The synthetic pulse is available.' });
      return false;
    }
  }

  update(dt: number, time: number): number {
    let level = 0;
    if (this.active && this.source === 'pulse') level = pulseEnvelope(time);
    else if (this.active && this.analyser && this.data) {
      this.analyser.getFloatTimeDomainData(this.data);
      let sum = 0;
      for (let i = 0; i < this.data.length; i++) sum += this.data[i] * this.data[i];
      const rms = Math.sqrt(sum / this.data.length);
      level = Math.min(1, Math.max(0, (rms - 0.008) * 9));
    }
    this.envelope = damp(this.envelope, level, level > this.envelope ? 16 : 4, dt);
    return this.envelope;
  }

  stop(): void {
    this.generation++;
    this.active = false;
    this.envelope = 0;
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.context = null;
    this.stream = null;
    this.analyser = null;
    this.sourceNode = null;
    this.data = null;
    this.onStatus({ active: false, pending: false, message: 'Choose a source to modulate the field.' });
  }

  dispose(): void { this.stop(); }
}
