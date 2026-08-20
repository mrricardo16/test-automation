# White-box contract

Accept direct `frontend_source` and/or `backend_source`, `output_root`, and optional Runtime/Handoff. Require one source side; record the other as `NOT_PROVIDED`. Inventory every Solution/App/Service before targeted reading. Handoff is optional. Preserve the three-Skill boundary: direct source is this Skill; Handoff is dev-test-handoff; black-box runtime execution is test-execution. `ExpectedBasis` is mandatory and product source remains read-only.

The repository Canonical Contracts are authoritative: `contracts/status-contract.md`, `contracts/testcase-contract.md`, `contracts/coverage-contract.md`, `contracts/evidence-contract.md`, `contracts/confidence-contract.md`, and `contracts/id-contract.md`. Use `ExpectedBasis` values `REQUIREMENT`, `DESIGN`, `APPROVED_BASELINE`, `HANDOFF_BASELINE`, `CODE_BEHAVIOR`, or `UNKNOWN`; keep runtime observations in Actual/Observation Evidence and use `LegacyFieldAdapter` for historical fields.
