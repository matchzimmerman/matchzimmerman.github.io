import type { Excitation, MaterialSample, ModeProfile, PressurePoint } from './types.ts';

const STEP = 1 / 120;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** A damped spring lattice. Heights and velocities persist between frames.
 * A fixed step keeps neighbor propagation stable across display refresh rates.
 * The outer eight cells absorb energy; the outermost row is pinned.
 */
export class MaterialField {
  readonly side: number;
  readonly extent = 48;
  readonly height: Float32Array;
  readonly velocity: Float32Array;
  readonly memory: Float32Array;
  readonly damage: Float32Array;
  energy = 0;
  trace = 0;
  private readonly force: Float32Array;
  private readonly edge: Float32Array;
  private readonly next: Float32Array;
  private readonly onExcitation: (event: Excitation) => void;
  private accumulator = 0;
  private time = 0;
  private fractureClock = 0;
  private dragClock = 0;
  private readonly lastContacts = new Map<number, { x: number; z: number }>();

  constructor(compact = false, onExcitation: (event: Excitation) => void = () => {}) {
    this.side = compact ? 65 : 81;
    this.onExcitation = onExcitation;
    const size = this.side * this.side;
    this.height = new Float32Array(size);
    this.velocity = new Float32Array(size);
    this.memory = new Float32Array(size);
    this.damage = new Float32Array(size);
    this.force = new Float32Array(size);
    this.next = new Float32Array(size);
    this.edge = new Float32Array(size);
    for (let z = 0; z < this.side; z++) for (let x = 0; x < this.side; x++) {
      const distance = Math.min(x, z, this.side - x - 1, this.side - z - 1);
      this.edge[z * this.side + x] = Math.max(0, 1 - distance / 8) ** 2 * 12;
    }
  }

  excite(event: Excitation): void {
    if (![event.x, event.z, event.force].every(Number.isFinite)) return;
    const force = clamp(event.force, 0, 1.5);
    const sign = event.kind === 'release' ? 1 : -1;
    this.kernel(event.x, event.z, 1.05, (i, weight) => {
      this.velocity[i] = clamp(this.velocity[i] + weight * force * sign * 5, -18, 18);
      this.memory[i] = Math.min(1, this.memory[i] + weight * force * 0.3);
    });
    this.onExcitation({ ...event, force });
  }

  advance(dt: number, pressures: readonly PressurePoint[], mode: ModeProfile, intensity: number): void {
    this.force.fill(0);
    this.dragClock += dt;
    const activeIds = new Set<number>();
    for (const point of pressures) {
      if (!point.down) continue;
      activeIds.add(point.id);
      this.kernel(point.x, point.z, 1.35, (i, weight) => {
        this.force[i] -= weight * point.strength * mode.response * 22;
      });
      const previous = this.lastContacts.get(point.id);
      if (previous && this.dragClock > 0.065) {
        const distance = Math.hypot(point.x - previous.x, point.z - previous.z);
        if (distance > 0.12) {
          this.excite({ x: point.x, z: point.z, force: Math.min(0.75, distance * 0.6), kind: 'drag' });
          this.lastContacts.set(point.id, { x: point.x, z: point.z });
          this.dragClock = 0;
        }
      } else if (!previous) this.lastContacts.set(point.id, { x: point.x, z: point.z });
    }
    for (const id of this.lastContacts.keys()) if (!activeIds.has(id)) this.lastContacts.delete(id);
    // Two weak, opposed drivers keep the unplayed field breathing. No audible drone.
    this.kernel(-2.4, 0.8, 1.8, (i, w) => { this.force[i] += Math.sin(this.time * 0.65) * intensity * w * 1.2; });
    this.kernel(2.4, -0.8, 1.8, (i, w) => { this.force[i] -= Math.sin(this.time * 0.65 + 0.7) * intensity * w * 1.2; });
    this.accumulator += clamp(dt, 0, 0.08);
    while (this.accumulator + 1e-10 >= STEP) {
      this.step(mode);
      this.accumulator -= STEP;
    }
  }

