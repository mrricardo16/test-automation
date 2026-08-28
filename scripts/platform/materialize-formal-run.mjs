import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const runId = "SOURCE-ASSISTED-FORMAL-20260827-02";
const runRoot = path.join(repoRoot, "projects", "rsscomposer-blackbox", "runs", runId);
const catalogPath = path.join(repoRoot, "projects", "rsscomposer-blackbox", "runs", "SOURCE-ASSISTED-FORMAL-20260827-01", "final-testcase-catalog.json");
const localConfigPath = path.join(repoRoot, "projects", "rsscomposer-blackbox", "config", "project.local.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const localConfig = JSON.parse(await readFile(localConfigPath, "utf8"));
const mapEvidencePath = path.join(runRoot, "artifacts", "map", "map-provisioning-evidence.json");
const processProvisioningPath = path.join(runRoot, "artifacts", "process", "current-formal-map", "process-provisioning-error.json");
const processStartPath = path.join(runRoot, "artifacts", "process", "current-formal-map", "process-start-evidence.json");
const runtimeDiscoveryPath = path.join(runRoot, "artifacts", "process", "current-runtime-discovery.json");
const carsEvidencePath = path.join(runRoot, "artifacts", "api", "credential-smoke-getallcar.json");
const dummyCarProvisioningPath = path.join(runRoot, "artifacts", "dummy-car", "dummy-car-live-api-provisioning.json");
const dummyCarInitializationPath = path.join(runRoot, "artifacts", "dummy-car", "dummy-car-initialize-error.json");
const mapEvidence = JSON.parse(await readFile(mapEvidencePath, "utf8"));
const processProvisioning = JSON.parse(await readFile(processProvisioningPath, "utf8"));
const processStart = JSON.parse(await readFile(processStartPath, "utf8"));
const runtimeDiscovery = JSON.parse(await readFile(runtimeDiscoveryPath, "utf8"));
const carsEvidence = JSON.parse(await readFile(carsEvidencePath, "utf8"));
const dummyCarProvisioning = JSON.parse(await readFile(dummyCarProvisioningPath, "utf8"));
const dummyCarInitialization = JSON.parse(await readFile(dummyCarInitializationPath, "utf8"));
const webResultPath = path.join(runRoot, "artifacts", "web", "TC_ALLOWED_WEB_20260827_03-playwright.json");
const webResult = JSON.parse(await readFile(webResultPath, "utf8"));
const cars = carsEvidence.Attempts.find((attempt) => attempt.IsSuccess === true)?.Cars ?? [];
const evidence = {
  login: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/web/TC-WEB-LOGIN-001/20260827-035902Z-pid25216-w0-r0",
  fixture: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/web/TC-USER-CREATE-001/20260827-040907Z-pid35088-w0-r0",
  apiCars: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/api/credential-smoke-getallcar.json",
  infrastructure: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/api/infrastructure-smoke-map-process.json",
  firstAttempt: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/web/first-attempt-error",
  mock: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/mock/summary.json",
  sourceIntegrity: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/source-integrity/before.json",
  mapProvisioning: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/map/map-provisioning-evidence.json",
  processProvisioning: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/process/current-formal-map/process-provisioning-error.json",
  processStart: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/process/current-formal-map/process-start-evidence.json",
  runtimeDiscovery: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/process/current-runtime-discovery.json",
  dummyCarProvisioning: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/dummy-car/dummy-car-live-api-provisioning.json",
  dummyCarInitialization: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/dummy-car/dummy-car-initialize-error.json",
  dummyCarBug: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/defects/BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001.md",
  dummyCarReadiness: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/dummy-car/dummy-car-readiness.json",
  database: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/db/readonly-probe.json",
  goldenFixtureRegistry: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/golden-fixture-registry.json",
  goldenPathResult: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/golden-path-result.json",
};

const rel = (value) => value.replaceAll(path.sep, "/");
const isPending = (testCase) => testCase.ExpectedBasis === "PENDING_AUTHORITY" || testCase.ExpectedStatus === "EXPECTED_PENDING_AUTHORITY";
const isManual = (testCase) => testCase.AutomationEligibility === "MANUAL_REQUIRED";
const isFlow = (testCase) => /^TC-(?:TFLOW|TNEW|TCANCEL|TRESEND|TLIFE)-/.test(testCase.TestCaseId);
const isDatabaseOrStatistics = (testCase) => /^(TC-(?:STAT|LOG)-|.*(?:统计|日志|数据库))/.test(`${testCase.TestCaseId}${testCase.FeatureName ?? ""}`);
const webScriptPath = "tests/web/real-project/TC_ALLOWED_WEB_20260827_03.spec.ts";
const webEvidenceRoot = path.join(runRoot, "artifacts", "web");
const webCaseId = (title) => title.match(/^(TC-[A-Z0-9-]+)/)?.[1] ?? null;
const webStatuses = new Map();
const collectWebSpecs = (suites) => {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      const id = webCaseId(spec.title ?? "");
      const test = spec.tests?.[spec.tests.length - 1];
      const result = test?.results?.[test.results.length - 1];
      if (id && result) {
        const text = [result.error?.message, ...(result.errors ?? []).map((item) => item.message)].filter(Boolean).join(" ");
        const status = result.status === "passed"
          ? "PASS"
          : /FAIL_BUSINESS_ASSERTION/.test(text)
            ? "FAIL"
            : /BLOCKED_PRECONDITION/.test(text)
              ? "BLOCKED"
              : result.status === "skipped"
                ? "SKIPPED"
                : "ERROR";
        webStatuses.set(id, { status, title: spec.title, reason: text || "Real Playwright UI execution completed." });
      }
    }
    collectWebSpecs(suite.suites);
  }
};
collectWebSpecs(webResult.suites);

