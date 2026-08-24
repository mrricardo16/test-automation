# RSS Composer Handoff Integrity Contract Fix Implementation Plan

> Execution is inline in the current authorized agent. The user requires one final fix commit after the existing skeleton commit.

**Goal:** Replace the ambiguous RSS Composer Frozen Handoff hash declaration with one executable `HANDOFF-SHA256-V1` contract shared by producer and consumer, without changing protected business payload bytes.

**Architecture:** `scripts/platform/handoff-integrity.mjs` is the only hashing implementation. It builds a canonical LF/UTF-8/no-BOM manifest from raw protected-file SHA-256 values and normalized package-relative paths, then hashes that manifest. A producer wrapper refreezes only the excluded envelope files; the project validator imports the same helper as its consumer.

**Tech Stack:** Node.js ESM, built-in `node:crypto`, `node:fs`, `node:path`, and `node:test`; Markdown/JSON UTF-8 metadata.

## Global constraints

- Read and write only the repository paths authorized in the current request.
- Do not inspect product source, white-box internals, DLL/PDB/source maps, databases, SVN, or product history.
- Do not run login, API/CRUD, runtime regression, business tests, or PLATFORM-09.
- Preserve all 18 protected business payload files byte-for-byte.
- Exclude package-root `00-handoff-manifest.md` and `handoff.sha256`, plus the explicitly documented temporary/runtime-generated path classes, from V1.
- Do not force the legacy expected hash to match the V1 result.
- Keep existing runs unchanged; keep the 12 business TestCases inactive with expected business content unchanged.
- Keep all changed text UTF-8.

## Task 1: Root-cause and contract tests

**Files:**

- Create `projects/rsscomposer-blackbox/docs/15-handoff-integrity-diagnosis.md`.
- Create `projects/rsscomposer-blackbox/test-cases/contract/handoff-integrity-contract.md` before test code.
- Create `projects/rsscomposer-blackbox/tests/contract/handoff-integrity.test.mjs` after the TestCase record.

**Interfaces:** tests import `buildCanonicalManifest`, `calculateHandoffIntegrity`, `parseIntegrityEnvelope`, and `verifyHandoffIntegrity` from the shared helper.

- [x] Record Producer absence, Consumer behavior, declared file set, missing normalization/ordering/encoding rules, root cause, trigger, symptoms, and unrelated blockers.
- [x] Add one unique `TestCaseId` for each deterministic behavior.
- [x] Run `node --test projects/rsscomposer-blackbox/tests/contract/handoff-integrity.test.mjs` and require RED because the helper did not exist.

## Task 2: Shared V1 implementation and adapters

**Files:**

- Create `contracts/handoff-integrity-contract.md`.
- Create `scripts/platform/handoff-integrity.mjs`.
- Create `scripts/platform/freeze-handoff-integrity.mjs` as the producer wrapper.
- Modify `projects/rsscomposer-blackbox/scripts/validate-project.mjs` as the consumer.
- Update `skills/dev-test-handoff/SKILL.md`, `skills/dev-test-handoff/references/handoff-validation-gate.md`, `skills/test-execution/SKILL.md`, and `skills/test-execution/references/black-box-contract.md` to reference the canonical contract/helper.

**Interfaces:**

- `calculateHandoffIntegrity(packageRoot)` returns V1 hash, canonical manifest bytes/text, protected file records, and exclusions.
- `verifyHandoffIntegrity(packageRoot)` returns `PASS`, `FAIL`, or `BLOCKED`; missing/unknown `ContractVersion` is legacy `BLOCKED`, never guessed.
- `freezeHandoffIntegrity(packageRoot)` writes only the two excluded envelope metadata files.

- [x] Implement raw-byte per-file SHA-256, `/` separators, UTF-8-byte path sorting, case preservation, LF/no-BOM canonical manifest serialization, and exact root-relative exclusions.
- [x] Run the contract test and require GREEN.

## Task 3: Metadata refreeze and focused verification

**Files:**

- Modify only package `00-handoff-manifest.md` and `handoff.sha256` under the authorized Frozen Handoff.
- Update current/baseline integrity metadata and integrity-only RSS Composer docs/status; do not modify existing run records or 12 business TestCases.

- [x] Capture protected-file hashes before refreeze.
- [x] Run the producer wrapper and record `OldHash`, `NewHash`, `HashChangeReason=INTEGRITY_CONTRACT_STANDARDIZATION`, `BUSINESS_HANDOFF_CONTENT_CHANGED=NO`, and `INTEGRITY_METADATA_CHANGED=YES`.
- [x] Compare every protected-file digest before/after and require equality.
- [x] Run contract tests, project validator, both relevant skill validators/self-tests, focused platform regressions that do not execute real business behavior, UTF-8 checks, and `git diff --check`.
- [ ] Stage explicit files only and commit `fix: standardize handoff integrity contract`; do not push.
