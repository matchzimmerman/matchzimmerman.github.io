/** Pure DSP shared by the audio worklet and offline verification.
 * Each gesture excites four decaying modes in one of twelve bounded voices.
 * This is modal synthesis, not a recording or a musical loop.
 */
export interface Strike {
  frequency: number;
  force: number;
  pan: number;
  brightness: number;
  decay: number;
}

const VOICES = 12;
const PARTIALS = 4;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export class ResonatorBank {
  private readonly real = new Float64Array(VOICES * PARTIALS);
  private readonly imaginary = new Float64Array(VOICES * PARTIALS);
  private readonly rotationReal = new Float64Array(VOICES * PARTIALS);
  private readonly rotationImaginary = new Float64Array(VOICES * PARTIALS);
  private readonly left = new Float64Array(VOICES);
  private readonly right = new Float64Array(VOICES);
  private readonly remaining = new Int32Array(VOICES);
  private readonly sampleRate: number;
  private voice = 0;

  constructor(sampleRate: number) { this.sampleRate = sampleRate; }

  strike(event: Strike): void {
    if (![event.frequency, event.force, event.pan, event.brightness, event.decay].every(Number.isFinite)) return;
    // Reuse the quietest voice rather than truncating the oldest loud attack.
    let quietest = Infinity;
    for (let v = 0; v < VOICES; v++) {
      const i = v * PARTIALS;
      const energy = this.real[i] ** 2 + this.imaginary[i] ** 2;
      if (energy < quietest) { quietest = energy; this.voice = v; }
    }
    const voice = this.voice;
    const brightness = clamp(event.brightness, 0, 1);
    const force = clamp(event.force, 0, 1.5) * 0.23;
    const decay = clamp(event.decay, 0.12, 5);
    const pan = clamp(event.pan, -1, 1);
    this.left[voice] = Math.cos((pan + 1) * Math.PI / 4);
    this.right[voice] = Math.sin((pan + 1) * Math.PI / 4);
    this.remaining[voice] = Math.ceil(decay * 9 * this.sampleRate);
    for (let p = 0; p < PARTIALS; p++) {
      const ratio = p === 0 ? 1 : p === 1 ? 2 - brightness * 0.586 : p === 2 ? 3 + brightness * 0.17 : 4 + brightness * 1.43;
      const frequency = clamp(event.frequency, 70, 900) * ratio;
      const amplitude = force * (p === 0 ? 1 : (0.22 + brightness * 0.35) / p) * (frequency < this.sampleRate * 0.45 ? 1 : 0);
      const damping = Math.exp(-1 / (this.sampleRate * decay / (1 + p * 0.65)));
      const phase = 2 * Math.PI * frequency / this.sampleRate;
      const i = voice * PARTIALS + p;
      this.real[i] = amplitude;
      this.imaginary[i] = 0; // Sine starts at zero; avoids an instantaneous attack click.
      this.rotationReal[i] = Math.cos(phase) * damping;
      this.rotationImaginary[i] = Math.sin(phase) * damping;
    }
  }

  render(left: Float32Array, right: Float32Array): void {
    left.fill(0); right.fill(0);
    for (let v = 0; v < VOICES; v++) {
      if (this.remaining[v] <= 0) continue;
      const length = Math.min(left.length, this.remaining[v]);
      for (let frame = 0; frame < length; frame++) {
        let value = 0;
        for (let p = 0; p < PARTIALS; p++) {
          const i = v * PARTIALS + p;
          const re = this.real[i], im = this.imaginary[i];
          this.real[i] = re * this.rotationReal[i] - im * this.rotationImaginary[i];
          this.imaginary[i] = re * this.rotationImaginary[i] + im * this.rotationReal[i];
          value += this.imaginary[i];
        }
        left[frame] += value * this.left[v];
        right[frame] += value * this.right[v];
      }
      this.remaining[v] -= length;
    }
    // Smooth saturation bounds even twelve coincident maximum-force gestures.
    for (let i = 0; i < left.length; i++) {
      left[i] = Math.tanh(left[i]) * 0.82;
      right[i] = Math.tanh(right[i]) * 0.82;
    }
  }

  reset(): void {
    this.real.fill(0); this.imaginary.fill(0); this.remaining.fill(0);
  }
}