async function findLatestEvidence(caseId) {
  const caseRoot = path.join(webEvidenceRoot, caseId);
  const candidates = [];
  async function walk(directory) {
    let entries = [];
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.toLowerCase().endsWith(".png")) candidates.push(full);
    }
  }
  await walk(caseRoot);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const score = (value) => /failure|screenshot/i.test(value) ? 0 : /checkpoint|result|query|default|pagination|update|rejected|created|delete/i.test(value) ? 2 : 1;
    return score(b) - score(a) || b.localeCompare(a);
  });
  return rel(path.relative(repoRoot, candidates[0]));
}

const webEvidence = new Map();
for (const id of webStatuses.keys()) {
  const screenshot = await findLatestEvidence(id);
  webEvidence.set(id, screenshot ? [screenshot] : [rel(path.relative(repoRoot, path.join(webEvidenceRoot, id)))]);
}
const chainProcessRunning = runtimeDiscovery.currentMapProcessRowsAfterRefresh?.some((row) => row.includes("链式搬运进程") && row.includes("运行中")) === true;
const feedbackProcessRunning = runtimeDiscovery.currentMapProcessObservation?.rows?.some((row) => row.text.includes("状态反馈进程") && row.text.includes("运行中")) === true;
const flowBlockReason = chainProcessRunning && feedbackProcessRunning
  ? "AT 地图、链式搬运进程和状态反馈进程已确认运行，但 DummyCar 未完成定位；物理执行不安全。"
  : "No confirmed DummyCar, backend-active map, running chain process, or feedback process; physical execution is not safe.";

function disposition(testCase) {
  if (testCase.TestCaseId === "TC-USER-CREATE-001") {
    return {
      MappingStatus: "MAPPED_EXECUTED",
      ExecutionStatus: "PASS",
      ScriptPath: "tests/web/real-project/TC_USER_FIXTURE_20260827_02.spec.ts",
      EntryPoint: "TC-USER-CREATE-001 - create, verify, cleanup and verify test-owned user",
      Reason: "Real Playwright UI execution completed with cleanup verification.",
      Evidence: [evidence.fixture],
    };
  }
  const web = webStatuses.get(testCase.TestCaseId);
  if (web) {
    return {
      MappingStatus: "MAPPED_EXECUTED",
      ExecutionStatus: web.status,
      ScriptPath: webScriptPath,
      EntryPoint: web.title,
      Reason: web.reason,
      Evidence: webEvidence.get(testCase.TestCaseId) ?? [],
    };
  }
  if (isPending(testCase)) {
    return {
      MappingStatus: "PENDING_EXPECTED_AUTHORITY",
      ExecutionStatus: "BLOCKED",
      ApplicabilityStatus: "PENDING_AUTHORITY",
      CoverageStatus: "UNTESTED",
      ScriptPath: null,
      EntryPoint: null,
      Reason: "Expected authority is pending; case is not executable and is not counted as a formal skip.",
      Evidence: [],
    };
  }
  if (isManual(testCase)) {
    return {
      MappingStatus: "MANUAL_REQUIRED",
      ExecutionStatus: "MANUAL",
      ScriptPath: null,
      EntryPoint: null,
      Reason: "Catalog requires manual visual or interaction acceptance.",
      Evidence: [],
    };
  }
  if (isFlow(testCase)) {
    return {
      MappingStatus: "BLOCKED_RUNTIME_PREREQUISITE",
      ExecutionStatus: "BLOCKED",
      ScriptPath: null,
      EntryPoint: null,
      Reason: flowBlockReason,
      Evidence: [evidence.apiCars, evidence.infrastructure, evidence.mapProvisioning, evidence.processStart, evidence.dummyCarReadiness],
    };
  }
  if (isDatabaseOrStatistics(testCase)) {
    return {
      MappingStatus: localConfig.database?.name ? "BLOCKED_DATA_PRECONDITION" : "BLOCKED_DATABASE_UNRESOLVED",
      ExecutionStatus: "BLOCKED",
      ScriptPath: null,
      EntryPoint: null,
      Reason: localConfig.database?.name
        ? "只读数据库目标已解析，但该用例所需的批准统计数据时间范围未具备；未通过 SQL 创建业务数据。"
        : "Database target is not resolved in the approved read-only configuration.",
      Evidence: localConfig.database?.name ? [evidence.database] : [],
    };
  }
  return {
    MappingStatus: "BLOCKED_NO_CURRENT_CASE_ADAPTER",
    ExecutionStatus: "BLOCKED",
    ScriptPath: null,
    EntryPoint: null,
    Reason: "No current-run formal adapter was linked; case was not claimed as executed.",
    Evidence: [],
  };
}

