# TC-DOC-GOV-001：测试报告命名与图片复审版式治理

| Field | Value |
|---|---|
| TestCaseId | TC-DOC-GOV-001 |
| Scope | `projects/test-workflow/reports/` authoritative functional and flow reports |
| TestType | CI documentation governance gate |
| RequirementSource | `projects/test-workflow/reports/测试文档命名规则.md` |
| Preconditions | Report naming rule and the current authoritative reports exist |
| Steps | 1. Scan report filenames. 2. Read reports as strict UTF-8. 3. Verify the result table contains the `图片示例` column. 4. Verify every image `src`/`href` resolves under the report directory. 5. Reject absolute local paths and standalone `人工复审图片证据` headings. |
| ExpectedResult | Functional and flow reports retain the source-document prefix and the correct report suffix; each report presents image evidence in the result table's right-side `图片示例` column; referenced images exist; no local-machine path or standalone image-review module is introduced. |
| AutomationMapping | `scripts/platform/report-governance.mjs`; invoked by `scripts/platform/run-platform-quality.mjs` |
| Status | PASS when the CI governance script exits 0; otherwise FAIL |
