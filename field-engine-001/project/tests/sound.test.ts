import test from 'node:test';
import assert from 'node:assert/strict';
import { ResonatorBank } from '../src/engine/resonator.ts';
import { mapStrike } from '../src/engine/sound-mapping.ts';

const rms = (array: Float32Array) => Math.sqrt(array.reduce((sum, x) => sum + x * x, 0) / array.length);

test('the production DSP renders audible stereo samples from a real gesture and decays to silence', () => {
  const bank = new ResonatorBank(48000);
  const left = new Float32Array(4800), right = new Float32Array(4800);
  bank.render(left, right);
  assert.equal(rms(left), 0, 'no autonomous sound before a gesture');
  bank.strike(mapStrike({ x: -5, z: 0, force: 1, kind: 'press' }, 'calm'));
  bank.render(left, right);
  const attack = rms(left);
  assert.ok(attack > 0.03, `audible attack: ${attack}`);
  assert.ok(attack > rms(right) * 1.5, 'left-side gesture sounds on the left');
  assert.ok(Math.abs(left[0]) < 0.05, 'attack begins near zero');
  for (let i = 0; i < 70; i++) bank.render(left, right);
  assert.equal(rms(left), 0, 'voice ends after its bounded decay');
});

test('release and depth change pitch; the modes change resonance and harmonic relationships', () => {
  const press = { x: 0, z: 0, force: 1, kind: 'press' as const };
  const contact = mapStrike(press, 'calm');
  const release = mapStrike({ ...press, kind: 'release' }, 'calm');
  assert.equal(release.frequency, contact.frequency * 1.5);
  assert.notEqual(mapStrike({ ...press, z: 4 }, 'calm').frequency, contact.frequency);
  assert.ok(mapStrike(press, 'pressure').decay > contact.decay * 2);
  assert.ok(mapStrike(press, 'rupture').brightness > contact.brightness);
});

test('dense polyphony is finite and bounded, invalid messages are ignored, reset is silent', () => {
  const bank = new ResonatorBank(44100);
  for (let i = 0; i < 60; i++) bank.strike({ frequency: 110 + i * 7, force: 100, pan: 0, brightness: 2, decay: 100 });
  bank.strike({ frequency: NaN, force: 1, pan: 0, brightness: 0, decay: 1 });
  const left = new Float32Array(4096), right = new Float32Array(4096);
  bank.render(left, right);
  assert.ok(left.every(x => Number.isFinite(x) && Math.abs(x) <= 0.821));
  assert.ok(rms(left) > 0.05);
  bank.reset(); bank.render(left, right);
  assert.equal(rms(left), 0); assert.equal(rms(right), 0);
});