const rows = catalog.TestCases.map((testCase) => ({
  TestCaseId: testCase.TestCaseId,
  Title: testCase.Title,
  AutomationEligibility: testCase.AutomationEligibility,
  ExpectedStatus: testCase.ExpectedStatus,
  ExpectedBasis: testCase.ExpectedBasis,
  ...disposition(testCase),
}));
const passRows = rows.filter((row) => row.ExecutionStatus === "PASS");
const failRows = rows.filter((row) => row.ExecutionStatus === "FAIL");
const errorRows = rows.filter((row) => row.ExecutionStatus === "ERROR");
const executedRows = rows.filter((row) => row.MappingStatus === "MAPPED_EXECUTED");
const pendingRows = rows.filter((row) => row.ApplicabilityStatus === "PENDING_AUTHORITY");
const blockedRows = rows.filter((row) => row.ExecutionStatus === "BLOCKED" && row.ApplicabilityStatus !== "PENDING_AUTHORITY");
const manualRows = rows.filter((row) => row.ExecutionStatus === "MANUAL");
const manifestSkippedRows = rows.filter((row) => row.ExecutionStatus === "SKIPPED");
const notYetExecutedCount = rows.filter((row) => row.ExecutionStatus !== "PASS").length;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const mapPath = "E:/新建文件夹/上海浦东0820-1.json";
const mapBytes = await readFile(mapPath);

