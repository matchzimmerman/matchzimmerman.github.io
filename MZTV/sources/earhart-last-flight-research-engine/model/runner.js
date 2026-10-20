#!/usr/bin/env node
/* THE LAST FLIGHT · research engine · deterministic model runner
 *
 * Runs the ORIGINAL exploratory surrogate (../../earhart-last-flight/model.js)
 * read-only, with a parameter set taken from an immutable model artifact.
 * The surrogate file is pinned by SHA-256; a mismatch aborts the run.
 *
 * usage: node runner.js <model-artifact.json>            -> JSON summary on stdout
 *        node runner.js --params '{"fuelStart":1100}' --seed 19370702 --count 192
 *
 * Output numbers are rounded to 6 decimals before hashing (declared numerical
 * tolerance), so identical inputs give an identical output_hash on any
 * platform with IEEE-754 doubles.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MODEL_PATH = path.resolve(__dirname, '../../earhart-last-flight/model.js');
const PINNED_SHA256 = 'fbd0d6e8e48caf165e0d5317717cb426cfd6baf0e5df7d98ee50638679c80cb2';
const ROUND = 1e6;

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function r6(v) { return Math.round(v * ROUND) / ROUND; }
// canonical JSON: sorted keys, no whitespace
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

function loadModel() {
  const src = fs.readFileSync(MODEL_PATH);
  const got = sha256(src);
  if (got !== PINNED_SHA256) {
    throw new Error(`surrogate model.js hash mismatch: expected ${PINNED_SHA256}, got ${got}. ` +
      'The original public experiment changed; re-pin deliberately after review.');
  }
  // eslint-disable-next-line no-new-func
  new Function('globalThis', 'window', src.toString())(globalThis, undefined);
  return { M: globalThis.MZLastFlight, sha: got };
}

function run(params, seed, count) {
  const { M, sha } = loadModel();
  const config = M.normalizedConfig(params);
  const trials = M.ensemble(seed, count, config).map((t, i) => ({
    i, seed: t.seed,
    endurance_h: r6(t.endurance),
    end_t_h: r6(t.end.t),
    end_lat: r6(t.end.lat), end_lon: r6(t.end.lon),
    min_howland_km: r6(t.minHowlandKm), min_howland_h: r6(t.minHowlandHour),
    near_howland: t.nearHowland, near_niku: t.nearNiku,
  }));
  const mean = k => r6(trials.reduce((s, t) => s + t[k], 0) / trials.length);
  const summary = {
    trials: trials.length,
    mean_endurance_h: mean('endurance_h'),
    mean_min_howland_km: mean('min_howland_km'),
    near_howland: trials.filter(t => t.near_howland).length,
    near_niku: trials.filter(t => t.near_niku).length,
  };
  const body = { surrogate_sha256: sha, surrogate_version: M.MODEL_VERSION, config, seed, count, summary, trials };
  return Object.assign({ output_hash: sha256(canon(body)) }, body);
}

function main(argv) {
  let params = {}, seed = 19370702, count = 192;
  if (argv[0] && !argv[0].startsWith('--')) {
    const art = JSON.parse(fs.readFileSync(argv[0], 'utf8'));
    for (const [k, p] of Object.entries(art.parameters)) params[k] = p.value;
    seed = art.ensemble.seed; count = art.ensemble.count;
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--params') params = Object.assign(params, JSON.parse(argv[++i]));
    else if (argv[i] === '--seed') seed = Number(argv[++i]);
    else if (argv[i] === '--count') count = Number(argv[++i]);
  }
  process.stdout.write(JSON.stringify(run(params, seed, count)));
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { process.stderr.write(String(e.message || e) + '\n'); process.exit(2); }
}
module.exports = { run, canon, PINNED_SHA256 };
