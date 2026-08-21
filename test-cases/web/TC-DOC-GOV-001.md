# TC-DOC-GOV-001：四类测试报告命名、结构与证据治理

| Field | Value |
|---|---|
| TestCaseId | TC-DOC-GOV-001 |
| Scope | `projects/test-workflow/reports/` 的功能/流程完整测试用例报告与问题反馈报告 |
| TestType | CI documentation governance gate |
| RequirementSource | `projects/test-workflow/reports/测试文档命名规则.md` |
| Preconditions | Report naming rule and the current authoritative reports exist |
| Steps | 1. Scan the four report filenames and require `_完整测试用例报告.md` or `_问题反馈报告.md`. 2. Read all documents as strict UTF-8. 3. Verify complete-case and issue-report structures, statuses, and mandatory coverage terms. 4. Verify each result row has a right-side `图片示例` column and each image link resolves within the report directory. 5. Verify issue reports only contain feedback-worthy statuses and retain TestCaseId, expected, actual, category, severity, and evidence. 6. Reject absolute, remote, or parent-relative image paths and standalone image-review headings. |
| ExpectedResult | Exactly one functional and one flow complete test-case report plus exactly one functional and one flow issue-feedback report retain the source prefix and correct suffix. All reports use valid statuses, contain resolvable report-local image evidence, and issue reports retain the required feedback fields without PASS issue rows. |
| AutomationMapping | `scripts/platform/report-governance.mjs`; invoked by `scripts/platform/run-platform-quality.mjs` |
| Status | PASS when the CI governance script exits 0; otherwise FAIL |