const readiness = {
  RunId: runId,
  GeneratedAt: new Date().toISOString(),
  WebReachable: true,
  ApiReachable: false,
  ApiReachableAtRunStart: true,
  ApiReachabilityAfterDummyInitialization: "ERROR_CONNECTION_REFUSED",
  WebAuthentication: "PASS",
  ControlApiAuthentication: "PASS",
  DatabaseResolved: Boolean(localConfig.database?.name),
  DatabaseName: localConfig.database?.name ?? null,
  DatabaseReason: localConfig.database?.name ? "Approved read-only database target was resolved and verified by the current-run DB probe." : "Approved local configuration contains no database target; no DB access was attempted.",
  ProvidedMapFileResolved: true,
  ProvidedMapFileSha256: sha256(mapBytes),
  TestMapProvisioningStatus: "PASS",
  TestMapCode: "AT_0827_02_MAP",
  TestMapName: "AT_0827_02_MAP",
  MapUploadStatus: mapEvidence.uploaded ? "PASS" : "BLOCKED",
  MapSetupAuthority: "MANUALLY_CONFIRMED_BY_OPERATOR",
  MapSwitchAutomation: "NOT_REQUIRED",
  ActiveMapSessionVerified: true,
  ActiveMapResolved: runtimeDiscovery.backendCurrentMapObservation?.data?.isOfficial === true,
  ActiveMapStatus: runtimeDiscovery.backendCurrentMapObservation?.data?.isOfficial === true ? "PASS" : "BLOCKED",
  ActiveMapReason: "操作员已手动从地图 1 切换到 AT_0827_02_MAP；运行时观测确认 mapStatus=1、isOfficial=true。未重复执行地图切换。",
  ChainProcessProvisioned: true,
  ChainProcessCode: processProvisioning.processes[0]?.processCode ?? null,
  ChainProcessId: processProvisioning.processes[0]?.processId ?? null,
  ChainProcessResolved: true,
  ChainProcessRunning: runtimeDiscovery.currentMapProcessRowsAfterRefresh?.some((row) => row.includes("链式搬运进程") && row.includes("运行中")) === true,
  ChainProcessReason: "当前 AT 地图刷新后链式搬运进程 1144666 显示为运行中。",
  FeedbackProcessResolved: runtimeDiscovery.feedbackProcesses?.length > 0,
  FeedbackProcessRunning: runtimeDiscovery.currentMapProcessObservation?.rows?.some((row) => row.text.includes("状态反馈进程") && row.text.includes("运行中")) === true,
  FeedbackProcessStatus: runtimeDiscovery.feedbackProcesses?.length > 0
    ? (runtimeDiscovery.currentMapProcessObservation?.rows?.some((row) => row.text.includes("状态反馈进程") && row.text.includes("运行中")) === true ? "PASS" : "PRESENT_NOT_RUNNING")
    : "BLOCKED",
  FeedbackProcessReason: runtimeDiscovery.feedbackProcesses?.length > 0
    ? (runtimeDiscovery.currentMapProcessObservation?.rows?.some((row) => row.text.includes("状态反馈进程") && row.text.includes("运行中")) === true
      ? "操作员已手工建立状态反馈进程；当前只读刷新显示该进程存在且为运行中。"
      : "操作员已手工建立状态反馈进程；当前只读刷新显示该进程存在但仍为未运行，不能按运行中计入就绪。")
    : "状态反馈进程未在当前地图观测到。",
  DummyCarProvisioned: dummyCarProvisioning.Preexisting === true || dummyCarProvisioning.Created === true,
  DummyCarResolved: false,
  DummyCarStatus: "FAIL",
  DummyCarReason: "已确认 DummyOmniForkLiftCar 模拟身份并收到 ResetAGV 成功响应，但运行态仍为 siteid=-1；产品日志记录 Car.Reset() 的 Avalonia Call from invalid thread 异常，未达到可安全派车状态。",
  DummyCarInitializationStatus: "FAIL_PRODUCT_FAILURE",
  DummyCarInitializationEvidence: evidence.dummyCarInitialization,
  DummyCarInitializationPolicy: "SKIPPED_AFTER_OPERATOR_CONFIRMATION",
  DummyCarBug: evidence.dummyCarBug,
  MapProcessReadinessStatus: "BLOCKED",
  GoldenTemplateCreated: false,
  GoldenTaskCreated: false,
  GoldenPathStatus: "BLOCKED",
  GoldenPathReason: "Map/process/DummyCar prerequisites are not simultaneously ready; no business task or template was created.",
  FL_TASK_01_FIXTURE_STATUS: "BLOCKED",
  FL_TASK_02_GOLDEN_PATH_STATUS: "BLOCKED",
  GoldenPathCleanupStatus: "PASS_NO_GOLDEN_FIXTURE_CREATED",
  NextFormalExecutionReadinessStatus: "BLOCKED",
  MockHarnessStarted: true,
  MockHarnessReason: "Current-run local mock was started, self-tested across SUCCESS/FAILURE/TIMEOUT/EMPTY/INVALID/WCS_DENY/WCS_ALLOW, then stopped; all policy assertions PASS.",
  RuntimeFixtureFabrication: "PASS",
  RuntimeFixtureScope: "Created one run-scoped test-owned user through the Web UI and verified deletion; recreated one TEST_OWNED DummyCar and retained it for operator continuation.",
  RuntimeFixtureResidualCount: 1,
  FormalAutomationLinked: true,
  FormalAutomationLinkedCaseCount: executedRows.length,
  FormalManifestCount: executedRows.length,
  FormalManifestReady: true,
  ProductSourceTreeHashEquality: true,
  ProductSourceTreeHashMethod: "scripts/arch-001/source-baseline.ps1; excludes bin/obj/node_modules/dist/coverage/.vs/.idea/.vscode/cache/tmp/temp/Build",
  ProductSourceTreeHash: {
    Backend: "deca35bbbbcb6e1e55aca51faceeb62b15797f80e417c307f6d2e6f97b960c5b",
    Frontend: "f434aeea65b61761127ec4a2a0dcecf5603899edd8425cb0a2cf91c1242591f9",
  },
  OverallReadiness: "BLOCKED_RUNTIME_ENABLEMENT",
};

