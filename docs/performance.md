# Performance measurements

Measured against commit `2523ca1` on macOS ARM64 with 14 available processors,
Node 26.5.0, TypeScript 5.9.3 and TSRS 0.20.1-ts7.1.0-beta.
The repository/CI uses Node 22; these are local measurements, not a Node 22 or
network/device performance guarantee. A second run on the repository's Node 22
version measured checking at 2,857.19 ms with tsc and 154.20 ms with TSRS, a
94.60% reduction. Raw samples are in [typecheck-node22.json](performance/typecheck-node22.json).
Time reduction means `1 - after / before`.

## Results

| Operation and fixture | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Strict checking of all four TypeScript projects, no incremental cache | 2,573.38 ms | 167.61 ms | 93.49% |
| Cold production build including strict checking and all 220 static pages | 11.74 s | 6.03 s | 48.64% |
| WASM array sum, 2,000 elements | 87.061 ms | 0.808 ms | 99.07% |
| WASM traced array sum, same input | 87.915 ms | 0.971 ms | 98.90% |
| WASM virtual-file scan, 2,000 lines | 68.532 ms | 0.561 ms | 99.18% |
| WASM scalar sum, 50,000 loop iterations | 17.604 ms | 1.653 ms | 90.61% |
| WASM traced scalar sum, same input | 17.848 ms | 1.846 ms | 89.66% |
| WASM 5,000 function calls with 500 global variables | 9.064 ms | 2.799 ms | 69.12% |
| WASM binary size | 322,077 B | 337,234 B | 4.71% increase |
| Flowchart generation, 500 IF/ELSE blocks, 1,502 nodes, 2,001 edges | 109.55 ms | 2.32 ms | 97.88% |
| Flowchart replay preparation, same graph, 1,000 trace events | 110.40 ms | 3.02 ms | 97.27% |
| Replay visit bookkeeping, 4,000 positions, 8 blocks | 210.10 ms | 1.26 ms | 99.40% |
| Workspace source update, 240 documents and 80 virtual files | 0.02249 ms | 0.000235 ms | 98.96% |
| Compile badge update, same workspace | 0.02254 ms | 0.000212 ms | 99.06% |
| Split resizing, same workspace | 0.06049 ms | 0.000138 ms | 99.77% |
| Strict pseudocode compile, 147,803-byte arithmetic/branch program | 9.873 ms | 7.224 ms | 26.83% |
| Strict pseudocode compile, 200 file handles and 1,000 branches | 12.615 ms | 2.471 ms | 80.41% |
| File-mode semantic analysis alone, same program | 9.228 ms | 0.252 ms | 97.27% |
| Initial page JavaScript, raw emitted bytes | 643,418 B | 558,718 B | 13.16% |
| Initial page JavaScript, gzip bytes | 186,657 B | 160,601 B | 13.96% |
| All emitted JavaScript, including deferred chunks | 14,583,561 B | 6,028,835 B | 58.66% |
| Extra editor renders during 100 terminal input changes | 100 | 0 | 100% |

These measurements establish over 90% less compute in specific bottlenecks.
The accepted target is 90% less compute in the major bottlenecks, with every
end-to-end result reported separately. These measurements do **not** establish
90% lower total build time, full compiler time, network loading latency, or every
user interaction.
Initial page bytes and total emitted bytes are distinct; neither is a loading-time
measurement. A count of avoided renders is not an end-to-end latency measurement.

## What changed

- TSRS checks the same strict project configurations concurrently. Next calls it
  after compilation, when generated route validators exist. A deliberate TS2322
  error made direct `next build` fail with exit 1, proving checking remains active.
  Next still uses its Rust compiler for bundling and JavaScript emission.
- Array and virtual-file reads borrow the container instead of cloning it.
  Hot scalar expressions and control flow decode AST nodes once and reuse
  interned variable IDs. Globals use indexed slots; sparse routine frames avoid
  allocations proportional to the number of globals. Existing fallback behavior
  remains for other nodes. A test-only reference evaluator guards parity.
- Flowchart generation rejects impossible loop paths using graph components and
  stops merge searches after the best breadth-first layer. Replay indexes first
  visits once and reuses highlight objects when the active block changes.
- Workspace typing and resize updates copy only changed state. Unaffected
  documents, panels, virtual files, and layout branches keep their references.
- Monaco retains all editor UI contributions but excludes unused bundled language
  services. The manual and workerless compiler fallback load on demand.
- Compiler scans use slices and ASCII character comparisons; file-mode branches
  inherit previous modes and store only changes. Concurrent identical worker
  compilations share one request; cache entries verify the exact request.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm benchmark:typecheck
pnpm typecheck:tsc
COMPILER_BENCHMARK=1 pnpm --filter @pseudoeditor/compiler exec vitest run src/performance.test.ts --reporter verbose
WORKSPACE_BENCHMARK=1 pnpm --filter @pseudoeditor/workspace exec vitest run src/performance.test.ts --reporter verbose
FLOWCHART_BENCHMARK=1 pnpm --filter @pseudoeditor/web exec vitest run src/app/components/flowchart/performance.test.ts --reporter verbose
cargo run --release -p pseudocode-runtime --example benchmark
git show 2523ca1:apps/web/src/runtime/wasm/pkg/pseudocode_runtime_bg.wasm > /tmp/runtime-before.wasm
node packages/pseudocode-runtime/examples/benchmark-wasm.mjs --compare /tmp/runtime-before.wasm
node packages/pseudocode-runtime/examples/parity-wasm.mjs /tmp/runtime-before.wasm
```

The opt-in measurements assert correct results and print timings without brittle
wall-clock CI thresholds. Type checking uses three alternating compiler runs.
Flowchart generation uses seven alternating baseline/current runs on the same
graph. Workspace updates use nine batches of 2,000 operations after 500 warmups;
the fixture is 293,892 serialized bytes and passes persistence validation.
Compiler measurements use 15 runs after five warmups. WASM uses 21 measured
alternating baseline/current pairs across three sessions after per-session warmup,
including the request/response JSON boundary and stdout correctness assertions.
The original-WASM parity script checks 2,656 complete observable results. Build timing currently has
one cold sample per version, with `.next` and TypeScript incremental caches absent,
so it should be interpreted with less confidence than repeated medians.

For a historical source comparison, extract the relevant files from `2523ca1`
into a temporary directory with `git show`; optional compiler/workspace benchmark
inputs and full raw samples are in [performance/](performance/). Do not change the
working tree while collecting a baseline.

## Verification

Production-browser checks cover Monaco rendering and highlighting, execution
producing `55`, code-to-flowchart switching, replay through the final output, and
backward seeking to the start. Unit/regression checks cover exact compiler output,
immutable state, merge ordering, stale worker responses, compilation sharing, Monaco completion and Find, and interactive input output
`Hello, Ada`. No browser console warnings or errors appeared during these checks.
Final integration and review results are recorded with the PR.
