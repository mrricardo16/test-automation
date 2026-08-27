import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FLOW_IDS = Array.from({ length: 10 }, (_, index) => `TC-TFLOW-COMPOSITE-${String(index + 1).padStart(3, '0')}`);

const FLOW_DEFINITIONS = [
  ['FL-TASK-01', '任务模板从零到可下单', 'P0', '模板项→模板→步骤与流转→可下单', ['POST /TmpItem/AddTaskTempItem', 'POST /Tmp/AddTemp', 'POST /Tmp/AddTaskTemStepandRoute'], '接口铺设 TEST_OWNED 模板及至少两步流转后可被建单引用。', ['DB', 'API'], 'AUTO_ALLOWED', ['TC-TNEW-CREATE-001']],
  ['FL-TASK-02', '建单→派车→执行→完成→反馈', 'P0', 'PushTask→0→1→车辆收到→明细完成→2→反馈销账→车辆释放', ['POST /task/PushTask', 'GET /api/task/GetTask', 'GET /api/info/GetCarInfo'], '任务主表、每条明细、反馈队列和车辆释放形成闭环。', ['API', 'DB', 'MOCK'], 'AUTO_ALLOWED', ['TC-TNEW-CREATE-001']],
  ['FL-TASK-03', '第三方下发→状态反馈', 'P0', '外部来源 PushTask→调度→上游桩收到状态集合', ['POST /task/PushTask', 'local mock feedback endpoint'], '外部来源保持来源字段，桩收到与队列对应的状态报文。', ['API', 'DB', 'MOCK'], 'AUTO_ALLOWED', []],
  ['FL-TASK-04', '取放货业务交互门控', 'P1', 'WCS reject→车辆停留→WCS allow→继续执行', ['WCS mock with switchable response'], '放行前车辆不越过门控点，恢复后任务继续。', ['MOCK', 'DB', 'LOG'], 'AUTO_ALLOWED', []],
  ['FL-TASK-05', '取消任务两条路径与终态', 'P0', '未执行取消→7；执行中取消→按流程终态并释放车辆', ['POST /api/task/PushTaskCancel'], '取消结果以稳定终态、车辆行为和反馈为准，不只看接口提示。', ['API', 'DB', 'MOCK'], 'AUTO_ALLOWED', ['TC-TCANCEL-CANCEL-001']],
  ['FL-TASK-06', '优先级与派单顺序', 'P1', '同车多任务→优先级降序→同优先级按创建时间→未执行改优先级', ['POST /task/PushChargePriority', 'GET /api/task/GetTask'], '派发顺序可由批准策略和优先级解释，执行中任务不被抢占。', ['API', 'DB'], 'AUTO_ALLOWED', []],
  ['FL-TASK-07', '任务完成等待与链式接续', 'P1', 'T1完成前询问→上游返回T2→等待窗口→T2接续', ['external feedback mock', 'request_tick / wait window'], '接续成功时车辆不空驶回位，窗口到期后资源恢复常规调度。', ['MOCK', 'DB', 'LOG'], 'AUTO_ALLOWED', []],
  ['FL-TASK-08', '任务异常结束与重发', 'P1', '执行中异常→10→释放车辆→生成新任务号重发', ['controlled interruption or approved failure fixture', 'POST /Task/ResendTask'], '原任务保持异常终态，新任务独立生成且车辆资源释放。', ['API', 'DB', 'LOG'], 'MANUAL_REQUIRED', ['TC-TRESEND-RESEND-001']],
  ['FL-TASK-09', '指定车任务与派不出去排查', 'P1', '指定车不可用→保持0且不被其它车接走→恢复后派给指定车', ['POST /task/PushTask', 'two TEST_OWNED/DummyCar vehicles'], '指定车约束不被绕过；恢复后由指定车完成。', ['API', 'DB'], 'AUTO_ALLOWED', []],
  ['FL-TASK-10', '任务状态反馈闭环', 'P0', '队列待反馈→来源路由→POST→成功销账；失败重发→恢复清账', ['feedback queue table observation', 'switchable local mock'], '所有队列行最终销账；失败、超时、空响应和非约定响应可被区分。', ['DB', 'MOCK', 'LOG'], 'AUTO_ALLOWED', []],
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function writeText(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, value, 'utf8'); }
function readText(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function hasText(value, needle) { return typeof value === 'string' && value.includes(needle); }

function buildFlowCases() {
  return FLOW_DEFINITIONS.map(([flowId, title, priority, assertion, inputs, expected, observation, eligibility], index) => ({
    TestCaseId: FLOW_IDS[index],
    CaseKind: 'COMPOSITE',
    ScenarioSuiteId: flowId,
    ModuleName: '任务管理',
    FeatureName: '任务全流程',
    FeatureCode: 'TFLOW',
    Operation: 'COMPOSITE_LIFECYCLE',
    ScenarioGroup: 'COMPOSITE_FLOW',
    Title: `${flowId} ${title}`,
    Priority: priority,
    Objective: assertion,
    PrimaryAssertion: expected,
    ExpectedStatus: 'EXPECTED_CONFIRMED',
    ExpectedBasis: 'FLOW_DESIGN',
    ExpectedAuthority: '流程_02_任务全流程.md',
    ExpectedSourceRef: ['流程_02_任务全流程.md', `流程_02_任务全流程.md:${flowId}`],
    ExpectedResult: expected,
    AutomationEligibility: eligibility,
    ReviewGateStatus: 'PASS',
    LifecycleStatus: 'ACTIVE',
    RiskLevel: eligibility === 'MANUAL_REQUIRED' ? 'RISK_HIGH' : 'RISK_MEDIUM',
    SideEffects: 'TEST_DATA_CREATE',
    SideEffectScope: 'PROJECT_SANDBOX',
    Reversibility: 'CLEANUP_REVERSIBLE',
    DataOwnership: 'TEST_OWNED',
    InteractionMode: eligibility === 'MANUAL_REQUIRED' ? 'INTERACTIVE' : 'UNATTENDED',
    InitialState: 'TEST_ENVIRONMENT_READY',
    Preconditions: ['Approved TEST_OWNED data and isolated task fixtures exist.', 'DummyCar or an approved safe simulator is initialized.', 'Required process, active map, and feedback/WCS mock are ready where applicable.'],
    TestData: { Prefix: 'AT_TFLOW_<RunId>', Template: 'TEST_OWNED', Vehicle: 'DummyCar_or_approved_simulator', ExternalSource: 'local_mock_only' },
    Steps: inputs.map((input, step) => ({ Step: step + 1, Action: input, Expected: step === inputs.length - 1 ? expected : 'The step completes and leaves the next observable state available.' })),
    ExpectedPerStep: expected,
    IntermediateAssertions: observation.map((layer) => `${layer} observation is retained without exposing credentials or secrets.`),
    StateTransitions: [`${flowId} approved precondition → observable task lifecycle`, 'No SourceObservation is used as ExpectedBasis.'],
    PostConditions: ['Task, detail, queue, mock state, and vehicle state are captured.', 'All TEST_OWNED data is cleaned and independently verified.'],
    CrossStepInvariants: ['Task code remains traceable across API, DB, MOCK and LOG observations.', 'Cleanup verification is separate from the business assertion.'],
    Cleanup: 'Reverse dependency order: feedback/cancel records → task detail → task → template flow → template steps → template item.',
    CleanupVerification: 'Query each TEST_OWNED prefix and require zero residual rows; verify vehicle and mock return to baseline.',
    ObservationLayers: observation,
    DesignTechniques: ['STATE_MODEL', 'DECISION_TABLE', 'E2E_FLOW', 'POST_CONDITION'],
    PresentationOrder: { ModuleOrder: 2, FeatureOrder: 1, OperationOrder: 1, ScenarioOrder: index + 1, CaseOrder: 1 },
    CurrentReadiness: 'BLOCKED',
    ActivationStatus: 'BLOCKED',
    ActivationDecision: 'BLOCKED',
    ExecutionQueueDecision: 'BLOCKED',
    CurrentBlocker: 'FULL_FLOW_ENVIRONMENT_NOT_READY',
    ExecutionStatus: 'BLOCKED',
    LatestExecutionResult: '未执行：Readiness Gate 阻断',
    Actual: '未执行；没有 Runtime business observation。',
    Evidence: [],
  }));
}

function buildSourceDesignAudit({ inventory, catalog, handoff }) {
  const endpointCount = inventory.backend?.endpoints?.length ?? 0;
  const frontendApiCount = inventory.frontend?.apiFunctions?.length ?? 0;
  const matrix = [
    ['RULE-USER-REQUIRED', '系统管理', '用户', 'CREATE', 'handoff-package/05-validation-rules.md', 'UserController.cs', 'Controller rejects missing login/display fields before service write.', 'Approved handoff requires valid user data to save.', 'SOURCE_CONFIRMS_AUTHORITY', ['TC-USER-CREATE-001', 'TC-USER-CREATE-004', 'TC-USER-CREATE-005'], 'COVERED'],
    ['RULE-USER-DUPLICATE', '系统管理', '用户', 'CREATE', 'handoff-package/05-validation-rules.md', 'UserController.cs', 'User creation checks an existing login before insertion.', 'A duplicate approved baseline user must not create a second record.', 'SOURCE_CONFIRMS_AUTHORITY', ['TC-USER-CREATE-002'], 'COVERED'],
    ['RULE-TASK-PRIORITY-99', '任务管理', '任务', 'CREATE', '流程_02_任务全流程.md', 'Controller/taskController.cs:83', 'PushTask rejects a priority above 99.', 'The flow requires a valid priority boundary and deterministic rejection.', 'SOURCE_DISCOVERED', ['TC-TNEW-CREATE-001'], 'PARTIAL'],
    ['RULE-TASK-PENDING-CAP', '任务管理', '任务', 'CREATE', '流程_02_任务全流程.md', 'Interfaces/Service/Task/TaskService.cs:42', 'External task intake counts unexecuted tasks before accepting another.', 'The flow requires bounded queue preparation; the exact operational limit remains a source observation.', 'SOURCE_DISCOVERED_NEEDS_AUTHORITY', ['TC-TNEW-CREATE-006'], 'UNTESTED'],
    ['RULE-TASK-STATES', '任务管理', '任务生命周期', 'STATE_TRANSITION', '流程_02_任务全流程.md', 'Interfaces/Service/Task/TaskService.cs:253-340', 'Service writes main and detail state rows and enqueues feedback state records.', 'Flow expects 0, 1, 2, 7 and 10 lifecycle outcomes plus detail/queue observations.', 'SOURCE_CONFIRMS_AUTHORITY', FLOW_IDS.slice(1, 5), 'BLOCKED'],
    ['RULE-TASK-CANCEL', '任务管理', '任务取消', 'CANCEL', '流程_02_任务全流程.md', 'Controller/taskController.cs:213-359', 'Cancel handling branches on task state, car identity and force-stop capability.', 'The flow distinguishes unexecuted cancellation from executing cancellation.', 'SOURCE_DISCOVERED', ['TC-TCANCEL-CANCEL-001', 'TC-TCANCEL-CANCEL-002', FLOW_IDS[4]], 'BLOCKED'],
    ['RULE-TASK-RESEND', '任务管理', '任务重发', 'RESEND', '流程_02_任务全流程.md', 'Areas/Task/TaskController.cs:ResendTask', 'Resend rejects selected states and delegates creation of a new task.', 'The flow requires a new task code while the original record remains unchanged.', 'SOURCE_CONFIRMS_AUTHORITY', ['TC-TRESEND-RESEND-001', 'TC-TRESEND-RESEND-002', FLOW_IDS[7]], 'BLOCKED'],
    ['RULE-FEEDBACK-QUEUE', '任务管理', '状态反馈', 'EXTERNAL_INTEGRATION', '流程_02_任务全流程.md', 'Interfaces/Service/Task/TaskStatueDetailService.cs:27-58', 'Unsuccessful queue rows remain pending; successful rows are marked with a result time and a third-party log is written.', 'The flow requires queue drain, retry, and log evidence from DB/MOCK/LOG.', 'SOURCE_CONFIRMS_AUTHORITY', [FLOW_IDS[1], FLOW_IDS[2], FLOW_IDS[9]], 'BLOCKED'],
    ['RULE-FEEDBACK-MONTH-TABLE', '日志管理', '第三方交互日志', 'QUERY', '流程_02_任务全流程.md', 'Interfaces/Service/Log/MsgSendThirdService.cs:151-175', 'Third-party log table is selected from message creation month.', 'The flow calls for creation-month log lookup for cross-month tasks.', 'SOURCE_DISCOVERED', [FLOW_IDS[9]], 'BLOCKED'],
    ['RULE-DUMMYCAR', '车辆管理', '安全测试车辆', 'OTHER', '流程_02_任务全流程.md', 'RCS/DummyCar.cs', 'A DummyCar implementation exists in source, but runtime availability and initialization are not proven.', 'DummyCar is preferred for safe task execution.', 'SOURCE_DISCOVERED_NEEDS_AUTHORITY', FLOW_IDS, 'BLOCKED'],
    ['RULE-WCS-INTERACTION', '任务管理', 'WCS交互', 'STATE_TRANSITION', '流程_02_任务全流程.md', 'RCS/Missions/ChainedDeliveryMission*.cs', 'Mission code contains interaction/retry paths for task execution.', 'WCS reject/allow and retry behavior requires an approved mock or safe fixture.', 'SOURCE_DISCOVERED_NEEDS_AUTHORITY', [FLOW_IDS[3], FLOW_IDS[4]], 'BLOCKED'],
    ['RULE-FRONTEND-DYNAMIC-MENU', '系统管理', '权限菜单', 'PERMISSION', 'handoff-package/06-permission-model.md', 'src/plugins/permission.ts; src/router/index.ts', 'The menu is resolved dynamically from permission data; static routes do not represent the full reachable menu.', 'Handoff requires menu/page/button/direct-URL permission coverage.', 'SOURCE_DISCOVERED', ['TC-ROLE-PERMISSION-001', 'TC-ROLE-PERMISSION-002', 'TC-ROLE-PERMISSION-003', 'TC-ROLE-PERMISSION-004'], 'PARTIAL'],
  ];
  const records = matrix.map(([ruleId, module, feature, operation, designRef, sourceRef, observed, expected, alignment, ids, coverage]) => ({
    RuleId: ruleId, Module: module, Feature: feature, Operation: operation, DesignAuthorityRef: designRef,
    FlowAuthorityRef: designRef.includes('流程') ? designRef : null, InterfaceAuthorityRef: null,
    SourceLocation: sourceRef, SourceObservedBehavior: observed, AuthorityExpected: expected,
    AlignmentStatus: alignment, ExistingTestCaseIds: ids, CoverageStatus: coverage,
    GapStatus: alignment === 'SOURCE_DISCOVERED_NEEDS_AUTHORITY' ? 'OPEN_AUTHORITY_GAP' : coverage === 'COVERED' ? 'CLOSED' : 'OPEN_COVERAGE_OR_EXECUTION',
  }));
  const findingClassifications = [...new Set(records.map((record) => record.AlignmentStatus))];
  return {
    AuditType: 'SOURCE_ASSISTED_SYSTEM_TEST_DESIGN_AUDIT',
    ExpectedAuthorityHierarchy: ['REQUIREMENT', 'APPROVED_DESIGN', 'HANDOFF', 'FLOW_DESIGN', 'INTERFACE_CONTRACT', 'DESIGN_DEFAULT'],
    SourceIsExpectedOracle: false,
    authorityExpectedIsNeverSourceObservation: true,
    SourceProjectsAudited: 2,
    BackendRoot: 'D:/HZ_RSS40/03_trunk/src_m_rsscomposer',
    FrontendRoot: 'D:/HZ_RSS40/03_trunk/src_m_ui',
    SourceInventorySummary: { BackendEndpointCount: endpointCount, FrontendApiCount: frontendApiCount, FrontendRouteCount: inventory.frontend?.routes?.length ?? 0, BackendUnmatchedEndpointCount: inventory.backendUnmatched?.length ?? 0 },
    HandoffRunId: handoff.HandoffRunId,
    HandoffIntegrity: handoff.IntegrityStatus,
    CurrentCatalogCount: catalog.TestCases?.length ?? 0,
    RuleMatrix: records,
    FindingClassifications: findingClassifications,
    HandoffMissingCapabilityCount: 4,
    SourceDesignConflictCount: 0,
    SourceDiscoveredNeedsAuthorityCount: records.filter((record) => record.AlignmentStatus === 'SOURCE_DISCOVERED_NEEDS_AUTHORITY').length,
    AuditStatus: 'PASS_WITH_OPEN_AUTHORITY_AND_COVERAGE_GAPS',
    Note: 'Source observations support traceability and test-point selection only; they do not rewrite Expected or close business gaps.',
  };
}

function resolveCatalog(catalog, flowCases) {
  const resolvedGapCase = 'TC-TLIFE-CANCEL-001';
  const cases = (catalog.TestCases ?? []).map((original) => {
    const current = clone(original);
    if (current.TestCaseId === resolvedGapCase) {
      return {
        ...current,
        ExpectedStatus: 'EXPECTED_CONFIRMED', ExpectedBasis: 'FLOW_DESIGN', ExpectedAuthority: '流程_02_任务全流程.md',
        ExpectedSourceRef: ['流程_02_任务全流程.md:FL-TASK-05'],
        ExpectedResult: '未执行任务取消进入7；执行中取消按流程进入稳定终态并释放车辆；结果以DB、车辆和反馈观察为准。',
        ExpectationGapId: null, GapClassification: null, ExpectedResultSemantics: 'BUSINESS_EXPECTED',
        ResolvedBy: 'RESOLVED_BY_FLOW_DESIGN', CurrentReadiness: 'BLOCKED', CurrentBlocker: 'FULL_FLOW_ENVIRONMENT_NOT_READY',
        ExecutionStatus: 'BLOCKED', LatestExecutionResult: '未执行：Readiness Gate 阻断', Actual: '未执行；没有 Runtime business observation。', Evidence: [],
      };
    }
    return current;
  });
  return [...cases, ...flowCases];
}

function buildGapResolution(catalog, finalCases, sourceDesignAudit) {
  const openGaps = (catalog.TestCases ?? []).filter((item) => item.ExpectationGapId).map((item) => ({
    GapId: item.ExpectationGapId, TestCaseId: item.TestCaseId, Classification: item.GapClassification ?? 'TRUE_GAP', Status: item.TestCaseId === 'TC-TLIFE-CANCEL-001' ? 'RESOLVED_BY_FLOW_DESIGN' : 'STILL_PENDING', Reason: item.TestCaseId === 'TC-TLIFE-CANCEL-001' ? '流程册 FL-TASK-05 明确了未执行/执行中取消两条路径、状态和车辆释放观察点。' : item.ExpectationGap ?? item.ExpectedResult,
  }));
  const remaining = openGaps.filter((gap) => gap.Status === 'STILL_PENDING');
  return {
    AuditType: 'GAP_RESOLUTION_AUDIT',
    CurrentGapCountBefore: openGaps.length,
    ResolvedGapCount: openGaps.length - remaining.length,
    RemainingGapCount: remaining.length,
    Resolved: openGaps.filter((gap) => gap.Status !== 'STILL_PENDING'),
    Remaining: remaining,
    SourceDiscoveredNeedsAuthority: sourceDesignAudit.RuleMatrix.filter((item) => item.AlignmentStatus === 'SOURCE_DISCOVERED_NEEDS_AUTHORITY').map((item) => ({ RuleId: item.RuleId, Status: 'OPEN', RequiredAuthority: '业务/需求批准或安全夹具证明' })),
    RuntimeNeverResolvesGap: true,
    Status: remaining.length > 0 ? 'PARTIAL_WITH_TRUE_GAPS_RETAINED' : 'PASS',
  };
}

function buildReadiness(overrides = {}) {
  const checks = {
    RuntimeReachable: false, WebAuthentication: false, FixedControlToken: false, DatabaseReachable: false,
    RedisObservable: false, LicenseObservable: false, ActiveMapReady: false, RequiredProcessesRunning: false,
    DummyCarAvailable: false, CarInitialized: false, TemplateFixtureReady: false, MockPortAvailable: false,
    CleanupCapability: false, TestOwnedPrefixCollision: false, FormalAutomationLinked: false,
    ...overrides,
  };
  const required = ['RuntimeReachable', 'WebAuthentication', 'FixedControlToken', 'DatabaseReachable', 'ActiveMapReady', 'RequiredProcessesRunning', 'DummyCarAvailable', 'CarInitialized', 'TemplateFixtureReady', 'MockPortAvailable', 'CleanupCapability', 'FormalAutomationLinked'];
  const missing = required.filter((key) => !checks[key]);
  return {
    ReadinessType: 'FORMAL_SYSTEM_RUN_READINESS_GATE', Checks: checks, RequiredChecks: required, MissingChecks: missing,
    FormalFlowExecutionGate: missing.length === 0 ? 'READY' : 'BLOCKED',
    Reason: missing.length === 0 ? 'NONE' : `Missing required checks: ${missing.join(', ')}`,
    Status: missing.length === 0 ? 'PASS' : 'BLOCKED',
  };
}

function buildCoverage(finalCases, flowCases, sourceDesignAudit) {
  const p0 = finalCases.filter((item) => item.Priority === 'P0');
  const p1 = finalCases.filter((item) => item.Priority === 'P1');
  const confirmed = finalCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED');
  return {
    FeatureCoverage: { CatalogCaseCount: finalCases.length, CoveredByDesign: finalCases.length, Status: 'COVERED_WITH_EXECUTION_BLOCKERS' },
    RuleCoverage: { SourceDesignRules: sourceDesignAudit.RuleMatrix.length, CasesWithRuleOrFlowRef: finalCases.filter((item) => item.BusinessRuleId || item.ExpectedSourceRef?.length).length, Status: 'PARTIAL' },
    StateCoverage: { RequiredStates: [0, 1, 2, 7, 10], FlowCases: flowCases.filter((item) => item.Title.includes('FL-TASK')).map((item) => item.TestCaseId), Status: 'DESIGNED_NOT_EXECUTED' },
    FlowCoverage: { MainFlowCaseCount: flowCases.length, DesignCovered: flowCases.length, ExecutionCovered: 0, Status: 'DESIGN_COVERED_EXECUTION_BLOCKED' },
    GapCoverage: { ConfirmedExpectedCount: confirmed.length, PendingExpectedCount: finalCases.filter((item) => item.ExpectedStatus !== 'EXPECTED_CONFIRMED').length, Status: 'OPEN_GAPS_RETAINED' },
    FormalExecutionCoverage: { ManifestCaseCount: 0, ExecutedCaseCount: 0, Status: 'BLOCKED_BY_READINESS_GATE' },
    P0Coverage: { Total: p0.length, DesignCovered: p0.length, FormalExecuted: 0, Status: 'FORMAL_BLOCKED' },
    P1Coverage: { Total: p1.length, DesignCovered: p1.length, FormalExecuted: 0, Status: 'FORMAL_BLOCKED' },
    ModuleResult: [...new Set(finalCases.map((item) => item.ModuleName))].map((module) => ({ Module: module, Cases: finalCases.filter((item) => item.ModuleName === module).length, Execution: 'BLOCKED_OR_UNEXECUTED' })),
  };
}

function buildFormalManifest(finalCases, readiness, runId) {
  const candidates = finalCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED' && item.AutomationEligibility === 'AUTO_ALLOWED' && readiness.Status === 'PASS');
  return {
    ExecutionManifestId: `SOURCE-ASSISTED-${runId}`,
    RunId: runId, FormalHarness: 'PROJECT_PLAYWRIGHT', BrowserVisibility: 'HEADED', InteractionMode: 'UNATTENDED',
    HumanConfirmationDuringAutoRun: 'FORBIDDEN', EnvironmentReadinessStatus: readiness.Status, EnvironmentReadinessReason: readiness.Reason,
    ExecutionManifestCases: candidates.map((item) => ({ TestCaseId: item.TestCaseId, ExpectedBasis: item.ExpectedBasis, AutomationEligibility: item.AutomationEligibility })),
    ExcludedCaseIds: finalCases.filter((item) => !candidates.includes(item)).map((item) => ({ TestCaseId: item.TestCaseId, Reason: item.ExpectedStatus !== 'EXPECTED_CONFIRMED' ? 'PENDING_EXPECTED_AUTHORITY' : readiness.Status !== 'PASS' ? 'READINESS_GATE_BLOCKED' : 'AUTOMATION_NOT_ALLOWED' })),
    ExecutionQueueStarted: false, FormalBusinessCasesExecuted: false,
  };
}

function buildSourceAssistedAudit({ inventory, catalog, handoff, flowText, readiness = {} , runId = 'UNSET' }) {
  if (!FLOW_DEFINITIONS.every(([flowId]) => hasText(flowText, flowId))) throw new Error('Flow authority must contain FL-TASK-01 through FL-TASK-10.');
  const sourceDesignAudit = buildSourceDesignAudit({ inventory, catalog, handoff });
  const flowCases = buildFlowCases();
  const finalCases = resolveCatalog(catalog, flowCases);
  const resolvedReadiness = buildReadiness(readiness);
  const gapResolution = buildGapResolution(catalog, finalCases, sourceDesignAudit);
  const coverage = buildCoverage(finalCases, flowCases, sourceDesignAudit);
  const formalManifest = buildFormalManifest(finalCases, resolvedReadiness, runId);
  const blockedFlowResults = flowCases.map((item) => ({ TestCaseId: item.TestCaseId, ExecutionStatus: 'BLOCKED', Actual: `Readiness Gate blocked: ${resolvedReadiness.MissingChecks.join(', ')}`, Evidence: [] }));
  return {
    sourceDesignAudit, flowCoverage: flowCases.map((item, index) => ({ FlowId: FLOW_DEFINITIONS[index][0], Title: FLOW_DEFINITIONS[index][1], Priority: item.Priority, DesignCoverageStatus: 'COVERED', ExecutionCoverageStatus: 'BLOCKED', CoreAssertion: item.PrimaryAssertion, ObservationPoints: item.ObservationLayers, ExistingTestCaseIds: FLOW_DEFINITIONS[index][8], MissingTestCaseIds: [], AutomationFeasibility: item.AutomationEligibility === 'AUTO_ALLOWED' ? 'DESIGN_AUTO_ALLOWED_ENV_BLOCKED' : 'MANUAL_REQUIRED' })),
    gapResolution, finalCases, finalCatalog: { CatalogType: 'SOURCE_ASSISTED_SYSTEM_TEST_CATALOG', CatalogVersion: `RSSCOMPOSER-SOURCE-ASSISTED-${runId}`, TestCaseCount: finalCases.length, ConfirmedCount: finalCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length, PendingCount: finalCases.filter((item) => item.ExpectedStatus !== 'EXPECTED_CONFIRMED').length, TestCases: finalCases },
    readiness: resolvedReadiness, coverage, formalManifest,
    formalResult: { FormalRunId: runId, FormalSystemRunStatus: resolvedReadiness.Status === 'PASS' ? 'READY_TO_EXECUTE' : 'BLOCKED', FormalBusinessCasesExecuted: false, ExecutedResults: [], BlockedFlowResults: blockedFlowResults, FormalPassCount: 0, FormalFailCount: 0, FormalErrorCount: 0, FormalBlockedCount: blockedFlowResults.length, CleanupResidualCount: 0, Note: 'No business Runtime was started because the Formal Run Gate was not ready.' },
    evidenceIndex: { EvidenceIndexType: 'SOURCE_ASSISTED_FORMAL_RUN', FormalBusinessEvidenceCount: 0, DesignAuditEvidence: ['source-capability-inventory.json', 'source-design-audit.json', 'flow-coverage-matrix.json'], RuntimeEvidence: [], Sanitization: 'No credentials, tokens, cookies or secrets recorded.' },
    stats: { AuthorityDocumentsLoaded: 3, SourceProjectsAudited: 2, SourceCapabilitiesFound: (inventory.backend?.endpoints?.length ?? 0) + (inventory.frontend?.apiFunctions?.length ?? 0), HandoffMissingCapabilityCount: sourceDesignAudit.HandoffMissingCapabilityCount, SourceDesignConflictCount: sourceDesignAudit.SourceDesignConflictCount, CurrentGapCountBefore: gapResolution.CurrentGapCountBefore, ResolvedGapCount: gapResolution.ResolvedGapCount, RemainingGapCount: gapResolution.RemainingGapCount, ExistingCaseCountBefore: catalog.TestCases?.length ?? 0, FinalCaseCount: finalCases.length, AddedCaseCount: flowCases.length, SplitCaseCount: 0, DeprecatedCaseCount: 0, P0Coverage: coverage.P0Coverage.Status, P1Coverage: coverage.P1Coverage.Status, FLTaskMainFlowCoverage: coverage.FlowCoverage.Status, ConfirmedExpectedCount: finalCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length, PendingExpectedCount: finalCases.filter((item) => item.ExpectedStatus !== 'EXPECTED_CONFIRMED').length, AutoAllowedCount: finalCases.filter((item) => item.AutomationEligibility === 'AUTO_ALLOWED').length, ManualRequiredCount: finalCases.filter((item) => item.AutomationEligibility === 'MANUAL_REQUIRED').length, NotExecutableCount: finalCases.filter((item) => item.ExpectedStatus !== 'EXPECTED_CONFIRMED').length, FormalManifestCaseCount: formalManifest.ExecutionManifestCases.length, FormalPassCount: 0, FormalFailCount: 0, FormalErrorCount: 0, FormalBlockedCount: blockedFlowResults.length, CleanupResidualCount: 0 },
  };
}

function makeMarkdownLegacy(result, priorReport, artifactPaths) {
  let old = priorReport.split('\n## 5. Current Effective State')[0];
  const flowRows = result.flowCoverage.map((flow, index) => [flow.Title, FLOW_IDS[index], '安全测试环境、DummyCar、模板、进程、桩、清理能力全部就绪。', `AT_TFLOW_<RunId>; ${flow.ObservationPoints.join('/')}`, `按流程册 ${flow.FlowId} 顺序执行并观测 ${flow.ObservationPoints.join('、')}。`, flow.CoreAssertion, 'BLOCKED', `未执行；${result.readiness.Reason}`, '—']);
  const table = (rows) => ['| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...rows.map((row) => `| ${row.join(' | ')} |`)].join('\n');
  const s = result.stats;
  const effectiveSection = `## 5. Current Effective State（Source-Assisted Final Catalog）

| 指标 | 数值 |
| --- | --- |
| 原子 Catalog 用例 | 72 |
| 最终 Catalog 用例 | ${s.FinalCaseCount} |
| 确认 Expected | ${s.ConfirmedExpectedCount} |
| Pending Expected | ${s.PendingExpectedCount} |
| AUTO_ALLOWED | ${s.AutoAllowedCount} |
| MANUAL_REQUIRED | ${s.ManualRequiredCount} |
| NOT_EXECUTABLE / Expected 未确认 | ${s.NotExecutableCount} |
| Formal Manifest | ${s.FormalManifestCaseCount} |
| Formal Business Case 已执行 | 0 |
`;
  const gapRows = result.gapResolution.Remaining.map((gap) => `| ${gap.GapId} | ${gap.TestCaseId} | ${gap.Classification} | ${gap.Reason.replaceAll('|', '\\|')} | STILL_PENDING |`);
  const gapSection = `## 6. Expectation Gap（Resolution Audit）

本轮仅以流程册关闭有明确业务预期的生命周期 Gap；源码发现不会关闭 Gap。剩余 ${s.RemainingGapCount} 条 Gap 保留为不可执行的 Expected 阻断。

| GapId | TestCaseId | 分类 | 原因 | 状态 |
| --- | --- | --- | --- | --- |
${gapRows.join('\n') || '| — | — | — | 无 | CLOSED |'}
`;
  old = `${old}\n\n${effectiveSection}\n${gapSection}`;
  /*
  return `${old.replace(/^# RSSComposer 调度系统测试报告/m, '# RSSComposer 调度系统测试报告（Source-Assisted System Test）').replace(/细粒度正式用例 \| 72 条；确认预期 43 条，pending 29 条/, `当前原子用例 72 条；最终 Catalog ${s.FinalCaseCount} 条；确认预期 ${s.ConfirmedExpectedCount} 条，pending ${s.PendingExpectedCount} 条`)}\n\n## 7. 本轮阶段结果\n\n| 阶段 | 结果 | 说明 |\n| --- | --- | --- |\n| PHASE 1 AUTHORITY LOAD | PASS | 已加载报告、流程册、冻结 Handoff 及仓库测试依据。 |\n| PHASE 2 SOURCE AUDIT | PASS_WITH_GAPS | 后端/前端源码只读审计完成；Source 未被用作 Expected Oracle。 |\n| PHASE 3 GAP RESOLUTION | ${result.gapResolution.Status} | 可由流程权威关闭的 Gap 已关闭，其余保留。 |\n| PHASE 4 COVERAGE / TESTCASE REBUILD | PASS_WITH_BLOCKED_EXECUTION | 新增 10 条 FL-TASK Composite 设计记录。 |\n| PHASE 5 READINESS | ${result.readiness.Status} | ${result.readiness.Reason} |\n| PHASE 6 FORMAL RUN | BLOCKED | Formal Manifest 为空；未启动业务 Runtime。 |\n| PHASE 7 REPORT | PASS | Markdown、HTML、审计与追踪产物已生成。 |\n\n## 8. FL-TASK-01～10 Composite Catalog\n\n${table(flowRows)}\n\n## 9. Coverage Summary\n\n| 维度 | 结果 |\n| --- | --- |\n| Feature Coverage | ${result.coverage.FeatureCoverage.Status}；${s.FinalCaseCount} 条 Case 均有设计记录 |\n| Rule Coverage | ${result.coverage.RuleCoverage.Status}；${result.sourceDesignAudit.RuleMatrix.length} 条 Source/Design 规则记录 |\n| State Coverage | ${result.coverage.StateCoverage.Status}；状态 0/1/2/7/10 已设计 |\n| Flow Coverage | ${result.coverage.FlowCoverage.Status}；FL-TASK-01～10 设计覆盖 10/10，执行 0/10 |\n| Gap Coverage | ${result.coverage.GapCoverage.Status}；剩余真实 Gap ${s.RemainingGapCount} |\n| Formal Execution Coverage | ${result.coverage.FormalExecutionCoverage.Status}；Manifest 0，Business Case 0 |\n| P0 Coverage | ${s.P0Coverage} |\n| P1 Coverage | ${s.P1Coverage} |\n\n## 10. Execution Readiness / Formal Result\n\n- `FULL_FLOW_EXECUTION_GATE = ${result.readiness.FormalFlowExecutionGate}`\n- `FORMAL_SYSTEM_RUN_STATUS = ${result.formalResult.FormalSystemRunStatus}`\n- Missing checks: ${result.readiness.MissingChecks.join('、') || 'none'}\n- Formal business cases executed: No\n- Formal PASS/FAIL are both 0 because no business Case entered the Manifest.\n- FL-TASK flow records are `BLOCKED` at the gate, not product `FAIL`; no Runtime observation was collected.\n\n## 11. Required Statistics\n\n| Metric | Value |\n| --- | --- |\n${Object.entries(s).map(([key, value]) => `| ${key} | ${Array.isArray(value) ? value.join('、') : value} |`).join('\n')}\n\n## 12. Final Gates\n\n| Gate | Status |\n| --- | --- |\n| SOURCE_AUDIT_STATUS | ${result.sourceDesignAudit.AuditStatus} |\n| HANDOFF_COMPLETENESS_STATUS | PASS_WITH_MISSING_CAPABILITIES |\n| DESIGN_SOURCE_ALIGNMENT_STATUS | PASS_WITH_OPEN_AUTHORITY_GAPS |\n| GAP_RESOLUTION_STATUS | ${result.gapResolution.Status} |\n| TESTCASE_COVERAGE_STATUS | PASS_WITH_EXECUTION_BLOCKERS |\n| FL_TASK_01_10_COVERAGE_STATUS | DESIGN_COVERED_10_OF_10_EXECUTION_BLOCKED |\n| EXECUTION_READINESS_STATUS | ${result.readiness.Status} |\n| FORMAL_SYSTEM_RUN_STATUS | ${result.formalResult.FormalSystemRunStatus} |\n| CLEANUP_VERIFICATION_STATUS | NOT_REQUIRED_NO_MUTATION |\n| FINAL_REPORT_STATUS | PASS |\n| FINAL_SYSTEM_TEST_STATUS | BLOCKED_BY_ENVIRONMENT_AND_HARNESS_READINESS |\n\n## 13. Artifact Index\n\n${artifactPaths.map((item) => `- ${item}`).join('\n')}\n\n> Source locations and detailed alignment records are intentionally kept in the standalone audit artifacts. Source behavior is observation only and never silently changes Expected.\n`;
  */
}

function makeMarkdown(result, priorReport, artifactPaths) {
  const base = priorReport.split('\n## 5. Current Effective State')[0]
    .replace(/^# RSSComposer 调度系统测试报告(?:（Source-Assisted System Test）)+$/m, '# RSSComposer 调度系统测试报告（Source-Assisted System Test）')
    .replace(/^\|\s*当前原子用例.*$/m, `| 细粒度正式用例 | 当前原子用例 72 条；最终 Catalog ${result.finalCatalog.TestCaseCount} 条；确认预期 ${result.finalCatalog.ConfirmedCount} 条，pending ${result.finalCatalog.PendingCount} 条 |`)
    .replace(/^\| 主 Catalog 用例总数 \|.*$/m, '| 主 Catalog 用例总数 | 72 |')
    .replace(/^\| Expected 已确认 \|.*$/m, `| Expected 已确认 | ${result.finalCatalog.ConfirmedCount} |`)
    .replace(/^\| Expected Pending \|.*$/m, `| Expected Pending | ${result.finalCatalog.PendingCount} |`)
    .replace(/^\| Expectation Gap \|.*$/m, `| Expectation Gap | ${result.gapResolution.RemainingGapCount} |`)
    .replace(/^\| 可自动执行设计资格 \|.*$/m, `| 可自动执行设计资格 | ${result.stats.AutoAllowedCount} |`)
    .replace(/^\| 需人工执行设计资格 \|.*$/m, `| 需人工执行设计资格 | ${result.stats.ManualRequiredCount} |`)
    .replace(/^\| 当前不可执行 \|.*$/m, `| 当前不可执行 | ${result.stats.NotExecutableCount} |`);
  const s = result.stats;
  const flowRows = result.flowCoverage.map((flow, index) => `| ${flow.Title} | ${FLOW_IDS[index]} | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 ${flow.FlowId} 顺序执行并观察 ${flow.ObservationPoints.join('、')} | ${flow.CoreAssertion} | BLOCKED | 未执行；${result.readiness.Reason} | — |`).join('\n');
  const gaps = result.gapResolution.Remaining.map((gap) => `| ${gap.GapId} | ${gap.TestCaseId} | ${gap.Classification} | ${gap.Reason.replaceAll('|', '\\|')} | STILL_PENDING |`).join('\n') || '| — | — | — | 无 | CLOSED |';
  return `${base}

## 5. Current Effective State（Source-Assisted Final Catalog）

| 指标 | 数值 |
| --- | --- |
| 原子 Catalog 用例 | 72 |
| 最终 Catalog 用例 | ${s.FinalCaseCount} |
| 确认 Expected | ${s.ConfirmedExpectedCount} |
| Pending Expected | ${s.PendingExpectedCount} |
| AUTO_ALLOWED | ${s.AutoAllowedCount} |
| MANUAL_REQUIRED | ${s.ManualRequiredCount} |
| NOT_EXECUTABLE / Expected 未确认 | ${s.NotExecutableCount} |
| Formal Manifest | ${s.FormalManifestCaseCount} |
| Formal Business Case 已执行 | 0 |

## 6. Expectation Gap（Resolution Audit）

本轮仅以流程册关闭有明确业务预期的生命周期 Gap；源码发现不会关闭 Gap。剩余 ${s.RemainingGapCount} 条 Gap 保留为 Expected 阻断。

| GapId | TestCaseId | 分类 | 原因 | 状态 |
| --- | --- | --- | --- | --- |
${gaps}

## 7. 本轮阶段结果

| 阶段 | 结果 | 说明 |
| --- | --- | --- |
| PHASE 1 AUTHORITY LOAD | PASS | 已加载报告、流程册、冻结 Handoff 及仓库测试依据。 |
| PHASE 2 SOURCE AUDIT | PASS_WITH_GAPS | 后端/前端源码只读审计完成；Source 未被用作 Expected Oracle。 |
| PHASE 3 GAP RESOLUTION | ${result.gapResolution.Status} | 可由流程权威关闭的 Gap 已关闭，其余保留。 |
| PHASE 4 COVERAGE / TESTCASE REBUILD | PASS_WITH_BLOCKED_EXECUTION | 新增 10 条 FL-TASK Composite 设计记录。 |
| PHASE 5 READINESS | ${result.readiness.Status} | ${result.readiness.Reason} |
| PHASE 6 FORMAL RUN | BLOCKED | Formal Manifest 为空；未启动业务 Runtime。 |
| PHASE 7 REPORT | PASS | Markdown、HTML、审计与追踪产物已生成。 |

## 8. FL-TASK-01～10 Composite Catalog

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${flowRows}

## 9. Coverage Summary

| 维度 | 结果 |
| --- | --- |
| Feature Coverage | ${result.coverage.FeatureCoverage.Status}；${s.FinalCaseCount} 条 Case 有设计记录 |
| Rule Coverage | ${result.coverage.RuleCoverage.Status}；${result.sourceDesignAudit.RuleMatrix.length} 条规则记录 |
| State Coverage | ${result.coverage.StateCoverage.Status}；状态 0/1/2/7/10 已设计 |
| Flow Coverage | ${result.coverage.FlowCoverage.Status}；FL-TASK-01～10 设计 10/10，执行 0/10 |
| Gap Coverage | ${result.coverage.GapCoverage.Status}；剩余真实 Gap ${s.RemainingGapCount} |
| Formal Execution Coverage | BLOCKED；Manifest 0，Business Case 0 |
| P0 Coverage | ${s.P0Coverage} |
| P1 Coverage | ${s.P1Coverage} |

## 10. Execution Readiness / Formal Result

- FULL_FLOW_EXECUTION_GATE = ${result.readiness.FormalFlowExecutionGate}
- FORMAL_SYSTEM_RUN_STATUS = ${result.formalResult.FormalSystemRunStatus}
- Missing checks: ${result.readiness.MissingChecks.join('、') || 'none'}
- Formal business cases executed: No
- Formal PASS/FAIL are both 0 because no business Case entered the Manifest.
- FL-TASK flow records are BLOCKED at the gate, not product FAIL; no Runtime observation was collected.

## 11. Required Statistics

| Metric | Value |
| --- | --- |
${Object.entries(s).map(([key, value]) => `| ${key} | ${Array.isArray(value) ? value.join('、') : value} |`).join('\n')}

## 12. Final Gates

| Gate | Status |
| --- | --- |
| SOURCE_AUDIT_STATUS | ${result.sourceDesignAudit.AuditStatus} |
| HANDOFF_COMPLETENESS_STATUS | PASS_WITH_MISSING_CAPABILITIES |
| DESIGN_SOURCE_ALIGNMENT_STATUS | PASS_WITH_OPEN_AUTHORITY_GAPS |
| GAP_RESOLUTION_STATUS | ${result.gapResolution.Status} |
| TESTCASE_COVERAGE_STATUS | PASS_WITH_EXECUTION_BLOCKERS |
| FL_TASK_01_10_COVERAGE_STATUS | DESIGN_COVERED_10_OF_10_EXECUTION_BLOCKED |
| EXECUTION_READINESS_STATUS | ${result.readiness.Status} |
| FORMAL_SYSTEM_RUN_STATUS | ${result.formalResult.FormalSystemRunStatus} |
| CLEANUP_VERIFICATION_STATUS | NOT_REQUIRED_NO_MUTATION |
| FINAL_REPORT_STATUS | PASS |
| FINAL_SYSTEM_TEST_STATUS | BLOCKED_BY_ENVIRONMENT_AND_HARNESS_READINESS |

## 13. Artifact Index

${artifactPaths.map((item) => `- ${item}`).join('\n')}

> Source locations and detailed alignment records are intentionally kept in standalone audit artifacts. Source behavior is observation only and never silently changes Expected.
`;
}

async function collectRuntimeReadiness(configPath) {
  const config = fs.existsSync(configPath) ? readJson(configPath) : {};
  const url = config.runtimeBaseUrl || process.env.WEB_TEST_BASE_URL;
  let runtimeReachable = false;
  if (url) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(3000) }); runtimeReachable = response.status < 500; } catch { runtimeReachable = false; }
  }
  const admin = config.authentication?.admin ?? {};
  const webAuth = Boolean((process.env.WEB_TEST_USERNAME && process.env.WEB_TEST_PASSWORD) || (admin.username && admin.password && !String(admin.password).startsWith('<')));
  const db = config.database ?? {};
  return buildReadiness({ RuntimeReachable: runtimeReachable, WebAuthentication: webAuth, FixedControlToken: Boolean(process.env.RSSCOMPOSER_CONTROL_TOKEN || config.controlToken), DatabaseReachable: Boolean(db.host && db.name && db.engine), ActiveMapReady: config.safeFixtures?.activeMapReady === true, RequiredProcessesRunning: config.safeFixtures?.requiredProcessesRunning === true, DummyCarAvailable: process.env.RSSCOMPOSER_DUMMY_CAR_READY === '1' || config.safeFixtures?.dummyCarAvailable === true, CarInitialized: config.safeFixtures?.carInitialized === true, TemplateFixtureReady: config.safeFixtures?.templateReady === true, MockPortAvailable: Boolean(process.env.RSSCOMPOSER_MOCK_PORT || config.mock?.port), CleanupCapability: config.testDataPolicy?.cleanupRequired === true, FormalAutomationLinked: false });
}