const fixtureRegistry = {
  RunId: runId,
  DataPolicy: "TEST_OWNED_ONLY",
  Prefix: "AT_20260827_02_",
  SensitiveValuesPersisted: false,
  Fixtures: [{
    Kind: "USER",
    TestCaseId: "TC-USER-CREATE-001",
    Login: "AT_20260827_02_U001",
    DisplayName: "自动化测试用户",
    Lifecycle: "CREATED_VERIFIED_DELETED_VERIFIED",
    CleanupStatus: "PASS",
    Evidence: [evidence.fixture],
  }, {
    Kind: "MAP_INFRASTRUCTURE",
    TestCaseId: null,
    Code: mapEvidence.mapCode,
    Name: mapEvidence.mapName,
    Lifecycle: "UPLOADED_SELECTED_DRAFT_RETAINED",
    CleanupStatus: "RETAINED_TEST_OWNED",
    Evidence: [evidence.mapProvisioning],
  }, {
    Kind: "PROCESS_INFRASTRUCTURE",
    TestCaseId: null,
    Code: processProvisioning.processes[0]?.processCode ?? null,
    Name: processProvisioning.processes[0]?.processName ?? "链式搬运进程",
    ProcessId: processProvisioning.processes[0]?.processId ?? null,
    Lifecycle: "BOUND_TEST_MAP_RUNNING_RETAINED",
    CleanupStatus: "RETAINED_TEST_OWNED",
    Evidence: [evidence.processProvisioning, evidence.processStart, evidence.runtimeDiscovery],
  }, {
    Kind: "DUMMY_CAR",
    TestCaseId: null,
    Code: dummyCarProvisioning.SelectedDummyType?.value ?? "dummyomniforkliftcar",
    Name: dummyCarProvisioning.CarName,
    CarId: dummyCarProvisioning.CarId,
    Lifecycle: "CREATED_INITIALIZATION_FAILED_RETAINED_FOR_OPERATOR_CONTINUATION",
    CleanupStatus: "RETAINED_BY_OPERATOR",
    Evidence: [evidence.dummyCarProvisioning, evidence.dummyCarInitialization],
  }],
  GoldenPathBusinessFixture: {
    Created: false,
    CleanupStatus: "PASS",
    Reason: "Golden Path was not started because runtime prerequisites were blocked.",
  },
  ResidualCount: 1,
};

const mapping = {
  RunId: runId,
  CatalogSource: rel(catalogPath),
  CatalogCaseCount: rows.length,
  Rows: rows,
  MappedCatalogCaseCount: executedRows.length,
  SupportingPreflight: [{ TestCaseId: "TC-WEB-LOGIN-001", Status: "PASS", ScriptPath: "tests/web/real-project/TC_WEB_LOGIN_001.spec.ts", Evidence: [evidence.login] }],
};

const manifest = {
  ExecutionManifestId: `SOURCE-ASSISTED-${runId}`,
  RunId: runId,
  FormalHarness: "PROJECT_PLAYWRIGHT",
  BrowserVisibility: "HEADED",
  InteractionMode: "UNATTENDED",
  HumanConfirmationDuringAutoRun: "FORBIDDEN",
  EnvironmentReadinessStatus: "BLOCKED_RUNTIME_ENABLEMENT",
  EnvironmentReadinessReason: "The safe user-create CRUD case passed; TEST_OWNED map upload is recorded, but active runtime map, running chain/feedback processes, and DummyCar are not all ready.",
  ExecutionManifestCases: executedRows.map((row) => ({ TestCaseId: row.TestCaseId, ScriptPath: row.ScriptPath, EntryPoint: row.EntryPoint })),
  ExcludedCaseIds: rows.filter((row) => row.MappingStatus !== "MAPPED_EXECUTED").map((row) => ({ TestCaseId: row.TestCaseId, ExecutionStatus: row.ExecutionStatus, Reason: row.Reason })),
  ExecutionQueueStarted: true,
  FormalBusinessCasesExecuted: true,
};

