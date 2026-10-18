#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const input = process.argv[2];
if (!input || process.argv.length !== 3) {
  console.error("usage: node verify-handoff.cjs <exported-observation.json>");
  process.exit(2);
}
try {
  const packet = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
  const valid = packet && !Array.isArray(packet) &&
    packet.schema === "mz-warren-observation/v1" &&
    packet.authorSystem === "HARIL STUDIO / MZ WORLDS" &&
    packet.originRepository === "matchzimmerman/matchzimmerman.github.io" &&
    packet.pairedResearchRepository === "ItsMick/town-of-warren" &&
    typeof packet.capturedAtUtc === "string" &&
    Number.isFinite(Date.parse(packet.capturedAtUtc)) &&
    typeof packet.observation === "string" &&
    packet.observation.trim().length > 0 &&
    packet.observation.length <= 10000 &&
    (packet.researchView === null || ["map","town","plan"].includes(packet.researchView)) &&
    packet.epistemicStatus === "unverified-human-observation" &&
    packet.historicalLocation === null &&
    packet.sourceReference === null &&
    packet.requiresHumanSourceReview === true &&
    packet.promotedToHistoricalRecord === false;
  if (!valid) throw Error("Malformed packet or unsupported evidence-status claim");
  console.log(JSON.stringify({valid:true,schema:packet.schema,scope:"shape-and-status-only",observationLength:packet.observation.length}));
} catch (err) {
  console.error("HANDOFF REJECTED:", err.message);
  process.exit(1);
}
