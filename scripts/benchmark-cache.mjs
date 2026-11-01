// node scripts/benchmark-cache.mjs [--build]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const fromVitest = createRequire(require.resolve("vitest/node"));
const { createServer } = await import(fromVitest.resolve("vite"));
const median = (samples) => [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
const reduction = (before, after) => 100 * (1 - after / before);
const results = { node: process.version, compile: [], runtime: null };

assert.equal(typeof Worker, "undefined", "This benchmark measures the workerless compiler core.");
const server = await createServer({
  configFile: false,
  root: path.join(root, "apps/web"),
  resolve: { alias: { "@": path.join(root, "apps/web/src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { compilePseudocodeInWorker, pseudocodeCompilerRunner, getCompileCacheKey } =
    await server.ssrLoadModule("/src/runtime/compilePseudocodeInWorker.ts");
  const workloads = [
    ["small", "OUTPUT 123"],
    ["medium", `DECLARE Total : INTEGER\n${Array.from({ length: 500 }, (_, i) => `Total <- Total + ${i}`).join("\n")}\nOUTPUT Total`],
    ["large", `DECLARE Total : INTEGER\n${Array.from({ length: 2000 }, (_, i) => `Total <- Total + ${i}\nIF Total > ${i} THEN\nOUTPUT "Total is ", Total\nENDIF`).join("\n")}`],
  ];
  for (const [name, source] of workloads) {
    const request = { source, filename: "benchmark.pseudo", strict: true };
    const run = () => compilePseudocodeInWorker(request, getCompileCacheKey(name, request.filename, source));
    let expected;
    for (let i = 0; i < 5; i++) {
      pseudocodeCompilerRunner.clearCache();
      const result = await run();
      assert.equal(result.result.success, true);
      expected = result.result.astJson;
    }
    const misses = [], hits = [];
    for (let i = 0; i < 21; i++) {
      pseudocodeCompilerRunner.clearCache();
      let start = performance.now();
      const miss = await run();
      misses.push(performance.now() - start);
      assert.equal(miss.cached, false);
      assert.equal(miss.result.astJson, expected);
      start = performance.now();
      const hit = await run();
      hits.push(performance.now() - start);
      assert.equal(hit.cached, true);
      assert.equal(hit.result.astJson, expected);
    }
    results.compile.push({
      workload: name, sourceBytes: Buffer.byteLength(source),
      missMs: median(misses), hitMs: median(hits),
      reductionPercent: reduction(median(misses), median(hits)), misses, hits,
    });
  }
} finally {
  await server.close();
}

const wasm = fs.readFileSync(new URL("../apps/web/src/runtime/wasm/pkg/pseudocode_runtime_bg.wasm", import.meta.url));
const request = JSON.stringify({
  ast_json: JSON.stringify({ kind: "program", body: [{ kind: "output", values: [{ kind: "literal", literalType: "INTEGER", value: 123 }] }] }),
  stdin_lines: [], virtual_files: {},
});
const startup = [], warm = [];
for (let i = 0; i < 15; i++) {
  const bindings = new URL("../apps/web/src/runtime/wasm/pkg/pseudocode_runtime.js", import.meta.url);
  bindings.search = `cache-benchmark=${i}`;
  const runtime = await import(bindings.href);
  let start = performance.now();
  runtime.initSync({ module: wasm });
  let result = JSON.parse(runtime.run_pseudocode(request));
  startup.push(performance.now() - start);
  assert.equal(result.stdout, "123");
  start = performance.now();
  for (let run = 0; run < 100; run++) result = JSON.parse(runtime.run_pseudocode(request));
  warm.push((performance.now() - start) / 100);
  assert.equal(result.stdout, "123");
}
results.runtime = {
  newInstanceMs: median(startup), warmExecutionMs: median(warm),
  reductionPercent: reduction(median(startup), median(warm)), startup, warm,
};
if (process.argv.includes("--build")) {
  const samples = [];
  for (let i = -1; i < 3; i++) {
    const start = performance.now();
    const result = spawnSync("pnpm", ["build"], { cwd: root, env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    assert.equal(result.status, 0, result.error?.message ?? (result.stdout + result.stderr).slice(-4000));
    if (i >= 0) samples.push((performance.now() - start) / 1000);
  }
  results.build = { warmupBuilds: 1, medianSeconds: median(samples), samplesSeconds: samples };
}
results.scope = {
  compile: "Cache hit versus compilation in the actual runner, including source hashing/exact lookup; real compiler, no worker transport or browser startup.",
  runtime: "In-memory WASM bytes: new instance plus execution versus reused instance; includes JSON parsing, excludes fetch and worker boot. Engine compiled-module cache may be reused.",
  build: "Consecutive builds with .next retained; no build cache is deleted. Report separately from browser hot start.",
};
console.log(JSON.stringify(results, null, 2));
