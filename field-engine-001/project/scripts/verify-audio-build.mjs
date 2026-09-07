import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Execute the shipped worklet offline. This verifies emitted DSP, not device permissions.
const assets = new URL('../dist/assets/', import.meta.url);
const name = (await readdir(assets)).find(name => /^sound\.worklet-.*\.js$/.test(name));
assert.ok(name, 'production build must contain an audio worklet');
let Processor;
vm.runInNewContext(await readFile(new URL(name, assets), 'utf8'), {
  sampleRate: 48000,
  AudioWorkletProcessor: class { port = { onmessage: null }; },
  registerProcessor: (name, implementation) => {
    assert.equal(name, 'field-resonator');
    Processor = implementation;
  },
}, { filename: fileURLToPath(new URL(name, assets)), timeout: 2000 });
const processor = new Processor();
const left = new Float32Array(4800), right = new Float32Array(4800);
processor.port.onmessage({ data: { type: 'strike', strike: { frequency: 220, force: 1, pan: 0, brightness: 0.3, decay: 1 } } });
assert.equal(processor.process([], [[left, right]]), true);
const rms = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0) / left.length);
assert.ok(rms > 0.05, 'built worklet must produce audio');
assert.ok(left.every(value => Number.isFinite(value) && Math.abs(value) <= 0.821));
processor.port.onmessage({ data: { type: 'reset' } });
processor.process([], [[left, right]]);
assert.ok(left.every(value => value === 0));
console.log(`Built audio worklet verified: stereo output, RMS ${rms.toFixed(4)}, bounded samples, silent reset.`);
