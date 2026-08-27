import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEffectiveProjectCases, projectGenerationMetrics } from './apply-generic-blackbox-policy.mjs';
import { currentId, FEATURE_CODE_REGISTRY_PATH, MIGRATION_MAP_PATH, MIGRATION_RECONCILIATION_PATH, TESTCASE_ID_REGISTRY_PATH, repositoryDirectory } from './stable-testcase-id.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectDirectory = path.resolve(scriptDirectory, '..');
export const catalogDirectory = path.join(projectDirectory, 'test-cases', 'catalog');
export const sourcePath = path.join(projectDirectory, 'outputs', 'blackbox-testcase-generation-standard-rebuild', '黑盒细粒度测试用例.json');
export const formalCatalogPath = path.join(catalogDirectory, 'fine-grained-catalog.json');
export const historicalTraceabilityPath = path.join(catalogDirectory, 'historical-traceability.json');
export const currentEffectiveStatePath = path.join(catalogDirectory, 'current-effective-state.json');
export const reconciliationPath = path.join(catalogDirectory, 'MATERIALIZATION_RECONCILIATION.json');
export const reportPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.md');
export const genericStandardPath = path.resolve(projectDirectory, '..', '..', 'contracts', 'generic-blackbox-testcase-generation-standard.md');
export const genericReportTemplatePath = path.resolve(projectDirectory, '..', '..', 'docs', 'generic-blackbox-test-report-template.md');
export const genericTyporaStylePath = path.resolve(projectDirectory, '..', '..', 'docs', 'generic-typora-report.css');

const runDirectory = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308');
const legacyCatalogPath = path.join(runDirectory, '模块化测试用例目录.json');
const handoffCurrentPath = path.join(projectDirectory, 'handoff', 'current.json');
const catalogVersion = 'RSSCOMPOSER-BLACKBOX-FINE-GRAINED-CATALOG-V1';
const generationStandardVersion = 'TESTCASE-GENERATION-STANDARD-V2';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function relative(filePath) {
  return path.relative(projectDirectory, filePath).split(path.sep).join('/');
}

