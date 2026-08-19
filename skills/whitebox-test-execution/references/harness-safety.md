# Harness safety

Reuse test-repository Harness/Fixture/Double only. Product source and runtime are read-only; do not add a ProjectReference that writes product `bin`, `obj`, or generated output. Runtime Health checks runtime, services, credentials, safe test data, browser/desktop session, DLL and output writability. Missing prerequisites are `BLOCKED`; an automation/harness failure after prerequisites is `ERROR`; neither is product `FAIL`.
