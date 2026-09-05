import { damp } from './types.ts';
import type { ModeId, ModeProfile } from './types.ts';

export const MODES: Readonly<Record<ModeId, {
  label: string;
  description: string;
  profile: Readonly<ModeProfile>;
}>> = {
  calm: {
    label: 'CALM',
    description: 'A field in slow circulation.',
    profile: { speed: 0.29, fold: 0.48, twist: 0.18, spread: 0, fracture: 0, response: 0.85 },
  },
  pressure: {
    label: 'PRESSURE',
    description: 'Gather, compress, release.',
    profile: { speed: 0.55, fold: 0.95, twist: 0.46, spread: 0.18, fracture: 0.12, response: 1.55 },
  },
  rupture: {
    label: 'RUPTURE',
    description: 'The structure opens. The field persists.',
    profile: { speed: 0.85, fold: 1.3, twist: 0.7, spread: 0.55, fracture: 1, response: 1.9 },
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
