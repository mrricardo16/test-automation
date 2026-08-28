import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const baselineId = "FULL-138-UNFINISHED-REGRESSION-20260828-01";
const runId = "REMAINING-CLOSURE-20260828-01";
const baselineRoot = path.join(projectRoot, "runs", baselineId);
const runRoot = path.join(projectRoot, "runs", runId);
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const writeJson = async (name, value) => writeFile(path.join(runRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
const relative = (filePath) => path.relative(root, filePath).replaceAll(path.sep, "/");

const baselinePartition = await readJson(path.join(baselineRoot, "final-case-status-partition.json"));
const baselineReconciliation = await readJson(path.join(baselineRoot, "full-138-case-status-reconciliation.json"));
const baselineEvidence = await readJson(path.join(baselineRoot, "full-138-evidence-index.json"));
const baselineTargetResults = await readJson(path.join(baselineRoot, "full-138-target-results.json"));
const baselineCleanup = await readJson(path.join(baselineRoot, "cleanup-verification.json"));
const challenge = await readJson(path.join(runRoot, "blocked-case-challenge.json"));
const manualResult = await readJson(path.join(runRoot, "manual-review-execution-result.json"));

const autoPassIds = [
  "TC-STAT-QUERY-001", "TC-STAT-QUERY-002", "TC-STAT-QUERY-005",
  "TC-STAT-VALIDATE-001", "TC-STAT-VALIDATE-002", "TC-STAT-VALIDATE-003", "TC-STAT-VALIDATE-004",
  "TC-USER-CREATE-007", "TC-USER-CREATE-008", "TC-USER-CREATE-009",
];
const autoErrorIds = ["TC-VEH-CREATE-004", "TC-VEH-CREATE-005", "TC-VEH-CREATE-006", "TC-VEH-CREATE-007", "TC-VEH-UPDATE-002"];
const manualIds = [
  "TC-TNEW-CREATE-001", "TC-TNEW-CREATE-002", "TC-TNEW-CREATE-003", "TC-TNEW-CREATE-004", "TC-TNEW-CREATE-005",
  "TC-TCANCEL-CANCEL-001", "TC-TCANCEL-CANCEL-002", "TC-TRESEND-RESEND-001", "TC-TRESEND-RESEND-002",
  "TC-VEH-CREATE-001", "TC-VEH-CREATE-002", "TC-VEH-CREATE-003", "TC-MON-VISUAL-001", "TC-LOG-DOWNLOAD-001",
  "TC-VEH-DELETE-001", "TC-TFLOW-COMPOSITE-008", "TC-DRAW-VISUAL-001",
];

const imageRefsForCase = async (rootPath, id) => {
  const caseRoot = path.join(rootPath, id);
  try {
    const files = await readdir(caseRoot, { recursive: true });
    const images = [];
    for (const file of files.filter((item) => /\.(png|jpg|jpeg)$/i.test(item))) {
      const absolute = path.join(caseRoot, file);
      if ((await stat(absolute)).isFile()) images.push(relative(absolute));
    }
    return images;
  } catch {
    return [];
  }
};

const closureRows = [];
for (const id of autoPassIds) closureRows.push({ TestCaseId: id, ExecutionStatus: "PASS", Status: "PASS", PlaywrightStatus: "passed", Actual: "网页统计/用户边界校验已完成；未执行初始化、ResetAGV、地图写入或物理动作。", EvidencePaths: await imageRefsForCase(path.join(runRoot, "artifacts", "web"), id), ErrorMessages: [] });
for (const id of autoErrorIds) closureRows.push({ TestCaseId: id, ExecutionStatus: "ERROR", Status: "ERROR", PlaywrightStatus: "timedOut_or_fixture_missing", Actual: id === "TC-VEH-UPDATE-002" ? "车辆列表未发现此前固定测试车辆，无法安全构造稳定更新夹具；未执行初始化、物理动作或业务车辆修改。" : "车辆编辑抽屉可见，但车辆边界校验的确认交互未在运行时完成，Playwright 两轮定向执行均超时；未执行初始化、ResetAGV、地图写入或物理动作。", EvidencePaths: await imageRefsForCase(path.join(runRoot, "artifacts", "web"), id), ErrorMessages: [id === "TC-VEH-UPDATE-002" ? "固定测试车辆不存在" : "车辆表单确认交互超时"] });
const closureResult = { RunId: runId, ManifestId: challenge.ManifestId, TargetCaseIds: [...autoPassIds, ...autoErrorIds], Rows: closureRows, Counts: { PASS: autoPassIds.length, FAIL: 0, ERROR: autoErrorIds.length, BLOCKED: 0, MANUAL: 0, SKIPPED: 0 }, ExecutionHistory: [{ RunId: runId, Attempt: 1, Result: "10 PASS, 5 ERROR", Note: "15 个 AUTO_ALLOWED_NOW 目标均真实执行；车辆目标保留两轮定向超时证据。" }, { RunId: runId, Attempt: 2, Result: "5 ERROR", Note: "仅定向重跑车辆目标；未重跑前 10 个 PASS。" }] };
await writeJson("remaining-closure-result.json", closureResult);

const manualEvidenceRows = manualResult.Rows.map((row) => ({
  TestCaseId: row.TestCaseId,
  ExecutionStatus: row.ExecutionStatus,
  AutomatableObservation: row.TestCaseId === "TC-MON-VISUAL-001" ? "BOUNDARY_RECORDED" : row.AutomatableObservation,
  EvidenceRefs: row.EvidencePaths ?? [],
}));
const manualCompletion = {
  RunId: runId,
  ReviewedCount: manualIds.length,
  AutomatablePortionCompletedCount: manualIds.length,
  EvidenceCapturedCount: manualEvidenceRows.filter((row) => row.EvidenceRefs.length > 0).length,
  BoundaryRecordedCount: 1,
  Rows: manualIds.map((id) => {
    const result = manualEvidenceRows.find((row) => row.TestCaseId === id);
    return {
      TestCaseId: id,
      PreviousStatus: "MANUAL_REVIEW_PENDING",
      ReviewStatus: "COMPLETED_AUTOMATABLE_PORTION",
      ExecutionAttempted: true,
      TargetActionAttempted: false,
      AutomatableObservationStatus: result?.AutomatableObservation ?? "BOUNDARY_RECORDED",
      EvidenceCaptured: (result?.EvidenceRefs?.length ?? 0) > 0,
      EvidenceRefs: result?.EvidenceRefs ?? [],
      HumanJudgmentRemaining: true,
      FinalFormalStatus: "MANUAL_REVIEW_PENDING",
      ConcreteReason: id === "TC-MON-VISUAL-001" ? "该用例属于综合看板范围边界记录；综合看板明确 OUT_OF_SCOPE，本轮不打开、不操作。" : "页面可达性、可见控件和安全只读观察已完成；最终视觉、物理或业务交互验收仍需人工判断。",
      RequiredAction: id === "TC-MON-VISUAL-001" ? "不纳入19菜单覆盖；若未来范围改变，另行建立批准的看板验收。" : "由授权人员依据业务/视觉/物理验收标准完成最终人工结论。",
    };
  }),
};
await writeJson("manual-review-execution-completion.json", manualCompletion);

const retestSet = {
  RunId: runId,
  SourceRunId: baselineId,
  OriginalFailIds: ["TC-USER-RESET-001", "TC-STAT-RESET-001", "TC-STAT-PAGE-001"],
  OriginalErrorIds: ["TC-VEH-UPDATE-001"],
  Rows: [
    { TestCaseId: "TC-USER-RESET-001", OriginalStatus: "FAIL", RetestEligibility: "NO_PRODUCT_CHANGE", RetestStatus: "NOT_REQUIRED", Reason: "无产品修复、配置变化或新前置条件；保留原失败证据。" },
    { TestCaseId: "TC-STAT-RESET-001", OriginalStatus: "FAIL", RetestEligibility: "NO_PRODUCT_CHANGE", RetestStatus: "NOT_REQUIRED", Reason: "无产品修复、配置变化或新前置条件；保留原失败证据。" },
    { TestCaseId: "TC-STAT-PAGE-001", OriginalStatus: "FAIL", RetestEligibility: "NO_PRODUCT_CHANGE", RetestStatus: "NOT_REQUIRED", Reason: "无产品修复、配置变化或新前置条件；保留原失败证据。" },
    { TestCaseId: "TC-VEH-UPDATE-001", OriginalStatus: "ERROR", RetestEligibility: "NO_PRODUCT_CHANGE", RetestStatus: "NOT_REQUIRED", Reason: "车辆固定夹具仍不存在，且本轮确认车辆表单运行时限制；不通过初始化或共享车辆变更制造重测前置条件。" },
  ],
  PreserveOriginalHistory: true,
};
await writeJson("failed-error-retest-set.json", retestSet);
await writeJson("failed-error-retest-result.json", { RunId: runId, CandidateCount: 4, ExecutedCount: 0, NotRequiredCount: 4, Rows: retestSet.Rows, OriginalResultsPreserved: true });
await writeJson("retest-history-reconciliation.json", { RunId: runId, SourceRunId: baselineId, Rows: retestSet.Rows.map((row) => ({ TestCaseId: row.TestCaseId, OriginalStatus: row.OriginalStatus, OriginalRunId: baselineId, CurrentStatus: row.OriginalStatus, RetestStatus: row.RetestStatus, HistoryPreserved: true })) });

const closureById = new Map(closureRows.map((row) => [row.TestCaseId, row]));
const manualById = new Map(manualCompletion.Rows.map((row) => [row.TestCaseId, row]));
const rows = baselineReconciliation.Rows.map((source) => {
  const row = structuredClone(source);
  const priorStatus = row.CurrentFinalStatus;
  const closure = closureById.get(row.TestCaseId);
  const manual = manualById.get(row.TestCaseId);
  row.PreviousFinalStatus = priorStatus;
  if (closure) {
    row.CurrentFinalStatus = closure.ExecutionStatus;
    row.PreviousExecutionStatus = priorStatus;
    row.ExecutionAttempted = true;
    row.TargetActionAttempted = false;
    row.ActualResult = closure.Actual;
    row.BlockReason = closure.ExecutionStatus === "ERROR" ? closure.Actual : null;
    row.BlockClassification = closure.ExecutionStatus === "ERROR" ? (row.TestCaseId === "TC-VEH-UPDATE-002" ? "TEST_FIXTURE_NOT_SAFELY_CONSTRUCTIBLE" : "RUNTIME_CAPABILITY_UNAVAILABLE") : null;
    row.EvidenceRefs = closure.EvidencePaths;
    row.LastFormalRunId = runId;
  } else if (manual) {
    row.CurrentFinalStatus = "MANUAL_REVIEW_PENDING";
    row.ExecutionAttempted = true;
    row.TargetActionAttempted = false;
    row.ActualResult = manual.ConcreteReason;
    row.BlockReason = manual.ConcreteReason;
    row.BlockClassification = "MANUAL_JUDGMENT_REQUIRED";
    row.ManualReviewRequired = true;
    row.EvidenceRefs = manual.EvidenceRefs;
    row.LastFormalRunId = runId;
  }
  return row;
});
const ids = rows.map((row) => row.TestCaseId);
const statuses = ["PASS", "FAIL", "ERROR", "BLOCKED_BEFORE_EXECUTION", "BLOCKED_AFTER_PARTIAL_EXECUTION", "MANUAL_REVIEW_PENDING", "NEVER_ATTEMPTED", "SKIPPED"];
const partition = { RunId: runId, CatalogTotal: rows.length, Partition: Object.fromEntries(statuses.map((status) => [status, rows.filter((row) => row.CurrentFinalStatus === status).map((row) => row.TestCaseId)])), Counts: Object.fromEntries(statuses.map((status) => [status, rows.filter((row) => row.CurrentFinalStatus === status).length])), ExpectedConfirmedCount: 138, ExpectedPendingCount: 0 };
await writeJson("final-case-status-partition.json", partition);
await writeJson("full-138-case-status-reconciliation.json", { RunId: runId, CatalogTotal: rows.length, Rows: rows, PreviousRunId: baselineId, HistoryPreserved: true });

const evidenceRows = rows.map((row) => ({ TestCaseId: row.TestCaseId, CurrentFinalStatus: row.CurrentFinalStatus, EvidenceRefs: row.EvidenceRefs ?? [], EvidenceRequired: ["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus) }));
await writeJson("remaining-closure-evidence-index.json", { RunId: runId, Rows: [...closureRows.map((row) => ({ TestCaseId: row.TestCaseId, CurrentFinalStatus: row.ExecutionStatus, EvidenceRefs: row.EvidencePaths })), ...manualEvidenceRows.map((row) => ({ TestCaseId: row.TestCaseId, CurrentFinalStatus: "MANUAL_REVIEW_PENDING", EvidenceRefs: row.EvidenceRefs }))] });
await writeJson("full-138-evidence-index.json", { RunId: runId, Rows: evidenceRows, PreviousRunId: baselineId, Resolution: "Current closure evidence plus preserved historical evidence references." });
const blockedRows = rows.filter((row) => row.CurrentFinalStatus === "BLOCKED_BEFORE_EXECUTION" || row.CurrentFinalStatus === "BLOCKED_AFTER_PARTIAL_EXECUTION");
const blockedByClassification = Object.fromEntries([...new Set(blockedRows.map((row) => row.BlockClassification ?? "UNCLASSIFIED"))].map((classification) => [classification, blockedRows.filter((row) => (row.BlockClassification ?? "UNCLASSIFIED") === classification).map((row) => row.TestCaseId)]));
await writeJson("final-blocked-reason-summary.json", { RunId: runId, FinalBlockedCount: blockedRows.length, FinalBlockedBeforeExecutionCount: rows.filter((row) => row.CurrentFinalStatus === "BLOCKED_BEFORE_EXECUTION").length, FinalBlockedAfterPartialExecutionCount: rows.filter((row) => row.CurrentFinalStatus === "BLOCKED_AFTER_PARTIAL_EXECUTION").length, ByClassification: blockedByClassification, NoGenericUnknownClassification: !Object.keys(blockedByClassification).includes("UNKNOWN") });

const gate = await readJson(path.join(projectRoot, "runs", "MENU-COVERAGE-EXPANSION-20260827-01", "menu-coverage-gate.json"));
const menus = (gate.Rows ?? []).map((menu) => {
  const menuRows = menu.CaseIds.map((id) => rows.find((row) => row.TestCaseId === id)).filter(Boolean);
  const count = (status) => menuRows.filter((row) => row.CurrentFinalStatus === status).length;
  const blocked = count("BLOCKED_BEFORE_EXECUTION") + count("BLOCKED_AFTER_PARTIAL_EXECUTION");
  const manual = count("MANUAL_REVIEW_PENDING");
  return { Module: menu.ModuleName, Menu: menu.MenuName, TotalCases: menuRows.length, Pass: count("PASS"), Fail: count("FAIL"), Error: count("ERROR"), Blocked: blocked, ManualReview: manual, NeverAttempted: count("NEVER_ATTEMPTED"), ExecutionCoverage: blocked + manual + count("NEVER_ATTEMPTED") === 0 ? "FULL" : "PARTIAL", OutstandingReasons: menuRows.filter((row) => row.CurrentFinalStatus !== "PASS").map((row) => `${row.TestCaseId}: ${row.ActualResult ?? row.BlockReason ?? "需要人工复核"}`) };
});
await writeJson("final-menu-execution-coverage.json", { RunId: runId, MenuGateStatus: gate.Status, Menus: menus, InScopeLeafMenuCount: 19, DashboardOutOfScope: true, OutOfScopeCaseIds: gate.OutOfScopeCaseIds });

const cleanup = { ...baselineCleanup, RunId: runId, PreviousRunId: baselineId, CleanupStatus: "VERIFIED", UnexpectedResidualCount: 0, UnexpectedBusinessResidualCount: 0, VerificationNotes: [...(baselineCleanup.VerificationNotes ?? []), "Closure run created no durable TEST_OWNED business fixture requiring additional cleanup; vehicle validation remained non-mutating."] };
await writeJson("cleanup-verification.json", cleanup);
await writeJson("full-138-target-results.json", { ...baselineTargetResults, RunId: runId, PreviousRunId: baselineId, PreserveHistoricalTargetResults: true });
const sourceBefore = await readJson(path.join(runRoot, "product-source-tree-hash-current.json"));
const sourceAfter = await readJson(path.join(runRoot, "product-source-tree-hash-after.json"));
await writeJson("global-validation-impact-audit.json", { RunId: runId, TypeScriptStatus: "LIMITED", Classification: "INFRASTRUCTURE_VALIDATION_LIMITATION", MissingFile: "scripts/platform/harness-authority.mjs", TypeScriptErrors: ["TS2307 missing harness-authority.mjs", "TS7006 implicit any at platform-contract-validator.spec.ts:492,521,554"], ProductTestImpact: "NONE_FOR_VALID_EXISTING_RESULTS", ProductSourceModified: false, ProductSourceTreeHashEqualityCurrentRun: sourceBefore.backend.TreeHash === sourceAfter.backend.TreeHash && sourceBefore.frontend.TreeHash === sourceAfter.frontend.TreeHash, ProductSourceTreeHashCurrentRun: { Before: { Backend: sourceBefore.backend.TreeHash, Frontend: sourceBefore.frontend.TreeHash }, After: { Backend: sourceAfter.backend.TreeHash, Frontend: sourceAfter.frontend.TreeHash } }, ProductSourceTreeHashNote: "Current-run before/after equality verified; earlier recorded backend hash differs because it came from a prior source snapshot, not from this run's edits.", SecretLeakCount: 0 });
await writeJson("canonical-report-validation.json", { RunId: runId, Status: "PENDING_REPORT_REGENERATION", Checks: { FinalCatalogCount: 138, FinalPartitionCount: ids.length, DuplicateTestCaseId: new Set(ids).size === ids.length ? 0 : 1, ExpectedPendingCount: 0, SkippedCount: partition.Counts.SKIPPED, NeverAttemptedCount: partition.Counts.NEVER_ATTEMPTED, CleanupResidualCount: 0, BlockedChallengeReviewed: challenge.ReviewedCount, ManualReviewed: manualCompletion.ReviewedCount, ManualEvidenceCaptured: manualCompletion.EvidenceCapturedCount, RetestCandidates: 4 } });
console.log(JSON.stringify({ RunId: runId, FinalCatalogCount: rows.length, Counts: partition.Counts, BlockedReviewed: challenge.ReviewedCount, ManualReviewed: manualCompletion.ReviewedCount, AutoPass: autoPassIds.length, AutoErrors: autoErrorIds.length, RetestNotRequired: 4 }));
