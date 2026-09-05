import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleField, seededRandom, pulseEnvelope } from '../src/engine/behavior.ts';
import { ModeController, MODES } from '../src/engine/modes.ts';
import { ProceduralField } from '../src/engine/geometry.ts';
import type { FieldSample, FieldState } from '../src/engine/types.ts';

const sample = (): FieldSample => ({ x: 0, y: 0, z: 0, energy: 0 });
const state = (): FieldState => ({ time: 0, intensity: 0.55, audio: 0, profile: { ...MODES.calm.profile }, pressures: [] });

test('all modes remain finite at maximum input, including the polar center', () => {
  const current = state();
  current.intensity = 1;
  current.audio = 1;
  current.pressures = Array.from({ length: 5 }, (_, id) => ({
    id, x: 0, z: 0, targetX: 0, targetZ: 0, strength: 1.3, targetStrength: 1.3, radius: 2, down: true,
  }));
  const out = sample();
  for (const mode of Object.values(MODES)) {
    current.profile = { ...mode.profile };
    for (const time of [0, 1, 100, 10000]) {
      current.time = time;
      for (let x = -24; x <= 24; x += 0.4) {
        for (let z = -24; z <= 24; z += 0.4) {
          sampleField(x, z, current, out);
          assert.ok(Object.values(out).every(Number.isFinite));
          assert.ok(out.energy >= 0 && out.energy <= 1);
          assert.ok(Math.abs(out.y) < 20);
        }
      }
      sampleField(0, 0, current, out);
      assert.ok(Object.values(out).every(Number.isFinite));
    }
  }
});

test('pressure has a local effect and decays away from the contact', () => {
  const current = state();
  const near = sample(), far = sample();
  sampleField(0, 0, current, near);
  sampleField(20, 20, current, far);
  current.pressures = [{ id: 1, x: 0, z: 0, targetX: 0, targetZ: 0, strength: 1, targetStrength: 1, radius: 2, down: true }];
  const pressedNear = sample(), pressedFar = sample();
  sampleField(0, 0, current, pressedNear);
  sampleField(20, 20, current, pressedFar);
  assert.ok(pressedNear.y < near.y - 0.5);
  assert.ok(Math.abs(pressedFar.y - far.y) < 0.00001);
});

test('mode easing is independent of frame rate and reset restores the initial profile', () => {
  const slow = new ModeController(), fast = new ModeController();
  slow.set('rupture'); fast.set('rupture');
  for (let i = 0; i < 60; i++) slow.update(1 / 30);
  for (let i = 0; i < 240; i++) fast.update(1 / 120);
  for (const key of Object.keys(slow.current) as (keyof typeof slow.current)[]) {
    assert.ok(Math.abs(slow.current[key] - fast.current[key]) < 1e-10);
  }
  fast.reset();
  assert.deepEqual(fast.current, MODES.calm.profile);
});

test('seeded initial conditions and pulse input are reproducible and bounded', () => {
  const a = seededRandom(1001), b = seededRandom(1001), c = seededRandom(1002);
  const sequence = Array.from({ length: 100 }, a);
  assert.deepEqual(sequence, Array.from({ length: 100 }, b));
  assert.notDeepEqual(sequence, Array.from({ length: 100 }, c));
  for (let t = 0; t < 500; t += 0.03) assert.ok(pulseEnvelope(t) >= 0 && pulseEnvelope(t) <= 1);
});

test('generated meshes have valid indices and reset reproduces their positions', () => {
  for (const compact of [true, false]) {
    const field = new ProceduralField(compact);
    const geometry = field.surface.geometry;
    for (const index of geometry.index!.array) assert.ok(index >= 0 && index < field.vertexCount);
    const current = state();
    field.update(current);
    const initial = new Float32Array(geometry.attributes.position.array);
    current.time = 12;
    current.profile = { ...MODES.rupture.profile };
    field.update(current);
    assert.notDeepEqual(initial, geometry.attributes.position.array);
    field.update(state());
    assert.deepEqual(initial, geometry.attributes.position.array);
    field.setDensity(0); field.setDensity(1);
    assert.ok(Number.isFinite(field.surface.material.uniforms.uDensity.value));
    field.dispose();
  }
});
