import type { FieldBasis, FieldSample, FieldState } from './types.ts';

const TAU = Math.PI * 2;

/**
 * A deterministic material field, shared by the surface and its fragments.
 * No random calls, allocation, or accumulated position error in this hot path.
 * Rest coordinates stay fixed; simulation time advances independently of frames.
 */
export function sampleField(x: number, z: number, state: FieldState, out: FieldSample, basis?: FieldBasis): void {
  const { time: t, profile: m, intensity: amp, audio } = state;
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

  // Related sectors separate under rupture, with eased boundaries rather than noise.
  const seam = Math.pow(Math.max(0, Math.cos(angle * 5 + t * 0.22)), 12);
  const opening = seam * core * m.fracture * amp;
  const spread = 1 + m.spread * core * amp + opening * 0.32;
  let px = (x * ct - z * st) * spread;
  let pz = (x * st + z * ct) * spread;
  let y = ridge + folding + tide * amp - opening * 1.6;

  // Audio travels across the material with spatial phase; it never scales the whole scene.
  y += audio * band * Math.sin(angle * 2 + radius * 1.8 - t * 2) * 0.8;

  let energy = opening * 0.48;
  for (let i = 0; i < state.pressures.length; i++) {
    const p = state.pressures[i];
    if (p.strength < 0.004) continue;
    const dx = px - p.x;
    const dz = pz - p.z;
    const d2 = dx * dx + dz * dz;
    const radiusSq = p.radius * p.radius;
    // Discard the imperceptible Gaussian tail beyond three radii.
    if (d2 > radiusSq * 9) continue;
    const influence = Math.exp(-d2 / radiusSq);
    const force = influence * p.strength * m.response;
    // A negative center surrounded by a positive rim makes pressure legible in depth.
    y += force * (d2 / radiusSq * 2.1 - 0.9) * 1.6;
    px -= dx * force * 0.17;
    pz -= dz * force * 0.17;
    y += Math.sin(Math.sqrt(d2) * 3.4 - t * 3.4) * force * 0.12 * amp;
    energy += force * 0.8;
  }

  out.x = px;
  out.y = y;
  out.z = pz;
  out.energy = Math.min(1, energy + audio * band * 0.4);
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
  const beat = time * 1.2; // 72 beats/minute; synthetic visual input, intentionally silent.
  const phase = beat - Math.floor(beat);
  return Math.exp(-phase * 7) * (0.8 + Math.sin(time * TAU / 16) * 0.2);
}
