# LogClient test data boundary

Phase 3A does not commit a real log package, ZIP, JSONL, map, or runtime sample. The source and runtime were inspected read-only, but no submitted sample was approved as non-sensitive. The three Phase 3A Headless cases use real view controls and real runtime state transitions without loading production log data.

Future `AUTO_UNIT` and `AUTO_HEADLESS_WITH_MOCK` fixtures must be synthetic, minimal, and derived from the actual `LogLineRecord` / package structure after the parser contract is confirmed. A fixture should be added here only with an explicit expected result and a review that it contains no vehicle, route, operator, customer, or operationally sensitive data.

The first Appium candidate must use an approved non-sensitive package or a newly generated synthetic archive. Do not copy files from `D:\HZ_RSS40`, `E:\logclient`, or other production/runtime locations into this repository.

For `TC-AVA-E2E-001`, the current repository has no approved local package yet. The test must remain `BLOCKED` until `test-data/logclient/local/` contains a confirmed parser-valid, non-sensitive package and the Expected Result is recorded. A local package must be ignored by Git and must never be copied from the runtime directory into this repository.
