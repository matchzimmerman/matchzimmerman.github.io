export type ModeId = 'calm' | 'pressure' | 'rupture';
export type AudioSource = 'pulse' | 'microphone';

export interface EngineSettings {
  mode: ModeId;
  intensity: number;
  density: number;
  audioReactive: boolean;
  audioSource: AudioSource;
  paused: boolean;
}

export interface ModeProfile {
  speed: number;
  fold: number;
  twist: number;
  spread: number;
  fracture: number;
  response: number;
}

export interface PressurePoint {
  id: number;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  strength: number;
  targetStrength: number;
  radius: number;
  down: boolean;
}

export interface FieldState {
  time: number;
  intensity: number;
  audio: number;
  profile: ModeProfile;
  pressures: readonly PressurePoint[];
}

export interface FieldSample {
  x: number;
  y: number;
  z: number;
  energy: number;
}

export interface FieldBasis {
  radius: number;
  angle: number;
  core: number;
}

export interface Telemetry {
  fps: number;
  pressure: number;
  audio: number;
  time: number;
  vertices: number;
  quality: 'standard' | 'adaptive';
}

export const DEFAULT_SETTINGS: Readonly<EngineSettings> = {
  mode: 'calm',
  intensity: 0.55,
  density: 0.58,
  audioReactive: false,
  audioSource: 'pulse',
  paused: false,
};

export const MAX_PRESSURES = 5;

export const damp = (current: number, target: number, rate: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