function loadHistoricalExecution() {
  const sources = [
    [path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-081216Z', 'final-case-results.json'), 'Results'],
    [path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-A.json'), 'Single'],
    [path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-B.json'), 'Single'],
    [path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-011-C.json'), 'Single'],
  ];
  const result = new Map();
  for (const [filePath, type] of sources) {
    if (!fs.existsSync(filePath)) continue;
    const source = readJson(filePath);
    const items = type === 'Results' ? source.Results : [source];
    for (const item of items) {
      result.set(item.TestCaseId, {
        ...item,
        FormalRunId: source.FormalRunId ?? 'FAST-BB-REAL-20260825-065833Z',
        GeneratedFrom: relative(filePath),
      });
    }
  }
  return result;
}

function loadEffectiveSource() {
  const raw = readJson(sourcePath);
  const TestCases = buildEffectiveProjectCases(raw.TestCases);
  return { ...raw, TestCases, GenericPolicyApplied: true, GenericPolicyPath: relative(genericStandardPath) };
}

function historicalRefs(testCase) {
  const feature = testCase.FeatureName ?? '';
  const title = testCase.Title ?? '';
  if (title === '用户新增-合法数据创建成功') return ['TC-BB-REAL-002-A', 'TC-BB-REAL-002-C'];
  if (/用户新增-(?:用户名重复|密码低于|用户名为空|显示名为空)|用户状态|用户删除/.test(title)) return ['TC-BB-REAL-002-B'];
  if (/用户查询|用户修改/.test(title)) return ['TC-BB-REAL-002-C'];
  if (/用户角色关系|角色关联/.test(`${feature} ${title}`)) return ['TC-BB-REAL-003-C'];
  if (title === '任务新增-合法依赖创建成功') return ['TC-BB-REAL-004-A', 'TC-BB-REAL-004-C'];
  if (/任务新增/.test(title)) return ['TC-BB-REAL-004-B'];
  if (/任务查询|任务生命周期/.test(testCase.Title)) return ['TC-BB-REAL-004-C'];
  if (/任务状态-取消|任务取消/.test(`${feature} ${title}`)) return [title.includes('禁止') ? 'TC-BB-REAL-005-B' : 'TC-BB-REAL-005-A'];
  if (/任务状态-重发|任务重发/.test(`${feature} ${title}`)) return [title.includes('禁止') ? 'TC-BB-REAL-006-B' : 'TC-BB-REAL-006-A'];
  if (feature === '车辆管理' && title === '车辆新增-合法车辆') return ['TC-BB-REAL-008-A'];
  if (feature === '车辆管理') return [/重复|非法|为空|边界/.test(title) ? 'TC-BB-REAL-008-B' : 'TC-BB-REAL-008-A'];
  if (feature === '监控看板') return ['TC-BB-REAL-009-M'];
  if (feature === '日志下载') return ['TC-BB-REAL-010-M'];
  if (feature === '统计查询' && title === '统计查询-合法时间范围有数据') return ['TC-BB-REAL-011-A'];
  if (feature === '统计查询' && title === '统计查询-合法时间范围无数据') return ['TC-BB-REAL-011-B'];
  if (feature === '统计查询' || /统计查询/.test(title)) return [/非法|缺少|晚于|超出/.test(title) ? 'TC-BB-REAL-011-C' : 'TC-BB-REAL-011-A'];
  return [];
}

function effectiveEligibility(testCase) {
  if (testCase.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY') return '当前不可执行';
  if (testCase.AutomationEligibility === 'AUTO_ALLOWED') return '可自动执行';
  if (testCase.AutomationEligibility === 'MANUAL_REQUIRED') return '需人工执行';
  return '当前不可执行';
}

function countReportCases(content, headingStart, headingEnd, pattern) {
  const start = content.indexOf(headingStart);
  const end = content.indexOf(headingEnd);
  if (start < 0 || end <= start) return 0;
  return [...content.slice(start, end).matchAll(pattern)].length;
}

export function writeMaterializationReconciliation({ catalog, history, state }) {
  const source = loadEffectiveSource();
  const sourceIds = source.TestCases.map((item) => item.TestCaseId);
  const materializedIds = catalog.TestCases.map((item) => item.TestCaseId);
  const report = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf8') : '';
  const missingIds = sourceIds.filter((id) => !materializedIds.includes(id));
  const unexpectedIds = materializedIds.filter((id) => !sourceIds.includes(id));
  const reconciliation = {
    ReconciliationType: 'MATERIALIZATION_RECONCILIATION',
    CatalogVersion: catalog.CatalogVersion,
    MaterializedAt: catalog.MaterializedAt,
    TestCaseIdStandardPath: relative(path.join(repositoryDirectory, 'contracts', 'generic-stable-testcase-id-standard.md')),
    FeatureCodeRegistryPath: relative(FEATURE_CODE_REGISTRY_PATH),
    TestCaseIdRegistryPath: relative(TESTCASE_ID_REGISTRY_PATH),
    TestCaseIdMigrationMapPath: relative(MIGRATION_MAP_PATH),
    TestCaseIdMigrationReconciliationPath: relative(MIGRATION_RECONCILIATION_PATH),
    SourceCount: sourceIds.length,
    MaterializedCount: materializedIds.length,
    ReportMainCatalogCount: countReportCases(report, '## 3. 细粒度正式 Catalog', '## 4. 模块状态汇总', /\| [^|]+ \| TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3} \|/g),
    ReportHistoricalCount: 0,
    MissingCount: missingIds.length,
    MissingTestCaseIds: missingIds,
    UnexpectedCount: unexpectedIds.length,
    UnexpectedTestCaseIds: unexpectedIds,
    ConfirmedCount: catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length,
    PendingCount: catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').length,
    GapCount: catalog.TestCases.filter((item) => item.ExpectationGapId).length,
    HistoricalRetainedCount: history.HistoricalTestCases.length,
    CurrentEffectiveStateCount: state.TestCases.length,
    InheritedHistoricalExecutionCount: catalog.TestCases.filter((item) => ['PASS', 'FAIL', 'ERROR'].includes(item.ExecutionStatus) || ['PASS', 'FAIL', 'ERROR'].includes(item.LatestExecutionResult)).length,
    Checks: {
      SourceEqualsMaterialized: sourceIds.length === materializedIds.length && missingIds.length === 0 && unexpectedIds.length === 0,
      PendingAreNonExecutableAndNotExecuted: state.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').every((item) => item.CurrentEligibility === '当前不可执行' && item.LatestExecutionResult === '尚未执行' && item.ExpectationGapId),
      HistoricalCasesRetained: history.HistoricalTestCases.length === 22,
      HistoricalExecutionNotInherited: catalog.TestCases.every((item) => !['PASS', 'FAIL', 'ERROR'].includes(item.ExecutionStatus) && !['PASS', 'FAIL', 'ERROR'].includes(item.LatestExecutionResult)),
      CurrentIdsUseStableFormat: catalog.TestCases.every((item) => currentId(item.TestCaseId)),
    },
    GenericPolicyMetrics: projectGenerationMetrics(readJson(sourcePath).TestCases, catalog.TestCases),
  };
  writeJson(reconciliationPath, reconciliation);
  return reconciliation;
}

export function materializeFineGrainedCatalog() {
  const source = loadEffectiveSource();
  const legacyCatalog = readJson(legacyCatalogPath);
  const handoffCurrent = readJson(handoffCurrentPath);
  const handoffManifestPath = path.join(projectDirectory, 'handoff', 'baselines', handoffCurrent.HandoffRunId, 'manifest-summary.json');
  const handoffManifest = readJson(handoffManifestPath);
  if (handoffCurrent.ActualHash !== handoffManifest.HandoffHash) throw new Error('Frozen Handoff hash metadata mismatch.');
  const historicalExecution = loadHistoricalExecution();
  const materializedAt = new Date().toISOString();
  const metadata = {
    CatalogVersion: catalogVersion,
    GeneratedFrom: relative(sourcePath),
    AuthorityVersion: handoffCurrent.HandoffRunId,
    HandoffHash: handoffCurrent.ActualHash,
    HandoffHashSource: [relative(handoffCurrentPath), relative(handoffManifestPath)],
    GenerationStandardVersion: 'GENERIC-BLACKBOX-TESTCASE-GENERATION-STANDARD-V1',
    TestCaseIdStandardPath: relative(path.join(repositoryDirectory, 'contracts', 'generic-stable-testcase-id-standard.md')),
    FeatureCodeRegistryPath: relative(FEATURE_CODE_REGISTRY_PATH),
    TestCaseIdRegistryPath: relative(TESTCASE_ID_REGISTRY_PATH),
    TestCaseIdMigrationMapPath: relative(MIGRATION_MAP_PATH),
    TestCaseIdMigrationReconciliationPath: relative(MIGRATION_RECONCILIATION_PATH),
    GenericStandardPath: relative(genericStandardPath),
    GenericReportTemplatePath: relative(genericReportTemplatePath),
    GenericTyporaStylePath: relative(genericTyporaStylePath),
    MaterializedAt: materializedAt,
  };
  const testCases = source.TestCases.map((item) => ({
    ...structuredClone(item),
    HistoricalTestCaseRefs: historicalRefs(item),
    ExecutionStatus: 'SKIPPED',
    ExecutionState: '尚未执行',
    LatestExecutionResult: '尚未执行',
    Actual: '—',
    Evidence: [],
  }));
  const catalog = {
    ...metadata,
    CatalogType: 'FORMAL_BLACKBOX_FINE_GRAINED_TESTCASE_CATALOG',
    AuthorityGateStatus: 'DESIGN_DEFAULTS_APPLIED_WITH_TRUE_AMBIGUITIES_ONLY',
    TestCaseCount: testCases.length,
    ConfirmedCount: testCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length,
    PendingCount: testCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').length,
    TestCases: testCases,
  };
  const history = {
    ...metadata,
    CatalogType: 'HISTORICAL_TESTCASE_TRACEABILITY',
    HistoricalTestCaseCount: legacyCatalog.Cases.length,
    HistoricalTestCases: legacyCatalog.Cases.map((item) => {
      const execution = historicalExecution.get(item.TestCaseId);
      return {
        ...structuredClone(item),
        HistoricalExecution: execution ?? { ExecutionStatus: '尚未执行', Actual: '历史正式执行记录中未找到该用例结果。', Evidence: [] },
        RelatedFineGrainedTestCaseIds: testCases.filter((testCase) => testCase.HistoricalTestCaseRefs.includes(item.TestCaseId)).map((testCase) => testCase.TestCaseId),
        ExecutionInheritancePolicy: 'REFERENCE_ONLY_NO_STATUS_MIGRATION',
      };
    }),
  };
  const state = {
    ...metadata,
    StateType: 'CURRENT_EFFECTIVE_STATE',
    TestCaseCount: testCases.length,
    TestCases: testCases.map((item) => ({
      TestCaseId: item.TestCaseId,
      ExpectedStatus: item.ExpectedStatus,
      ExpectedResult: item.ExpectedResult,
      ExpectationGapId: item.ExpectationGapId ?? null,
      CurrentEligibility: effectiveEligibility(item),
      AutomationEligibility: item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY' ? 'NOT_EXECUTABLE' : item.AutomationEligibility,
      ExecutionStatus: 'SKIPPED',
      ExecutionState: '尚未执行',
      LatestExecutionResult: '尚未执行',
      HistoricalTestCaseRefs: item.HistoricalTestCaseRefs,
      HistoricalExecutionInherited: false,
      CurrentReason: item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY' ? item.ExpectationGap ?? item.ExpectedResult : '本次仅材料化设计资产，未执行该用例。',
    })),
  };
  writeJson(formalCatalogPath, catalog);
  writeJson(historicalTraceabilityPath, history);
  writeJson(currentEffectiveStatePath, state);
  const reconciliation = writeMaterializationReconciliation({ catalog, history, state });
  return { catalog, history, state, reconciliation };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const result = materializeFineGrainedCatalog();
  process.stdout.write(`${JSON.stringify({ CatalogPath: relative(formalCatalogPath), TestCaseCount: result.catalog.TestCaseCount, HistoricalTestCaseCount: result.history.HistoricalTestCaseCount, PendingCount: result.catalog.PendingCount }, null, 2)}\n`);
}
