# Sol review ledger

Two independent review rounds used GPT-6.1 Sol with xhigh reasoning effort.

## Initial optimization

Reviewed head: `999745c8d059fa60d595db1c12c1b30121e43fed`.
Diff before the fix: 54 files, 2,506 additions and 476 deletions.

| Finding | Severity | Outcome |
| --- | --- | --- |
| S1: production config eagerly resolves build-only TSRS | should | Fixed by resolving the CLI inside the production compilation hook. |

The reviewer returned CHANGES for S1 and reported no other findings. Independent
verification passed 107 JS/TS tests, 18 Rust tests, both strict checkers, 2,656 exact
original-WASM comparisons, and 10,000 seeded graph comparisons. Usage was not
exposed in the review result.

The parent reproduced S1 with Next's production config loader while simulating
an absent TSRS package. Before the fix it failed with `MODULE_NOT_FOUND`; after
the fix it loaded successfully. A normal CI regression test retains that check.
The production build still runs TSRS checking. This small fix was verified by
the parent without a delegated re-check of S1.

## Cache follow-up

The second round reviewed `d1ac2d0` against `47ab19b` and returned APPROVE with
no findings. It covered rejected WASM initialization eviction, concurrent retry
sharing, successful instance reuse, the cache benchmark, and its documented scope.
No files were edited by the reviewer. Usage was not exposed in the result.

The reviewer independently passed 21 focused tests and the benchmark's correctness
assertions. With the actual worker and real WASM, the baseline retained the failed
initialization after one fetch. The fix completed concurrent retries with outputs
`123` and `456`, then a warm run with output `789`, with two fetches total and one
ready notification. `git diff --check` passed and the working tree stayed clean.
