# RSS Composer Blackbox

ProjectId: `REAL-RSSCOMPOSER-BLACKBOX`
ProjectMode: `BLACKBOX`
Test Framework: `Playwright`
Current Status: `FORMAL_RUN_RECORDED_WITH_BLOCKERS`

This is a long-lived black-box workspace. Expected results are traceable only to the Frozen Handoff package `DEV-HANDOFF-REAL-20260824-105102`; historical runs are evidence/index references, never an Expected source.

Historical runs: `BB-REAL-20260824-114501` (metadata supplied by the user only) and `BB-REAL-20260824-115939` (current black-box import source). Neither run is modified by this project.

Forbidden: Product Source, Whitebox Internal, DLL/PDB, Source-assisted diagnosis. Handoff integrity passes. Latest formal run `BB-REAL-20260824-143008` activated 12 reviewed Cases; 11 were BLOCKED and one remained MANUAL, with no Runtime mutation.

Responsibilities are isolated: `handoff/` contains frozen-reference metadata; `test-cases/` contains durable case records; `tests/` contains future automation scaffolding; `docs/` governs the workspace; `runs/` indexes execution runs; `reports/` publishes status; and `config/` supplies non-secret local templates.
