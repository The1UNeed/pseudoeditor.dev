// Run from the repository root after building the Rust benchmark example:
// node packages/pseudocode-runtime/examples/benchmark-wasm.mjs
// Alternating A/B samples against an earlier binary:
// node packages/pseudocode-runtime/examples/benchmark-wasm.mjs --compare /tmp/runtime-before.wasm
// Measures the browser's actual WASM binary, including its JSON boundary.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initSync, run_pseudocode } from "../../../apps/web/src/runtime/wasm/pkg/pseudocode_runtime.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const compare = process.argv[2] === "--compare";
const binary = readFileSync((compare ? undefined : process.argv[2]) ?? new URL("../../../apps/web/src/runtime/wasm/pkg/pseudocode_runtime_bg.wasm", import.meta.url));
initSync({ module: binary });
const baseline = compare ? await import("../../../apps/web/src/runtime/wasm/pkg/pseudocode_runtime.js?baseline") : null;
if (baseline) baseline.initSync({ module: readFileSync(process.argv[3]) });
const requests = execFileSync(`${root}target/release/examples/benchmark`, ["--requests"], { encoding: "utf8" })
  .trim().split("\n").map((line) => JSON.parse(line));
for (const { name, request, expected } of requests) {
  if (baseline) {
    const samples = [[], []];
    for (let session = 0; session < 3; session += 1) {
      for (let sample = 0; sample < 8; sample += 1) {
        for (const index of (sample % 2 ? [1, 0] : [0, 1])) {
          const run = index ? run_pseudocode : baseline.run_pseudocode;
          const started = performance.now();
          const json = run(request);
          const elapsed = performance.now() - started;
          const result = JSON.parse(json);
          assert.equal(result.success, true, result.stderr);
          assert.equal(result.stdout, expected);
          if (sample > 0) samples[index].push(elapsed);
        }
      }
    }
    for (const list of samples) list.sort((a, b) => a - b);
    const [before, after] = samples.map((list) => list[10]);
    console.log(`${name}: ${before.toFixed(3)} -> ${after.toFixed(3)} ms, ${(100 * (1 - after / before)).toFixed(2)}% reduction (alternating A/B, median of 21 across 3 sessions)`);
    continue;
  }
  const samples = [];
  for (let sample = 0; sample < 8; sample += 1) {
    const started = performance.now();
    const json = run_pseudocode(request);
    const elapsed = performance.now() - started;
    const result = JSON.parse(json);
    assert.equal(result.success, true, result.stderr);
    assert.equal(result.stdout, expected);
    samples.push(elapsed);
  }
  samples.shift();
  samples.sort((a, b) => a - b);
  console.log(`${name}: ${samples[3].toFixed(3)} ms (WASM median of 7)`);
}
