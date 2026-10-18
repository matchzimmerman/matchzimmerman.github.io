#!/usr/bin/env node
"use strict";
/* Offline source-custody verification. GitHub blob SHA1, not a claim of historical accuracy. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = __dirname;
const isMirror = root.replaceAll("\\", "/").includes("/integrations/mz-worlds");
const pin = JSON.parse(fs.readFileSync(path.join(root, "source-pin.json"), "utf8"));
const report = [];
for (const item of pin.sceneSources) {
  const rel = isMirror ? path.join("engine", path.basename(item.mirror)) :
    path.join("..", "experience", path.basename(item.source));
  const file = path.resolve(root, rel);
  const bytes = fs.readFileSync(file);
  const gitHash = crypto.createHash("sha1")
    .update(Buffer.from("blob " + bytes.length + "\0"))
    .update(bytes).digest("hex");
  report.push({path:rel,expected:item.gitBlobSha1,actual:gitHash,pass:gitHash===item.gitBlobSha1});
}
const passed=report.every(x=>x.pass);
console.log(JSON.stringify({schema:pin.schema,side:isMirror?"mick-mirror":"mz-canonical",pass:passed,files:report},null,2));
if (!passed) process.exit(1);
