import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const samples = { tsc: [], tsrs: [] };
for (let run = 0; run < 3; run += 1) {
  for (const compiler of ["tsc", "tsrs"]) {
    const start = performance.now();
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL("./typecheck.mjs", import.meta.url)),
      ...(compiler === "tsc" ? ["--tsc"] : []),
    ], { encoding: "utf8" });
    if (result.error || result.status !== 0) {
      console.error(result.error ?? result.stdout + result.stderr);
      process.exit(1);
    }
    samples[compiler].push(performance.now() - start);
  }
}
const median = (values) => [...values].sort((a, b) => a - b)[1];
console.log(JSON.stringify({
  node: process.version,
  platform: `${os.platform()} ${os.arch()}`,
  processors: os.availableParallelism(),
  versions: { tsc: require("typescript/package.json").version, tsrs: require("tsrs/package.json").version },
  projects: ["packages/compiler", "packages/workspace", "apps/web", "convex"],
  incremental: false,
  samplesMs: samples,
  medianMs: { tsc: median(samples.tsc), tsrs: median(samples.tsrs) },
  reductionPercent: (1 - median(samples.tsrs) / median(samples.tsc)) * 100,
}, null, 2));