  private step(mode: ModeProfile): void {
    const n = this.side, h = this.height, v = this.velocity;
    const inverseSpacingSq = ((n - 1) / this.extent) ** 2;
    const traceDecay = Math.exp(-STEP * mode.memory);
    const heal = Math.exp(-STEP * 0.11);
    let kinetic = 0, traces = 0, fracturePeak = 0, fractureIndex = 0;
    this.fractureClock += STEP;
    this.time += STEP;
    for (let z = 1; z < n - 1; z++) for (let x = 1; x < n - 1; x++) {
      const i = z * n + x;
      // Symmetric weakened bonds let a stressed region transmit less energy.
      let lap = 0;
      let strain = 0;
      for (let neighbor = 0; neighbor < 4; neighbor++) {
        const j = i + (neighbor === 0 ? -1 : neighbor === 1 ? 1 : neighbor === 2 ? -n : n);
        const delta = h[j] - h[i];
        lap += delta * (1 - 0.72 * Math.max(this.damage[i], this.damage[j]));
        strain = Math.max(strain, Math.abs(delta));
      }
      const acceleration = mode.tension * inverseSpacingSq * lap - 3.8 * h[i] + this.force[i];
      v[i] = clamp((v[i] + acceleration * STEP) * Math.exp(-(mode.damping + this.edge[i]) * STEP), -18, 18);
      this.next[i] = clamp(h[i] + v[i] * STEP, -5, 5);
      const stress = Math.min(1, Math.abs(v[i]) * 0.055 + strain * 0.4 + Math.abs(this.force[i]) * 0.008);
      this.memory[i] = Math.max(stress, this.memory[i] * traceDecay);
      const broken = mode.fracture * Math.max(0, strain * Math.sqrt(inverseSpacingSq) - 0.24);
      const growth = broken * STEP * 3;
      this.damage[i] = Math.min(0.94, this.damage[i] * heal + growth);
      if (growth > fracturePeak) { fracturePeak = growth; fractureIndex = i; }
      kinetic += v[i] * v[i];
      traces += this.memory[i];
    }
    h.set(this.next);
    this.energy = Math.min(1, Math.sqrt(kinetic / (n * n)) * 2.5);
    this.trace = Math.min(1, traces / (n * n) * 14);
    if (fracturePeak > 0.003 && this.fractureClock > 0.16) {
      this.fractureClock = 0;
      const x = (fractureIndex % n) / (n - 1) * this.extent - this.extent / 2;
      const z = Math.floor(fractureIndex / n) / (n - 1) * this.extent - this.extent / 2;
      this.onExcitation({ x, z, force: Math.min(0.8, fracturePeak * 40), kind: 'fracture' });
    }
  }

  private kernel(x: number, z: number, radius: number, apply: (index: number, weight: number) => void): void {
    const scale = (this.side - 1) / this.extent;
    const cx = (x + this.extent / 2) * scale, cz = (z + this.extent / 2) * scale;
    const r = radius * scale, r2 = r * r;
    for (let row = Math.max(1, Math.floor(cz - r * 2.5)); row <= Math.min(this.side - 2, Math.ceil(cz + r * 2.5)); row++) {
      for (let col = Math.max(1, Math.floor(cx - r * 2.5)); col <= Math.min(this.side - 2, Math.ceil(cx + r * 2.5)); col++) {
        const d2 = (col - cx) ** 2 + (row - cz) ** 2;
        if (d2 < r2 * 6.25) apply(row * this.side + col, Math.exp(-d2 / r2));
      }
    }
  }

  sample(x: number, z: number, out: MaterialSample): void {
    const scale = (this.side - 1) / this.extent;
    const cx = clamp((x + this.extent / 2) * scale, 0, this.side - 1.00001);
    const cz = clamp((z + this.extent / 2) * scale, 0, this.side - 1.00001);
    const ix = Math.floor(cx), iz = Math.floor(cz), fx = cx - ix, fz = cz - iz;
    const i = iz * this.side + ix;
    out.displacement = this.interpolate(this.height, i, fx, fz);
    out.velocity = this.interpolate(this.velocity, i, fx, fz);
    out.memory = this.interpolate(this.memory, i, fx, fz);
    out.damage = this.interpolate(this.damage, i, fx, fz);
  }

  private interpolate(a: Float32Array, i: number, x: number, z: number): number {
    const n = this.side;
    return (a[i] * (1 - x) + a[i + 1] * x) * (1 - z) + (a[i + n] * (1 - x) + a[i + n + 1] * x) * z;
  }

  reset(): void {
    for (const a of [this.height, this.velocity, this.memory, this.damage, this.force, this.next]) a.fill(0);
    this.lastContacts.clear();
    this.accumulator = this.time = this.energy = this.trace = this.fractureClock = this.dragClock = 0;
  }
}
