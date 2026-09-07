import type { FieldBasis, FieldSample, FieldState, MaterialSample } from './types.ts';

const TAU = Math.PI * 2;
const materialSample: MaterialSample = { displacement: 0, velocity: 0, memory: 0, damage: 0 };

/**
 * The procedural rest form, shared by the surface and attached fragments.
 * Dynamic displacement, traces and damage come from the persistent spring lattice.
 * Rest coordinates stay fixed; simulation time advances independently of frames.
 */
export function sampleField(x: number, z: number, state: FieldState, out: FieldSample, basis?: FieldBasis): void {
  const { time: t, profile: m, intensity: amp } = state;
  const radius = basis?.radius ?? Math.sqrt(x * x * 0.88 + z * z * 1.13);
  const angle = basis?.angle ?? Math.atan2(z, x);
  const core = basis?.core ?? Math.exp(-radius * radius * 0.038);
  const ringRadius = 2.65 + Math.sin(angle * 3 + t * 0.47) * 0.3 * amp;
  const band = Math.exp(-Math.pow((radius - ringRadius) / 1.22, 2));
  const ridge = band * (3.45 + m.fold * Math.sin(angle * 3 - t * 0.7) * amp);
  const folding = Math.sin(angle * 5 + radius * 1.7 - t) * band * 0.48 * m.fold * amp;
  const tide = Math.sin(x * 0.46 + z * 0.28 - t * 0.8) * 0.13
    + Math.sin(z * 0.65 - x * 0.2 + t * 0.65) * 0.09;
  const twist = core * m.twist * Math.sin(radius * 0.8 - t * 0.45) * amp;
  const ct = Math.cos(twist);
  const st = Math.sin(twist);

  const spread = 1 + m.spread * core * amp;
  out.x = (x * ct - z * st) * spread;
  out.z = (x * st + z * ct) * spread;
  out.y = ridge + folding + tide * amp;
  out.energy = 0;
  out.trace = out.tear = 0;
  if (state.material) {
    state.material.sample(x, z, materialSample);
    out.y += materialSample.displacement;
    out.energy = Math.min(1, Math.abs(materialSample.velocity) * 0.25 + Math.abs(materialSample.displacement) * 0.12);
    out.trace = materialSample.memory;
    out.tear = materialSample.damage;
  }
}

/** Stable, reproducible initial conditions; reset returns to this exact seed. */
export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function pulseEnvelope(time: number): number {
  const beat = time * 1.2; // 72 beats/minute; rising envelopes excite the material and its sound.
  const phase = beat - Math.floor(beat);
  return Math.exp(-phase * 7) * (0.8 + Math.sin(time * TAU / 16) * 0.2);
}
