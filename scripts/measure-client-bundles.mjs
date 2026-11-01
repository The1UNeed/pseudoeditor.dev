// Compare build artifacts without confusing emitted bytes with loading latency.
// node scripts/measure-client-bundles.mjs <baseline .next directory> [current .next directory]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { gzipSync } from "node:zlib";

function measure(directory) {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(directory,
    "server/app/[locale]/app/page_client-reference-manifest.js"), "utf8"), context);
  const manifest = context.__RSC_MANIFEST["/[locale]/app/page"];
  const chunks = [...new Set(Object.values(manifest.entryJSFiles).flat())];
  const entryFiles = chunks.map((chunk) => path.join(directory, chunk));
  const staticDirectory = path.join(directory, "static");
  const emittedFiles = fs.readdirSync(staticDirectory, { recursive: true })
    .filter((file) => file.endsWith(".js")).map((file) => path.join(staticDirectory, file));
  return {
    routeEntryJsBytes: entryFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0),
    routeEntryGzipBytes: entryFiles.reduce((sum, file) => sum + gzipSync(fs.readFileSync(file)).length, 0),
    allEmittedJsBytes: emittedFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0),
    emittedJsFiles: emittedFiles.length,
  };
}
assert.ok(process.argv[2], "Pass the baseline .next directory");
console.log(JSON.stringify({
  baseline: measure(process.argv[2]),
  optimized: measure(process.argv[3] ?? "apps/web/.next"),
}, null, 2));
