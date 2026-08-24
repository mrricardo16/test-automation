# Handoff integrity diagnosis

## Observable failure

Before this fix, the project validator returned `PROJECT_STRUCTURE=PASS`, `EXECUTION_READINESS=BLOCKED`, and `Reason=HASH_CONTRACT_AMBIGUOUS`. The package declared hash `f945fc19c810b33b54231d3ccb86dbb89a0cc40933dae4677922f62a172240fc`; 12 business TestCases remained draft and 0 active.

## Execution path and root cause

- ProducerAlgorithm: no executable Producer implementation exists in the authorized repository scope. The only Producer artifacts were `00-handoff-manifest.md` and `handoff.sha256`.
- Producer declaration: SHA-256 over a named object `handoff-package-excluding-manifest-and-hash`; exact exclusions were package-root `00-handoff-manifest.md` and `handoff.sha256`.
- ConsumerAlgorithm: the former project validator read metadata and required the literal blocked reason. It did not enumerate protected files, normalize paths, sort records, hash bytes, or compare expected/actual hashes.
- Missing contract dimensions: byte serialization, per-file framing, relative-path normalization, separators, sorting, text encoding, CRLF/LF, BOM, and case handling.
- Root cause: Producer and Consumer had no shared complete or executable hash contract.
- Trigger condition: intake of an unversioned legacy envelope whose declared object could be interpreted multiple ways.
- Secondary symptoms: integrity and execution remained blocked; business TestCases remained draft/inactive.
- Unrelated blockers: `BASELINE_LIMITED`, `SourceRuntimeAlignment=UNKNOWN`, local runtime configuration, credentials, safe test data, and explicit execution authorization. They are not changed by this fix.

The legacy hash also did not equal SHA-256 over the 18 path-sorted protected files directly concatenated as raw bytes (`2f334be52da731afb431c98a1bdaf124e9dda0e746857348816cf256bcce65ea`). This rules out that one candidate but does not identify the absent legacy Producer algorithm.

## Minimal correction

`HANDOFF-SHA256-V1` defines recursive regular-file selection, two exact root-relative envelope exclusions plus explicit temporary/runtime-generated path classes, `/` separators, case preservation, UTF-8-byte ordinal sorting, raw protected bytes, per-file SHA-256 and length framing, and an LF/UTF-8/no-BOM canonical manifest. Producer and Consumer import the same helper.

Missing `ContractVersion` is classified `BLOCKED(LEGACY_HASH_CONTRACT_UNVERSIONED)` rather than guessed. A valid V1 mismatch is `FAIL(HANDOFF_HASH_MISMATCH)`.

## Refreeze record

- OldHash: `f945fc19c810b33b54231d3ccb86dbb89a0cc40933dae4677922f62a172240fc`
- NewHash: `d0e4c9ee346187cf3e0bb2723efa8925436263e535ba5924076ab019c5cb37e3`
- HashChangeReason: `INTEGRITY_CONTRACT_STANDARDIZATION`
- BUSINESS_HANDOFF_CONTENT_CHANGED: `NO`
- INTEGRITY_METADATA_CHANGED: `YES`
- ProtectedFileCount: `18`

Only excluded `00-handoff-manifest.md` and `handoff.sha256` were refrozen in the package. Existing black-box runs were not modified.