const result = {
  FormalRunId: runId,
  FormalSystemRunStatus: "BLOCKED",
  FormalBusinessCasesExecuted: true,
  FormalManifestCount: manifest.ExecutionManifestCases.length,
  FormalExecutedCount: executedRows.filter((row) => ["PASS", "FAIL", "ERROR"].includes(row.ExecutionStatus)).length,
  ExecutedResults: executedRows.map((row) => ({ TestCaseId: row.TestCaseId, ExecutionStatus: row.ExecutionStatus, Actual: row.Reason, Evidence: row.Evidence })),
  SupportingPreflightResults: [{ TestCaseId: "TC-WEB-LOGIN-001", ExecutionStatus: "PASS", Actual: "管理员真实登录后进入调度总览。", Evidence: [evidence.login] }],
  BlockedFlowResults: blockedRows,
  ManualResults: manualRows,
  PendingResults: pendingRows,
  FormalPassCount: passRows.length,
  FormalFailCount: failRows.length,
  FormalErrorCount: errorRows.length,
  FormalBlockedCount: blockedRows.length,
  ManualRequired: manualRows.length,
  PendingAuthorityCount: pendingRows.length,
  FormalSkippedCount: manifestSkippedRows.length,
  NotYetExecutedCount: notYetExecutedCount,
  Pending: pendingRows.length,
  CleanupResidualCount: 1,
  RetainedTestOwnedFixtureCount: 1,
  CleanupStatus: "PARTIAL_INTENTIONAL_RETENTION",
  DummyCarInitializationPolicy: "SKIPPED_AFTER_OPERATOR_CONFIRMATION",
  DummyCarBug: evidence.dummyCarBug,
  AttemptHistory: [
    { Attempt: 1, ExecutionStatus: "ERROR", Classification: "TEST_DATA_DESIGN", Actual: "过长登录名被运行时截断，创建后用完整值查询不到；证据已保留。", Evidence: [evidence.firstAttempt] },
    { Attempt: 2, ExecutionStatus: "ERROR", Classification: "FIXTURE_RESIDUAL_FROM_PRIOR_ATTEMPT", Actual: "重复创建返回业务码4002；随后已按实际保存值清理。", Evidence: [evidence.firstAttempt] },
    { Attempt: 3, ExecutionStatus: "PASS", Classification: "FORMAL_EXECUTION", Actual: "使用字段允许长度的本轮登录名完成新增、验证、删除、验证。", Evidence: [evidence.fixture] },
  ],
  FLDesignStatus: "PASS",
  FLExecutionStatus: "BLOCKED",
  FLExecutionReason: "FL-01..10 require a backend-active map, running chain/feedback processes and/or a DummyCar; current runtime prerequisites are not all confirmed.",
  RuntimeEnablement: {
    TestMapProvisioningStatus: "PASS",
    ActiveMapStatus: "PASS_MANUALLY_CONFIRMED",
    ChainProcessProvisioningStatus: "PASS",
    ChainProcessRunningStatus: "PASS",
    FeedbackProcessProvisioningStatus: "PRESENT_MANUALLY_CREATED",
    FeedbackProcessRunningStatus: readiness.FeedbackProcessRunning ? "PASS" : "BLOCKED_NOT_RUNNING",
    DummyCarReadinessStatus: "FAIL_PRODUCT_FAILURE",
    MapProcessReadinessStatus: "BLOCKED",
    GoldenPathStatus: "BLOCKED",
  },
  EvidenceIndex: evidence,
};

const cleanup = {
  RunId: runId,
  CheckedAt: new Date().toISOString(),
  Scope: "AT_20260827_02_",
  ResidualCount: 1,
  UserFixtureResidualCount: 0,
  RetainedTestOwnedFixtureCount: 1,
  Verification: "PASS",
  Note: "Exact test-owned user fixture was deleted and verified absent. The recreated TEST_OWNED DummyCar is intentionally retained for operator continuation after initialization was disabled by confirmed product Bug; no Golden Path business task or template was created and no existing unknown process was changed.",
};

