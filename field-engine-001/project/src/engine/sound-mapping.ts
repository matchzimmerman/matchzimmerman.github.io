import type { Excitation, ModeId } from './types.ts';
import type { Strike } from './resonator.ts';

/** Mapping follows the orthographic camera axes: left/right pan, depth pitch.
 * Pitch is continuous so a dragged gesture produces a glissando of excitations.
 */
export function mapStrike(event: Excitation, mode: ModeId): Strike {
  const horizontal = event.x * 0.845 - event.z * 0.535;
  const depth = -event.x * 0.535 - event.z * 0.845;
  const note = 47 + Math.max(-9, Math.min(15, depth * 1.8));
  const fracture = mode === 'rupture' || event.kind === 'fracture';
  return {
    frequency: 440 * 2 ** ((note - 69) / 12) * (event.kind === 'release' ? 1.5 : 1),
    force: event.force * (event.kind === 'drag' ? 0.7 : 1),
    pan: Math.max(-0.95, Math.min(0.95, horizontal / 7)),
    brightness: fracture ? 0.9 : mode === 'pressure' ? 0.35 : 0.05,
    decay: mode === 'calm' ? 0.65 : mode === 'pressure' ? 2.3 : 1.25,
  };
}
