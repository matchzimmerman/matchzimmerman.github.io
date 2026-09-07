export type ModeId = 'calm' | 'pressure' | 'rupture';
export type AudioSource = 'pulse' | 'microphone';

export interface EngineSettings {
  mode: ModeId;
  intensity: number;
  density: number;
  audioReactive: boolean;
  audioSource: AudioSource;
  paused: boolean;
  volume: number;
}

export interface ModeProfile {
  speed: number;
  fold: number;
  twist: number;
  spread: number;
  fracture: number;
  response: number;
  tension: number;
  damping: number;
  memory: number;
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
  material?: MaterialSampler;
}

export interface FieldSample {
  x: number;
  y: number;
  z: number;
  energy: number;
  trace?: number;
  tear?: number;
}

export interface MaterialSample {
  displacement: number;
  velocity: number;
  memory: number;
  damage: number;
}

export interface MaterialSampler {
  sample(x: number, z: number, out: MaterialSample): void;
}

export type ExcitationKind = 'press' | 'drag' | 'release' | 'fracture' | 'pulse';
export interface Excitation {
  x: number;
  z: number;
  force: number;
  kind: ExcitationKind;
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
  energy: number;
  memory: number;
  contacts: number;
}

export const DEFAULT_SETTINGS: Readonly<EngineSettings> = {
  mode: 'calm',
  intensity: 0.55,
  density: 0.58,
  audioReactive: false,
  audioSource: 'pulse',
  paused: false,
  volume: 0.55,
};

export const MAX_PRESSURES = 5;

export const damp = (current: number, target: number, rate: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