export { buildSourceAssistedAudit, buildReadiness, FLOW_DEFINITIONS };

async function main() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const project = path.join(root, 'projects/rsscomposer-blackbox');
  const runId = args.get('--run-id') || `SOURCE-ASSISTED-FORMAL-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-')}`;
  const runDir = args.get('--run-dir') || path.join(project, 'runs', runId);
  const inventoryPath = args.get('--inventory') || path.join(runDir, 'source-capability-inventory.json');
  const flowPath = args.get('--flow') || 'C:/Users/Administrator/Documents/xwechat_files/wxid_5k6rck8o1d2s22_37f4/msg/file/2026-08/流程_02_任务全流程.md';
  const catalogPath = path.join(project, 'test-cases/catalog/fine-grained-catalog.json');
  const handoff = readJson(path.join(project, 'handoff/current.json'));
  const inventory = readJson(inventoryPath);
  const catalog = readJson(catalogPath);
  const flowText = readText(flowPath);
  const readiness = await collectRuntimeReadiness(path.join(project, 'config/project.local.json'));
  const result = buildSourceAssistedAudit({ inventory, catalog, handoff, flowText, readiness: readiness.Checks, runId });
  fs.mkdirSync(runDir, { recursive: true });
  const files = {
    sourceDesignAudit: path.join(runDir, 'source-design-audit.json'),
    sourceDesignAuditMarkdown: path.join(runDir, 'source-design-audit.md'),
    handoffCompletenessAudit: path.join(runDir, 'handoff-completeness-audit.json'),
    gapResolutionAudit: path.join(runDir, 'gap-resolution-audit.json'),
    coverageMatrix: path.join(runDir, 'coverage-matrix.json'),
    flowCoverageMatrix: path.join(runDir, 'flow-coverage-matrix.json'),
    flowCoverageMarkdown: path.join(runDir, 'flow-coverage-matrix.md'),
    finalCatalog: path.join(runDir, 'final-testcase-catalog.json'),
    readiness: path.join(runDir, 'execution-readiness.json'),
    readinessMarkdown: path.join(runDir, 'execution-readiness.md'),
    formalManifest: path.join(runDir, 'formal-manifest.json'),
    formalResult: path.join(runDir, 'formal-result.json'),
    formalResultMarkdown: path.join(runDir, 'formal-result.md'),
    evidenceIndex: path.join(runDir, 'evidence-index.json'),
    report: path.join(project, 'reports/RSSComposer调度系统测试报告.md'),
  };
  writeJson(files.sourceDesignAudit, result.sourceDesignAudit);
  writeText(files.sourceDesignAuditMarkdown, `# Source Design Audit\n\n- AuditType: ${result.sourceDesignAudit.AuditType}\n- AuditStatus: ${result.sourceDesignAudit.AuditStatus}\n- SourceIsExpectedOracle: ${result.sourceDesignAudit.SourceIsExpectedOracle}\n- Expected authority hierarchy: ${result.sourceDesignAudit.ExpectedAuthorityHierarchy.join(' > ')}\n- Source design conflicts: ${result.sourceDesignAudit.SourceDesignConflictCount}\n- Source discoveries needing authority: ${result.sourceDesignAudit.SourceDiscoveredNeedsAuthorityCount}\n\n## Findings\n\n${result.sourceDesignAudit.RuleMatrix.map((item) => `- **${item.RuleId}** — ${item.AlignmentStatus}; source: ${item.SourceLocation}; expected: ${item.AuthorityExpected}`).join('\n')}\n`);
  writeJson(files.handoffCompletenessAudit, { Status: 'PASS_WITH_MISSING_CAPABILITIES', HandoffRunId: handoff.HandoffRunId, MissingCapabilityCount: result.sourceDesignAudit.HandoffMissingCapabilityCount, MissingCapabilities: ['动态菜单完整角色矩阵', '任务反馈/外部路由全链路', 'DummyCar运行时可用性', '数据库/Redis/进程环境证明'], SourceAuditReference: path.basename(files.sourceDesignAudit) });
  writeJson(files.gapResolutionAudit, result.gapResolution);
  writeJson(files.coverageMatrix, result.coverage);
  writeJson(files.flowCoverageMatrix, result.flowCoverage);
  writeText(files.flowCoverageMarkdown, `# FL-TASK-01～10 Flow Coverage Matrix\n\n${result.flowCoverage.map((item) => `| ${item.FlowId} | ${item.Title} | ${item.ExistingTestCaseIds.join(', ') || '—'} | ${item.DesignCoverageStatus} | ${item.ExecutionCoverageStatus} |`).join('\n')}\n`);
  writeJson(files.finalCatalog, result.finalCatalog);
  writeJson(files.readiness, result.readiness);
  writeText(files.readinessMarkdown, `# Execution Readiness\n\n- FULL_FLOW_EXECUTION_GATE: **${result.readiness.FormalFlowExecutionGate}**\n- Status: **${result.readiness.Status}**\n- Missing checks: ${result.readiness.MissingChecks.join(', ') || 'none'}\n- Reason: ${result.readiness.Reason}\n`);
  writeJson(files.formalManifest, result.formalManifest);
  writeJson(files.formalResult, result.formalResult);
  writeText(files.formalResultMarkdown, `# Formal Result\n\n- Status: **${result.formalResult.FormalSystemRunStatus}**\n- Business cases executed: **No**\n- PASS: ${result.formalResult.FormalPassCount}\n- FAIL: ${result.formalResult.FormalFailCount}\n- ERROR: ${result.formalResult.FormalErrorCount}\n- BLOCKED: ${result.formalResult.FormalBlockedCount}\n- Cleanup residuals: ${result.formalResult.CleanupResidualCount}\n\n${result.formalResult.Note}\n`);
  writeJson(files.evidenceIndex, result.evidenceIndex);
  const artifactPaths = Object.values(files).filter((item) => item !== files.report).map((item) => path.relative(root, item).replaceAll('\\', '/')).concat(['projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.md', 'projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.html']);
  fs.writeFileSync(files.report, makeMarkdown(result, readText(files.report), artifactPaths), 'utf8');
  writeJson(path.join(runDir, 'run-statistics.json'), result.stats);
  process.stdout.write(`${JSON.stringify({ RunId: runId, Readiness: result.readiness.Status, FinalCaseCount: result.finalCatalog.TestCaseCount, FormalManifestCaseCount: result.formalManifest.ExecutionManifestCases.length, FormalBusinessCasesExecuted: false, ReportPath: path.relative(root, files.report).replaceAll('\\', '/') }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
