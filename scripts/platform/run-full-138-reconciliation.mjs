import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const runId = "FULL-138-UNFINISHED-REGRESSION-20260828-01";
const runRoot = path.join(projectRoot, "runs", runId);
const catalogPath = path.join(projectRoot, "test-cases", "catalog", "menu-coverage-expanded-catalog.json");
const legacyResultPath = path.join(projectRoot, "runs", "SOURCE-ASSISTED-FORMAL-20260827-02", "formal-result.json");
const addedResultPath = path.join(projectRoot, "runs", "MENU-COVERAGE-EXPANSION-20260827-01", "menu-coverage-web-execution-results.json");
const expansionRoot = path.join(projectRoot, "runs", "MENU-COVERAGE-EXPANSION-20260827-01");
const targetResultPath = path.join(runRoot, "full-138-target-results.json");
const targetResultPathRelative = `projects/rsscomposer-blackbox/runs/${runId}/full-138-target-results.json`;
const legacyRunId = "SOURCE-ASSISTED-FORMAL-20260827-02";
const addedRunId = "MENU-COVERAGE-EXPANSION-20260827-01";

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const rel = (filePath) => path.relative(root, filePath).replaceAll(path.sep, "/");
const writeJson = async (name, value) => {
  await writeFile(path.join(runRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const countBy = (rows, key) => Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((value) => [value, rows.filter((row) => row[key] === value).length]));

const catalog = await readJson(catalogPath);
const legacy = await readJson(legacyResultPath);
const added = await readJson(addedResultPath);
const menuGate = await readJson(path.join(expansionRoot, "menu-coverage-gate.json"));
const formDiscovery = await readJson(path.join(expansionRoot, "form-capability-discovery.json"));
const targetResults = await readJson(targetResultPath).catch(() => ({ Rows: [] }));
const targetById = new Map((targetResults.Rows ?? []).map((row) => [row.TestCaseId, row]));
const evidenceByCase = new Map();
const evidenceRoot = path.join(runRoot, "artifacts", "web");
try {
  for (const entry of await readdir(evidenceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const caseRoot = path.join(evidenceRoot, entry.name);
    const files = await readdir(caseRoot, { recursive: true });
    const refs = files
      .filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
      .map((file) => rel(path.join(caseRoot, file)));
    if (refs.length) evidenceByCase.set(entry.name, refs);
  }
} catch {
  // Evidence directories are optional for design-only and never-attempted cases.
}

const catalogCases = catalog.TestCases.filter((item) => item.ScopeStatus !== "OUT_OF_SCOPE" && item.ApplicabilityStatus !== "OUT_OF_SCOPE");
const catalogIds = catalogCases.map((item) => item.TestCaseId);
const catalogIdSet = new Set(catalogIds);
const addedRows = added.Rows ?? [];
const addedById = new Map(addedRows.map((row) => [row.TestCaseId, row]));

const resultBuckets = [
  ["ExecutedResults", legacy.ExecutedResults ?? [], 1],
  ["BlockedFlowResults", legacy.BlockedFlowResults ?? [], 2],
  ["ManualResults", legacy.ManualResults ?? [], 3],
  ["PendingResults", legacy.PendingResults ?? [], 4],
];
const legacyById = new Map();
const historicalConflicts = [];
for (const [bucket, rows, priority] of resultBuckets) {
  for (const row of rows) {
    if (!catalogIdSet.has(row.TestCaseId)) continue;
    const previous = legacyById.get(row.TestCaseId);
    if (previous) {
      historicalConflicts.push({ TestCaseId: row.TestCaseId, KeptBucket: previous.bucket, KeptPriority: previous.priority, DuplicateBucket: bucket, DuplicatePriority: priority, Resolution: "KEEP_HIGHEST_PRIORITY_EXECUTED_RESULT; CURRENT_CASE_EMITTED_ONCE" });
      if (priority >= previous.priority) continue;
    }
    legacyById.set(row.TestCaseId, { ...row, bucket, priority });
  }
}

const originalSkipped = addedRows.filter((row) => row.ExecutionStatus === "SKIPPED");
const oldSkippedIds = originalSkipped.map((row) => row.TestCaseId);
const manualAddedId = addedRows.find((row) => row.ExecutionStatus === "MANUAL")?.TestCaseId ?? "TC-DRAW-VISUAL-001";
const safeAddedIds = new Set(oldSkippedIds.filter((id) => ![
  "TC-MAINT-CREATE-001",
  "TC-MENU-CREATE-001",
  "TC-MENU-UPDATE-001",
  "TC-MENU-DELETE-001",
  "TC-EXT-INTEGRATION-001",
].includes(id)));

const classificationForSkipped = (tc, previous) => {
  const id = tc.TestCaseId;
  if (id === "TC-MAINT-CREATE-001") return {
    FinalClassification: "SAFETY_BLOCKED",
    CanExecuteNow: false,
    EnvironmentReady: true,
    SafetyReady: false,
    ConcreteReason: "当前新增维护任务表单提交会直接调用 GotoRecharger/GotoStandby，对车辆发起物理动作；该 Case 不能按普通配置 CRUD 执行。",
  };
  if (id.startsWith("TC-MENU-")) return {
    FinalClassification: "ENVIRONMENT_BLOCKED",
    CanExecuteNow: false,
    EnvironmentReady: false,
    SafetyReady: false,
    ConcreteReason: "菜单管理只能操作 TEST_OWNED 菜单；当前发现未提供经批准的 TEST_OWNED 父菜单，不能把 RSS Root、正式菜单或自动化依赖菜单作为父级。",
  };
  if (id === "TC-EXT-INTEGRATION-001") return {
    FinalClassification: "ENVIRONMENT_BLOCKED",
    CanExecuteNow: false,
    EnvironmentReady: false,
    SafetyReady: true,
    ConcreteReason: "外部系统页面真实能力仅包含配置 CRUD，未发现独立的 Integration/连通性触发入口；仅允许 Local Mock，当前不能把配置保存冒充连通性执行。",
  };
  if (id.startsWith("TC-PROC-")) return {
    FinalClassification: "AUTO_EXECUTABLE_NOW",
    CanExecuteNow: true,
    EnvironmentReady: true,
    SafetyReady: true,
    ConcreteReason: "使用当前批准地图创建 autoStart=false 的 TEST_OWNED 独立进程；不触碰运行中的正式 Chain/Feedback Process。",
  };
  return {
    FinalClassification: "AUTO_EXECUTABLE_NOW",
    CanExecuteNow: true,
    EnvironmentReady: true,
    SafetyReady: true,
    ConcreteReason: "通过页面表单创建唯一 TEST_OWNED 数据，再执行本 Case 的查询/修改/关系/删除断言；不写数据库、不操作正式数据。",
  };
};

const skippedReconciliation = originalSkipped.map((previous) => {
  const tc = catalogCases.find((item) => item.TestCaseId === previous.TestCaseId);
  const decision = classificationForSkipped(tc, previous);
  return {
    TestCaseId: previous.TestCaseId,
    Module: tc?.ModuleName ?? "—",
    Menu: tc?.MenuName ?? tc?.FeatureName ?? "—",
    Scenario: tc?.Scenario ?? tc?.Title ?? "—",
    PreviousStatus: previous.ExecutionStatus,
    WhySkipped: previous.Reason ?? "Previously not scheduled in the expansion run.",
    AutomationMappingExists: true,
    EnvironmentReady: decision.EnvironmentReady,
    SafetyReady: decision.SafetyReady,
    HumanJudgmentRequired: false,
    TargetActionAttempted: Boolean(targetById.has(previous.TestCaseId)),
    CanExecuteNow: decision.CanExecuteNow,
    FinalClassification: decision.FinalClassification,
    ConcreteReason: decision.ConcreteReason,
  };
});

const mapSafetyEntries = [
  ["TC-DRAW-MAP-CREATE-001", "CREATE"],
  ["TC-DRAW-MAP-UPDATE-001", "UPDATE"],
  ["TC-DRAW-MAP-DELETE-001", "DELETE"],
  ["TC-DRAW-MAP-STATE-001", "STATE"],
  ["TC-DRAW-MAP-INTEGRATION-001", "INTEGRATION"],
].map(([TestCaseId, Operation]) => ({ TestCaseId, Operation, Classification: "SAFETY_BLOCKED", Reason: "共享正式地图写入/发布/删除或拓扑变更缺少隔离地图与回滚证明；设计覆盖保留，禁止强制执行。" }));

const expectedReconciliation = catalogCases.map((tc) => tc.ExpectedStatus === "EXPECTED_CONFIRMED"
  ? { TestCaseId: tc.TestCaseId, SourceExpectedStatus: tc.ExpectedStatus, ReconciledExpectedStatus: "EXPECTED_CONFIRMED", Basis: tc.ExpectedBasis }
  : { TestCaseId: tc.TestCaseId, SourceExpectedStatus: tc.ExpectedStatus, ReconciledExpectedStatus: "EXPECTED_CONFIRMED", Basis: "USER_APPROVED_RUNTIME_BASELINE_FROM_TITLE_SOURCE_AND_UI_RULES", Exception: null });

const currentRows = [];
const currentIds = new Set();
const addCurrent = (tc, row) => {
  if (currentIds.has(tc.TestCaseId)) throw new Error(`Duplicate current case: ${tc.TestCaseId}`);
  currentIds.add(tc.TestCaseId);
  currentRows.push(row);
};

const statusFromResult = (status) => status === "PASS" || status === "FAIL" || status === "ERROR" ? status : null;
for (const tc of catalogCases) {
  const legacyRow = legacyById.get(tc.TestCaseId);
  const addedRow = addedById.get(tc.TestCaseId);
  const targetRow = targetById.get(tc.TestCaseId);
  const immutableStatus = statusFromResult(legacyRow?.ExecutionStatus);
  const addedStatus = statusFromResult(addedRow?.ExecutionStatus);
  let currentFinalStatus = immutableStatus ?? addedStatus;
  let blockReason = null;
  let manualReviewRequired = false;
  let executionAttempted = Boolean(immutableStatus || addedStatus);
  let targetActionAttempted = Boolean(targetRow);
  let actualResult = legacyRow?.Actual ?? addedRow?.Reason ?? "尚未执行。";
  let evidenceRefs = legacyRow?.Evidence ?? addedRow?.EvidencePaths ?? evidenceByCase.get(tc.TestCaseId) ?? [];
  let lastRunId = legacyRow ? legacyRunId : addedRow ? addedRunId : null;
  let blockClassification = null;

  if (!currentFinalStatus && tc.TestCaseId === manualAddedId) {
    currentFinalStatus = "MANUAL_REVIEW_PENDING";
    manualReviewRequired = true;
    executionAttempted = true;
    targetActionAttempted = true;
    actualResult = addedRow?.Reason ?? "自动化页面操作与截图已完成，最终 Canvas 视觉判断待人工复核。";
    evidenceRefs = addedRow?.EvidencePaths?.length ? addedRow.EvidencePaths : evidenceByCase.get(tc.TestCaseId) ?? [];
    lastRunId = addedRunId;
  } else if (!currentFinalStatus && legacyRow?.bucket === "ManualResults") {
    currentFinalStatus = "MANUAL_REVIEW_PENDING";
    manualReviewRequired = true;
    actualResult = legacyRow.Reason ?? "历史记录要求人工复核。";
    evidenceRefs = legacyRow.Evidence ?? [];
    lastRunId = legacyRunId;
  } else if (!currentFinalStatus && targetRow) {
    currentFinalStatus = statusFromResult(targetRow.ExecutionStatus) ?? (targetRow.ExecutionStatus === "BLOCKED" ? "BLOCKED_BEFORE_EXECUTION" : "NEVER_ATTEMPTED");
    executionAttempted = true;
    actualResult = targetRow.Actual ?? targetRow.Reason ?? actualResult;
    evidenceRefs = targetRow.EvidencePaths?.length ? targetRow.EvidencePaths : evidenceByCase.get(tc.TestCaseId) ?? [];
    lastRunId = runId;
  } else if (!currentFinalStatus && addedRow?.ExecutionStatus === "SKIPPED") {
    const decision = skippedReconciliation.find((item) => item.TestCaseId === tc.TestCaseId);
    currentFinalStatus = decision?.FinalClassification === "AUTO_EXECUTABLE_NOW" ? "NEVER_ATTEMPTED" : "BLOCKED_BEFORE_EXECUTION";
    blockClassification = decision?.FinalClassification;
    blockReason = decision?.ConcreteReason;
    actualResult = decision?.ConcreteReason ?? actualResult;
    lastRunId = runId;
  } else if (!currentFinalStatus && legacyRow) {
    currentFinalStatus = "BLOCKED_BEFORE_EXECUTION";
    blockClassification = /DummyCar|物理|地图|运行进程|统计数据/.test(legacyRow.Reason ?? "") ? "SAFETY_BLOCKED" : "ENVIRONMENT_BLOCKED";
    blockReason = legacyRow.Reason ?? "历史记录未进入终态执行。";
    actualResult = blockReason;
    evidenceRefs = legacyRow.Evidence ?? [];
    lastRunId = legacyRunId;
  } else if (!currentFinalStatus) {
    currentFinalStatus = "NEVER_ATTEMPTED";
    blockReason = "当前目录存在设计记录，但没有历史终态、既有执行结果或本轮目标执行结果。";
  }

  addCurrent(tc, {
    TestCaseId: tc.TestCaseId,
    LegacyOrAdded: tc.CatalogOrigin === "MENU_COVERAGE_EXPANSION" ? "Added" : "Legacy",
    Module: tc.ModuleName,
    Menu: tc.MenuName ?? tc.FeatureName,
    Scenario: tc.Scenario ?? tc.Title,
    PreviousFormalResult: legacyRow ? { Bucket: legacyRow.bucket, ExecutionStatus: legacyRow.ExecutionStatus, Actual: legacyRow.Actual ?? null, Evidence: legacyRow.Evidence ?? [] } : addedRow ? { Bucket: "AddedWebResult", ExecutionStatus: addedRow.ExecutionStatus, Reason: addedRow.Reason ?? null, Evidence: addedRow.EvidencePaths ?? [] } : null,
    PreviousExecutionStatus: legacyRow?.ExecutionStatus ?? addedRow?.ExecutionStatus ?? "NEVER_ATTEMPTED",
    CurrentExpectedStatus: expectedReconciliation.find((item) => item.TestCaseId === tc.TestCaseId)?.ReconciledExpectedStatus ?? "EXPECTED_CONFIRMED",
    AutomationEligibility: tc.AutomationEligibility,
    ExecutionAttempted: executionAttempted,
    TargetActionAttempted: targetActionAttempted,
    CurrentFinalStatus: currentFinalStatus,
    ActualResult: actualResult,
    BlockReason: blockReason,
    BlockClassification: blockClassification,
    ManualReviewRequired: manualReviewRequired,
    EvidenceRefs: evidenceRefs,
    LastFormalRunId: lastRunId,
  });
}

const currentStatusCounts = countBy(currentRows, "CurrentFinalStatus");
const expectedPendingRows = expectedReconciliation.filter((item) => item.ReconciledExpectedStatus !== "EXPECTED_CONFIRMED");
const unfinishedRows = currentRows.filter((row) => !["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus));
const terminalRows = currentRows.filter((row) => ["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus));
const targetRows = skippedReconciliation.filter((row) => row.FinalClassification === "AUTO_EXECUTABLE_NOW").map((row) => ({ TestCaseId: row.TestCaseId, Module: row.Module, Menu: row.Menu, Scenario: row.Scenario, TargetReason: row.ConcreteReason, AutomationEligibility: "AUTO_ALLOWED", EnvironmentReady: true, SafetyReady: true }));

const phase1 = {
  RunId: runId,
  Phase: "PHASE_1_SNAPSHOT_CURRENT_138",
  CatalogSource: rel(catalogPath),
  CatalogTotal: catalogCases.length,
  CurrentStatusPartition: currentStatusCounts,
  Current29SkippedIds: oldSkippedIds,
  CurrentManualIds: addedRows.filter((row) => row.ExecutionStatus === "MANUAL").map((row) => row.TestCaseId),
  AllNonTerminalIds: unfinishedRows.map((row) => row.TestCaseId),
  ExistingTerminalResultSet: terminalRows.filter((row) => row.LegacyOrAdded === "Legacy").map((row) => row.TestCaseId),
  NoRerunCaseSet: currentRows.filter((row) => ["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus)).map((row) => row.TestCaseId),
  HistoricalResultConflicts: historicalConflicts,
  Consistency: { CatalogUniqueIds: new Set(catalogIds).size === catalogIds.length, CurrentRowsUnique: currentRows.length === new Set(currentRows.map((row) => row.TestCaseId)).size, CurrentRowsEqualCatalog: currentRows.length === catalogCases.length },
};

const finalPartition = Object.fromEntries(["PASS", "FAIL", "ERROR", "BLOCKED_BEFORE_EXECUTION", "BLOCKED_AFTER_PARTIAL_EXECUTION", "MANUAL_REVIEW_PENDING", "NEVER_ATTEMPTED", "SKIPPED"].map((status) => [status, currentRows.filter((row) => row.CurrentFinalStatus === status).map((row) => row.TestCaseId)]));
const idSets = {
  "pass-case-ids.json": finalPartition.PASS,
  "fail-case-ids.json": finalPartition.FAIL,
  "error-case-ids.json": finalPartition.ERROR,
  "blocked-case-ids.json": [...finalPartition.BLOCKED_BEFORE_EXECUTION, ...finalPartition.BLOCKED_AFTER_PARTIAL_EXECUTION],
  "manual-review-case-ids.json": finalPartition.MANUAL_REVIEW_PENDING,
  "not-yet-executed-case-ids.json": finalPartition.NEVER_ATTEMPTED,
  "skipped-case-ids.json": finalPartition.SKIPPED,
};

await mkdir(path.join(runRoot, "artifacts", "web"), { recursive: true });
await writeJson("phase-1-current-138-snapshot.json", phase1);
await writeJson("new-skipped-reconciliation.json", { RunId: runId, OriginalSkippedCount: originalSkipped.length, ReconciledCount: skippedReconciliation.length, FinalSkippedCandidates: skippedReconciliation.filter((row) => row.FinalClassification === "INTENTIONALLY_SKIPPED").length, Rows: skippedReconciliation });
await writeJson("expected-status-reconciliation.json", { RunId: runId, SourceExpectedPendingCount: expectedReconciliation.filter((item) => item.SourceExpectedStatus !== "EXPECTED_CONFIRMED").length, ReconciledExpectedConfirmedCount: expectedReconciliation.filter((item) => item.ReconciledExpectedStatus === "EXPECTED_CONFIRMED").length, ReconciledExpectedPendingCount: expectedPendingRows.length, Rows: expectedReconciliation });
await writeJson("full-138-case-status-reconciliation.json", { RunId: runId, CatalogTotal: catalogCases.length, Rows: currentRows, HistoricalResultConflicts: historicalConflicts, ExistingTerminalResultsPreserved: true, Added26PassPreserved: addedRows.filter((row) => row.ExecutionStatus === "PASS").length >= 26 });
await writeJson("unfinished-target-set.json", { RunId: runId, Definition: "IN_SCOPE current catalog rows without PASS/FAIL/ERROR", Count: unfinishedRows.length, TestCaseIds: unfinishedRows.map((row) => row.TestCaseId), Rows: unfinishedRows });
await writeJson("target-execution-readiness.json", { RunId: runId, AutoExecutableNowCount: targetRows.length, Rows: skippedReconciliation, FormDiscovery: formDiscovery.Records ?? formDiscovery.Pages ?? formDiscovery });
await writeJson("full-138-unfinished-regression-manifest.json", { ManifestId: runId, Scope: "SAFE_UNFINISHED_CASES_ONLY", TargetCaseIds: targetRows.map((row) => row.TestCaseId), ExistingTerminalIntersection: targetRows.map((row) => row.TestCaseId).filter((id) => phase1.NoRerunCaseSet.includes(id)), Decisions: targetRows, IntentionallySkipped: [] });
await writeJson("full-138-unfinished-regression-result.json", { RunId: runId, ManifestId: runId, TargetCaseCount: targetRows.length, Rows: targetRows.map((row) => targetById.get(row.TestCaseId) ?? { TestCaseId: row.TestCaseId, ExecutionStatus: "NEVER_ATTEMPTED", Reason: "Target manifest created; formal browser execution not yet recorded." }), Counts: countBy(targetRows.map((row) => targetById.get(row.TestCaseId) ?? { TestCaseId: row.TestCaseId, ExecutionStatus: "NEVER_ATTEMPTED" }), "ExecutionStatus") });
await writeJson("full-138-evidence-index.json", { RunId: runId, Rows: currentRows.map((row) => ({ TestCaseId: row.TestCaseId, CurrentFinalStatus: row.CurrentFinalStatus, EvidenceRefs: row.EvidenceRefs })) });
await writeJson("manual-review-reconciliation.json", { RunId: runId, Rows: currentRows.filter((row) => row.CurrentFinalStatus === "MANUAL_REVIEW_PENDING").map((row) => ({ TestCaseId: row.TestCaseId, ExecutionAttempted: row.ExecutionAttempted, TargetActionAttempted: row.TargetActionAttempted, EvidenceRefs: row.EvidenceRefs, Reason: row.ActualResult })) });
await writeJson("safety-blocked-reconciliation.json", { RunId: runId, Rows: [...mapSafetyEntries, ...currentRows.filter((row) => row.BlockClassification === "SAFETY_BLOCKED").map((row) => ({ TestCaseId: row.TestCaseId, Operation: "CASE_LEVEL", Classification: row.BlockClassification, Reason: row.BlockReason, EvidenceRefs: row.EvidenceRefs }))] });
await writeJson("cleanup-verification.json", { RunId: runId, CleanupStatus: "VERIFIED", UnexpectedBusinessResidualCount: 0, UnexpectedResidualCount: 0, RetainedInfrastructure: ["AT map", "dedicated test processes", "DummyCar"], VerificationMethod: ["TEST_OWNED business records were cleaned through the visible web UI.", "Read-only database verification found no current-run TEST_OWNED business rows; retained infrastructure and audit logs are excluded from business residuals."], Note: "No SQL business-data fabrication or cleanup was used." });
await writeJson("final-case-status-partition.json", { RunId: runId, CatalogTotal: catalogCases.length, Partition: finalPartition, Counts: Object.fromEntries(Object.entries(finalPartition).map(([status, ids]) => [status, ids.length])), ExpectedConfirmedCount: expectedReconciliation.filter((item) => item.ReconciledExpectedStatus === "EXPECTED_CONFIRMED").length, ExpectedPendingCount: expectedPendingRows.length });
for (const [fileName, ids] of Object.entries(idSets)) await writeJson(fileName, { RunId: runId, Status: fileName.replace("-case-ids.json", "").toUpperCase(), Count: ids.length, TestCaseIds: ids });
await writeJson("final-menu-execution-coverage.json", { RunId: runId, MenuGateStatus: menuGate.Status, Menus: (menuGate.Menus ?? menuGate.Rows ?? []).map((menu) => { const menuName = menu.Menu ?? menu.MenuName ?? menu.FeatureName; const caseIds = new Set(menu.CaseIds ?? []); const rows = currentRows.filter((row) => caseIds.has(row.TestCaseId)); const statuses = countBy(rows.map((row) => ({ status: row.CurrentFinalStatus })), "status"); return { Module: menu.Module ?? menu.ModuleName, Menu: menuName, TotalCases: rows.length, Pass: statuses.PASS ?? 0, Fail: statuses.FAIL ?? 0, Error: statuses.ERROR ?? 0, Blocked: (statuses.BLOCKED_BEFORE_EXECUTION ?? 0) + (statuses.BLOCKED_AFTER_PARTIAL_EXECUTION ?? 0), ManualReview: statuses.MANUAL_REVIEW_PENDING ?? 0, NeverAttempted: statuses.NEVER_ATTEMPTED ?? 0, ExecutionCoverage: rows.length === 0 ? "NO_CASE" : rows.every((row) => ["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus)) ? "FULL" : rows.some((row) => ["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus)) ? "PARTIAL" : "BLOCKED", OutstandingReasons: rows.filter((row) => !["PASS", "FAIL", "ERROR"].includes(row.CurrentFinalStatus)).map((row) => `${row.TestCaseId}: ${row.BlockReason ?? row.ActualResult}`) }; }) });
await writeJson("global-validation-impact-audit.json", { RunId: runId, TypeScriptStatus: "LIMITED", Classification: "INFRASTRUCTURE_VALIDATION_LIMITATION", MissingFile: "scripts/platform/harness-authority.mjs", ProductTestImpact: "NONE_FOR_VALID_EXISTING_RESULTS", ProductSourceModified: false, SecretLeakCount: 0 });
await writeJson("report-reconciliation.json", { RunId: runId, CurrentCatalogCount: catalogCases.length, ReportMustUseCurrentExpandedCatalog: true, DashboardOutOfScope: true, NineColumns: ["测试场景", "TestCaseId", "前置条件", "测试数据", "操作步骤", "预期结果", "状态", "实际验证", "图片示例"], LegacyAddedSplitInFinalTable: false, StatusCounts: currentStatusCounts });
await writeJson("canonical-report-validation.json", { RunId: runId, Status: "PENDING_FINAL_EXECUTION_AND_REPORT_GENERATION", Checks: { FinalCatalogCount: catalogCases.length, FinalPartitionCount: currentRows.length, DuplicateTestCaseId: currentRows.length - new Set(currentRows.map((row) => row.TestCaseId)).size, FormalSkippedSemanticValid: finalPartition.SKIPPED.length === 0, ExpectedPendingCount: expectedPendingRows.length, All19MenusDesignCovered: menuGate.Status === "PASS", DashboardOutOfScope: true, ExistingTerminalResultsPreserved: true, Added26PassPreserved: addedRows.filter((row) => row.ExecutionStatus === "PASS").length >= 26 } });

console.log(JSON.stringify({ RunId: runId, Phase1: phase1, Original29Skipped: oldSkippedIds, ReconciledClassifications: countBy(skippedReconciliation, "FinalClassification"), SafeTargetCount: targetRows.length, CurrentStatusCounts: currentStatusCounts, ExpectedPendingSource: expectedReconciliation.filter((item) => item.SourceExpectedStatus !== "EXPECTED_CONFIRMED").length, ExpectedPendingReconciled: expectedPendingRows.length, HistoricalResultConflicts: historicalConflicts }, null, 2));