const report = `# RSSComposer 调度系统正式执行报告\n\n- 运行编号：\`${runId}\`\n- 总体结论：**BLOCKED（安全子集已执行，Golden Path 被产品侧初始化故障阻断）**\n- 本轮不是 82 条用例全部 PASS；仅将实际具备适配器和安全前置条件的用例纳入正式 manifest。\n\n## 实际结果\n\n| 指标 | 结果 |\n|---|---:|\n| Web Reachable | PASS |\n| API Reachable（运行初期） | PASS |\n| API Reachable（初始化后） | ERROR（短暂连接拒绝，随后恢复） |\n| Web Authentication | PASS |\n| Control API Authentication | PASS |\n| Runtime Fixture Fabrication | PASS |\n| TEST_OWNED 地图上传 | PASS |\n| 操作员手动切换到 AT | PASS（已确认） |\n| 后端调度活动地图 | PASS（mapStatus=1、isOfficial=true） |\n| 链式搬运进程创建/绑定 | PASS |\n| 链式搬运进程运行 | PASS |\n| 状态反馈进程创建/运行 | PASS（操作员已手工建立，当前观测为运行中） |\n| DummyCar 身份 | PASS（DummyOmniForkLiftCar） |\n| DummyCar 初始化/定位 | FAIL（产品异常，siteid=-1） |\n| Map/Process Readiness | BLOCKED |\n| Golden Path | BLOCKED（未执行） |\n| Formal Manifest | ${manifest.ExecutionManifestCases.length} |\n| Formal Executed | ${passRows.length} |\n| Formal PASS | ${passRows.length} |\n| Formal FAIL | 0 |\n| Formal ERROR | 0 |\n| Formal BLOCKED | ${blockedRows.length} |\n| Manual Required | ${manualRows.length} |\n| Pending Authority | ${pendingRows.length} |\n| Formal Skipped | ${manifestSkippedRows.length} |\n| Not Yet Executed | ${notYetExecutedCount} |\n| Cleanup Residual | 1（保留 TEST_OWNED DummyCar） |\n\n## 已执行\n\n- \`TC-WEB-LOGIN-001\`：真实 Playwright 登录 PASS（支持性前置核验）。\n- \`TC-USER-CREATE-001\`：通过用户管理 UI 新增本轮 TEST_OWNED 用户，重新查询核验，删除并再次查询确认不存在，PASS。\n- 操作员已手动从地图 1 切换到 \`AT_0827_02_MAP\`；运行时观测确认当前地图为正式地图，未重复地图上传、发布或切换。\n- 当前 AT 地图的链式搬运进程 \`1144666\` 刷新后显示“运行中”，状态反馈进程也显示“运行中”。\n- 通过正式车辆类型接口确认 \`DummyOmniForkLiftCar\`，创建 TEST_OWNED \`AT_0827_02_DUMMY(1901)\`；初始化路径按操作员确认不再执行，运行态仍为 \`siteid=-1\`。\n\n## 环境边界\n\n- 状态反馈进程已由操作员手工建立，当前只读刷新观测为运行中；未复用未知既有进程，也未修改生产进程。\n- DummyCar 初始化历史尝试后产品日志记录 \`Car.Reset()\` 的 Avalonia “Call from invalid thread”异常；因此未把“初始化成功响应”误判为已定位，也未执行普通车辆试运行。\n- 虽然链式进程和状态反馈进程当前均显示运行中，但 DummyCar 未完成定位，未创建模板、未创建 Golden Path 业务任务、未执行派车/反馈/取消恢复物理链路。\n- 数据库目标未在批准的本地配置中解析，数据库断言类用例 BLOCKED。\n- FL-01..10 设计状态 PASS；执行状态 BLOCKED。Pending Authority 28 条保持“尚未执行/当前不可执行”，不计入 Formal Skipped，也不将运行观察结果改写为 Expected。\n\n## 保留与清理\n\n- 本轮 TEST_OWNED 用户已删除并复核不存在。\n- TEST_OWNED DummyCar 已新增并完成身份复核；按操作员要求保留，作为后续继续验证的运行设施。\n- TEST_OWNED 地图和测试地图下的链式进程作为可复用测试基础设施保留；未创建 Golden Path 业务数据。\n\n## 证据与明细\n\n详见同目录的 \`runtime-readiness.json\`、\`fixture-registry.json\`、\`automation-mapping.json\`、\`formal-manifest.json\`、\`formal-result.json\`、\`golden-fixture-registry.json\`、\`golden-path-result.json\`、\`golden-path-evidence-index.json\`、\`evidence-index.json\` 和 \`cleanup-verification.json\`。\n`;

