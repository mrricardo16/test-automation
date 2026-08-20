# Reports and evidence

`reports/` contains Committed audit, design, governance, and acceptance reports that are safe to review and version.

- `agent-driven-platform-acceptance.md` is the committed PLATFORM-08 final acceptance report.
- Historical reports under `projects/test-workflow/reports/` are preserved for traceability.
- Generated runtime evidence belongs in ignored `artifacts/`; generated report output belongs in ignored/generated paths and is not a substitute for a committed acceptance report.
- Reports must preserve `TestCaseId`, `ExecutionStatus`, `ApplicabilityStatus`, `CoverageStatus`, `GateStatus`, `ExpectedBasis`, evidence references, and limitations. Never place Secret, password, token, cookie, API key, or sensitive payload values in committed reports.
