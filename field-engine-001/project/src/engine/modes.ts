import { damp } from './types.ts';
import type { ModeId, ModeProfile } from './types.ts';

export const MODES: Readonly<Record<ModeId, {
  label: string;
  description: string;
  profile: Readonly<ModeProfile>;
}>> = {
  calm: {
    label: 'CALM',
    description: 'Soft material. Press gently; release for a short, rounded tone.',
    profile: { speed: 0.22, fold: 0.48, twist: 0.12, spread: 0, fracture: 0, response: 0.85, tension: 20, damping: 2.4, memory: 0.28 },
  },
  pressure: {
    label: 'PRESSURE',
    description: 'Taut material. Drag a crease, then release and let it ring.',
    profile: { speed: 0.34, fold: 0.8, twist: 0.16, spread: 0.05, fracture: 0, response: 1.55, tension: 38, damping: 0.72, memory: 0.095 },
  },
  rupture: {
    label: 'RUPTURE',
    description: 'Brittle material. A firm gesture opens seams and scatters metallic tones.',
    profile: { speed: 0.46, fold: 1.0, twist: 0.2, spread: 0.12, fracture: 1, response: 1.9, tension: 26, damping: 1.1, memory: 0.045 },
  },
};

/** Continuous transitions preserve motion phase instead of resetting the scene. */
export class ModeController {
  readonly current: ModeProfile = { ...MODES.calm.profile };
  private target: Readonly<ModeProfile> = MODES.calm.profile;

  set(mode: ModeId): void { this.target = MODES[mode].profile; }

  update(dt: number): void {
    for (const key of Object.keys(this.current) as (keyof ModeProfile)[]) {
      this.current[key] = damp(this.current[key], this.target[key], 2.4, dt);
    }
  }

  reset(): void {
    this.target = MODES.calm.profile;
    Object.assign(this.current, this.target);
  }
}