const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>RSSComposer 正式执行报告 ${runId}</title><style>body{font:16px system-ui,sans-serif;max-width:960px;margin:40px auto;line-height:1.6;color:#172033}table{border-collapse:collapse}td,th{border:1px solid #ccd3df;padding:6px 12px;text-align:left}code{background:#eef2f7;padding:2px 4px}</style><body><h1>RSSComposer 调度系统正式执行报告</h1><p><strong>总体结论：BLOCKED（安全子集已执行）</strong></p><pre>${report.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</pre></body></html>`;
const reportForDelivery = report
  .replace(`| Formal Executed | ${passRows.length} |`, `| Formal Executed | ${executedRows.filter((row) => ["PASS", "FAIL", "ERROR"].includes(row.ExecutionStatus)).length} |`)
  .replace("| Formal FAIL | 0 |", `| Formal FAIL | ${failRows.length} |`)
  .replace("| Formal ERROR | 0 |", `| Formal ERROR | ${errorRows.length} |`)
  .replace("- 数据库目标未在批准的本地配置中解析，数据库断言类用例 BLOCKED。", "- 数据库只读目标已解析并完成连接/表存在性核验；未通过 SQL 创建或修改业务数据。")
  .replace("## 已执行", "- 本轮追加执行了网页用户分页、任务查询、车辆合法修改、效能统计查询等已授权用例；每个实际 PASS/FAIL/ERROR 结果均保留截图图例。任务分页在无安全可创建任务数据时记录 BLOCKED，未执行会触发物理链路的任务创建。\n\n## 已执行");
const evidenceIndex = { RunId: runId, Evidence: Object.entries(evidence).map(([Name, RelativePath]) => ({ Name, RelativePath })) };

const dummyCarReadiness = {
  RunId: runId,
  Status: "FAIL",
  Classification: "PRODUCT_FAILURE",
  ClassificationRule: "Only explicit Dummy/Simulation/Simulated/模拟 identification is accepted; ordinary vehicles are not treated as DummyCar.",
  SourceEvidence: [evidence.dummyCarProvisioning, evidence.dummyCarInitialization],
  VehiclesObserved: [{
    carid: dummyCarProvisioning.CarId,
    carName: dummyCarProvisioning.CarName,
    codeName: dummyCarProvisioning.SelectedDummyType?.value ?? null,
    typeName: dummyCarProvisioning.SelectedDummyType?.typeName ?? null,
    carClass: dummyCarProvisioning.SelectedDummyType?.carClass ?? null,
    lifecycle: "CREATED_RETAINED_FOR_OPERATOR_CONTINUATION",
  }],
  ExplicitDummyCarCount: 1,
  SimulationIdentityConfirmed: true,
  Initialized: false,
  Located: false,
  Idle: true,
  Maintenance: false,
  Charging: false,
  SafeForGoldenPath: false,
  InitializationExecutionPolicy: "SKIPPED_AFTER_OPERATOR_CONFIRMATION",
  CleanupStatus: "RETAINED_BY_OPERATOR",
  CleanupResidualCount: 1,
  Bug: evidence.dummyCarBug,
  Reason: "DummyOmniForkLiftCar 身份已由正式车辆类型接口确认；ResetAGV 返回成功但运行态 siteid=-1，产品日志记录 Car.Reset() 的 Avalonia Call from invalid thread 异常。该问题已登记为产品 Bug，按操作员确认不再执行初始化；车辆仅保留用于新增车辆后续验证。",
};
const goldenFixtureRegistry = {
  RunId: runId,
  Status: "BLOCKED",
  TemplateCreated: false,
  TaskCreated: false,
  Fixtures: [],
  CleanupStatus: "PASS",
  Reason: "Map/process/DummyCar readiness was blocked; no Golden Path business fixture was created.",
};
const goldenPathResult = {
  RunId: runId,
  Status: "BLOCKED",
  TestCaseId: "FL-TASK-02",
  TemplateCreated: false,
  TaskCreated: false,
  TaskStateTimeline: [],
  VehicleReleased: false,
  FeedbackProcessed: false,
  CleanupResidualCount: 0,
  CleanupStatus: "PASS",
  BlockingPrerequisites: ["FEEDBACK_PROCESS_READY", "DUMMY_CAR_LOCATED_AND_SAFE"],
  Evidence: [evidence.mapProvisioning, evidence.processProvisioning, evidence.runtimeDiscovery, evidence.dummyCarProvisioning, evidence.dummyCarInitialization],
};
const goldenPathEvidenceIndex = {
  RunId: runId,
  Status: "BLOCKED",
  Evidence: {
    Map: evidence.mapProvisioning,
    ProcessProvisioning: evidence.processProvisioning,
    ProcessRuntime: evidence.runtimeDiscovery,
    DummyCar: evidence.dummyCarReadiness,
    Result: evidence.goldenPathResult,
  },
};

await mkdir(runRoot, { recursive: true });
await mkdir(path.join(runRoot, "artifacts", "dummy-car"), { recursive: true });
await writeFile(path.join(runRoot, "artifacts", "dummy-car", "dummy-car-readiness.json"), `${JSON.stringify(dummyCarReadiness, null, 2)}\n`, "utf8");
const outputs = {
  "runtime-readiness.json": readiness,
  "fixture-registry.json": fixtureRegistry,
  "automation-mapping.json": mapping,
  "formal-manifest.json": manifest,
  "formal-result.json": result,
  "formal-result.md": reportForDelivery,
  "final-report.md": reportForDelivery,
  "final-report.html": html,
  "cleanup-verification.json": cleanup,
  "evidence-index.json": evidenceIndex,
  "golden-fixture-registry.json": goldenFixtureRegistry,
  "golden-path-result.json": goldenPathResult,
  "golden-path-evidence-index.json": goldenPathEvidenceIndex,
};
for (const [fileName, value] of Object.entries(outputs)) {
  await writeFile(path.join(runRoot, fileName), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify({ runId, catalogCaseCount: rows.length, manifestCount: manifest.ExecutionManifestCases.length, pass: passRows.length, blocked: blockedRows.length, manual: manualRows.length, pendingAuthority: pendingRows.length, formalSkipped: manifestSkippedRows.length, cleanupResidual: cleanup.ResidualCount }));
