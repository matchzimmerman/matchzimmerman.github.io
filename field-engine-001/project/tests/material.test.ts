import test from 'node:test';
import assert from 'node:assert/strict';
import { MaterialField } from '../src/engine/material.ts';
import { MODES } from '../src/engine/modes.ts';
import type { Excitation, MaterialSample, PressurePoint } from '../src/engine/types.ts';

const sample = (): MaterialSample => ({ displacement: 0, velocity: 0, memory: 0, damage: 0 });
const press: PressurePoint = { id: 1, x: 0, z: 0, targetX: 0, targetZ: 0, strength: 1, targetStrength: 1, radius: 2, down: true };

test('a localized gesture propagates to untouched neighbors and leaves a decaying trace', () => {
  const field = new MaterialField();
  const out = sample();
  field.excite({ x: 0, z: 0, force: 1, kind: 'press' });
  field.sample(4.8, 0, out);
  assert.equal(out.velocity, 0, 'distant region begins untouched');
  let distantPeak = 0;
  for (let i = 0; i < 120; i++) {
    field.advance(1 / 60, [], MODES.pressure.profile, 0);
    field.sample(4.8, 0, out);
    distantPeak = Math.max(distantPeak, Math.abs(out.velocity));
  }
  assert.ok(distantPeak > 0.01, `wave must arrive away from the gesture: ${distantPeak}`);
  field.sample(0, 0, out);
  const remembered = out.memory;
  assert.ok(remembered > 0.02, 'gesture leaves a trace after contact');
  for (let i = 0; i < 60 * 25; i++) field.advance(1 / 60, [], MODES.calm.profile, 0);
  field.sample(0, 0, out);
  assert.ok(out.memory < remembered * 0.05, 'trace fades without new excitation');
  assert.ok(field.energy < 0.001, 'unforced material returns to rest');
});

test('held force loads displacement; release retains momentum rather than snapping to rest', () => {
  const field = new MaterialField(true);
  for (let i = 0; i < 60; i++) field.advance(1 / 60, [press], MODES.pressure.profile, 0);
  const before = sample(), after = sample();
  field.sample(0, 0, before);
  assert.ok(before.displacement < -0.25);
  field.advance(1 / 60, [], MODES.pressure.profile, 0);
  field.sample(0, 0, after);
  assert.ok(Math.abs(after.displacement) > 0.2);
  assert.ok(Math.abs(after.displacement - before.displacement) < 0.3);
  assert.ok(Math.abs(after.velocity) > 0.01);
});

test('fixed stepping produces the same response at 30 and 120 Hz; reset clears all history', () => {
  const a = new MaterialField(true), b = new MaterialField(true);
  for (const f of [a, b]) f.excite({ x: 1, z: -2, force: 1, kind: 'press' });
  for (let i = 0; i < 90; i++) a.advance(1 / 30, [], MODES.pressure.profile, 0);
  for (let i = 0; i < 360; i++) b.advance(1 / 120, [], MODES.pressure.profile, 0);
  assert.deepEqual(a.height, b.height);
  assert.deepEqual(a.velocity, b.velocity);
  a.reset();
  for (const values of [a.height, a.velocity, a.memory, a.damage]) assert.ok(values.every(value => value === 0));
  assert.equal(a.energy, 0);
});

test('rupture weakens stressed regions and emits fracture events; five contacts stay bounded', () => {
  const events: Excitation[] = [];
  const field = new MaterialField(true, event => events.push(event));
  const contacts = Array.from({ length: 5 }, (_, id) => ({ ...press, id, x: (id - 2) * 0.8, strength: 1.3 }));
  for (let i = 0; i < 300; i++) field.advance(i % 2 ? 0.05 : 1 / 120, contacts, MODES.rupture.profile, 1);
  assert.ok(field.damage.some(value => value > 0.3), 'stress opens visible local seams');
  assert.ok(events.some(event => event.kind === 'fracture'), 'damage must excite sound');
  assert.ok(field.height.every(value => Number.isFinite(value) && Math.abs(value) <= 5));
  assert.ok(field.velocity.every(value => Number.isFinite(value) && Math.abs(value) <= 18));
  assert.ok(field.memory.every(value => value >= 0 && value <= 1));
});
