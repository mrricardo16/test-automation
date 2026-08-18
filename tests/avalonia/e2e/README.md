# Avalonia Desktop E2E Boundary

This directory contains the Phase 3B minimum real `HZ.LogClient.exe` Appium evaluation.

Only these formal Cases belong here during Phase 3B:

- `TC-AVA-E2E-ENV-001`: project-local Appium/Windows backend/session/page-source environment probe; last verified `PASS`.
- `TC-AVA-E2E-001`: the single real AnalysisView multi-car-log import attempt through the native Windows picker; execution data comes from `config/local-projects.json` or the example configuration.

The real source and runtime remain read-only. Product-side AutomationId or testability changes are recommendations only. Do not add export, Replay, map, CI/CD, or coordinate-based formal automation in this phase.
