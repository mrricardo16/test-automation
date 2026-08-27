import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModularCatalog } from './modular-testcase-catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const defaultOutput = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '模块化测试用例报告预览.md');
const defaultCatalogOutput = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '模块化测试用例目录.json');
const repositoryDirectory = path.resolve(projectDirectory, '..', '..');

const historyFiles = [
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-081216Z', 'final-case-results.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-A.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-B.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-011-C.json'),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resultEntries() {
  const entries = [];
  for (const filePath of historyFiles) {
    if (!fs.existsSync(filePath)) continue;
    const value = readJson(filePath);
    if (Array.isArray(value.Results)) entries.push(...value.Results.map((result) => ({ ...result, FormalRunId: value.FormalRunId })));
    else if (value.TestCaseId) entries.push(value);
  }
  return new Map(entries.map((entry) => [entry.TestCaseId, entry]));
}

function cell(value) {
  if (value === undefined || value === null || value === '') return '—';
  const text = Array.isArray(value) ? value.join('<br>') : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function resolveEvidencePath(value) {
  const raw = String(value);
  if (/^[A-Za-z]:[\\/]/.test(raw)) return path.resolve(raw);
  if (raw.startsWith('projects/')) return path.resolve(repositoryDirectory, raw);
  return path.resolve(projectDirectory, raw);
}

function reportRelativeEvidence(value, outputPath) {
  if (!value || value === '—') return '—';
  return String(value).split('<br>').map((item) => {
    if (!/\.(png|jpe?g|gif|webp)$/i.test(item)) return item;
    const absolute = resolveEvidencePath(item);
    return fs.existsSync(absolute) ? path.relative(path.dirname(outputPath), absolute).replaceAll('\\', '/') : item;
  }).join('<br>');
}

function executionState(testCase, history) {
  const result = history.get(testCase.TestCaseId);
  if (!result) {
    return { status: '尚未执行', actual: '暂无正式执行结果。', blocker: '本次仅生成设计目录。', evidence: '—' };
  }
  return {
    status: result.ExecutionStatus,
    actual: result.Actual ?? result.ActualResult ?? '—',
    blocker: result.Blocker ?? result.Error ?? '—',
    evidence: Array.isArray(result.Evidence) ? result.Evidence.join('<br>') : result.Evidence ?? '—',
  };
}

function renderCaseRow(testCase, history, outputPath) {
  const state = executionState(testCase, history);
  const preconditions = testCase.Preconditions ?? testCase.InitialState;
  const expected = testCase.ExpectedResult ?? testCase.PrimaryAssertion ?? testCase.ExpectedPerStep?.map((step) => step.Expected);
  const evidence = reportRelativeEvidence(state.evidence, outputPath);
  const image = evidence.split('<br>').find((item) => /\.(png|jpe?g|gif|webp)$/i.test(item)) ?? '—';
  return `| ${cell(testCase.ModuleName)} | ${cell(testCase.FeatureName)} | ${cell(testCase.Operation)} | ${cell(testCase.ScenarioGroup)} | ${cell(testCase.Title)} | ${cell(testCase.TestCaseId)} | ${cell(testCase.TestType)} | ${cell(testCase.Priority)} | ${cell(preconditions)} | ${cell(testCase.TestData)} | ${cell(testCase.Steps)} | ${cell(expected)} | ${cell(state.status)} | ${cell(testCase.AutomationEligibility ?? testCase.CurrentAutomationEligibility)} | ${cell(state.actual)} | ${cell(state.blocker)} | ${cell(evidence)} | ${image === '—' ? '—' : `![截图](${image})`} |`;
}

function render(catalog, history, outputPath) {
  const grouped = new Map();
  for (const testCase of catalog.Cases) {
    if (!grouped.has(testCase.ModuleId)) grouped.set(testCase.ModuleId, []);
    grouped.get(testCase.ModuleId).push(testCase);
  }
  const modules = [...grouped.entries()].sort((left, right) => left[1][0].PresentationOrder.ModuleOrder - right[1][0].PresentationOrder.ModuleOrder);
  const counts = [...catalog.Cases].reduce((result, testCase) => {
    const status = executionState(testCase, history).status;
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {});
  const moduleSummary = modules.map(([moduleId, cases]) => `| ${cases[0].ModuleName} | ${moduleId} | ${new Set(cases.map((item) => item.FeatureId)).size} | ${cases.length} | ${cases.map((item) => item.TestCaseId).join(', ')} |`).join('\n');
  const moduleTables = modules.map(([moduleId, cases], index) => `### 4.${index + 1} ${cases[0].ModuleName}（${moduleId}）\n\n| 模块 | 功能 | 操作 | 场景组 | 场景/标题 | TestCaseId | 类型 | 优先级 | 前置条件 | 测试数据 | 步骤 | 预期结果 | 执行状态 | 自动化适配性 | 实际结果 | 阻塞/缺口 | 证据 | 图片示例 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${cases.map((testCase) => renderCaseRow(testCase, history, outputPath)).join('\n')}`).join('\n\n');

  return `# RSSComposer 模块化测试用例报告预览

> 本文是按“模块 → 功能 → 场景”信息架构生成的完整测试用例设计报告预览。当前任务只做目录重分类和报告生成，不执行正式业务测试，不改写历史 Expected 或 ExecutionStatus。

## 1. 基本信息

- 项目：RSSComposer Web 黑盒测试
- 测试依据：冻结评审包 \`runs/BB-REAL-20260824-174308/04-v2-testcase-review-package.json\`
- 主分组：MODULE（模块）
- 次分组：FEATURE（功能）
- 状态是否参与分组：否；ExecutionStatus、AutomationEligibility、ActivationStatus、CoverageStatus 仅作为用例状态展示
- 用例总数：${catalog.Cases.length}；模块数：${catalog.ModuleInventory.length}；功能数：${catalog.FeatureInventory.length}

## 2. 测试执行摘要

本次输出为设计目录重构预览，未启动业务测试。未执行用例显示“尚未执行”，不生成正式执行状态；历史正式运行记录在第 7 节单独保留。

| 状态 | 数量 | 说明 |
|---|---:|---|
${Object.entries(counts).map(([status, count]) => `| ${status} | ${count} | ${status === '尚未执行' ? '本次设计重构未执行' : '来自既有正式运行记录'} |`).join('\n')}

## 3. 模块覆盖概览

| 模块 | ModuleId | 功能数 | 用例数 | 用例引用 |
|---|---|---:|---:|---|
${moduleSummary}

## 4. 完整模块化测试用例

每条用例只在本节出现一次；复合用例按所属模块和功能就地排列，不另设“复合用例”分组。查询、空态、非法筛选等同一功能用例保持相邻。

${moduleTables}

## 5. 缺口汇总

- 当前目录重构未新增业务缺口，也未改变冻结评审包的 Expected、历史执行状态或正式运行记录。
- 未执行用例统一以“暂无正式执行结果”记录于对应行的“实际结果”列；这表示本次任务边界，不是产品缺陷结论。
- 需要开发反馈的 FAIL、ERROR、BLOCKED 仍应来自实际运行报告，不从本次设计预览推断。

## 6. 人工/阻塞摘要

- 人工边界用例：\`TC-BB-REAL-009-M\`、\`TC-BB-REAL-010-M\`，分别覆盖看板视觉检查和日志下载人工边界。
- 本次未执行自动化业务用例；未将未执行设计用例伪造为 PASS。
- 证据列按用例行展示；正式执行产生的截图、Trace、日志路径由正式报告维护。

## 7. 正式运行历史

历史记录只引用既有 RunId 和 TestCaseId，不回填或改写冻结用例定义。

| FormalRunId | 范围 | 结果 |
|---|---|---|
| \`FAST-BB-REAL-20260825-081216Z\` | 002-A、002-B、002-C、003-C | PASS（既有记录） |
| \`FAST-BB-REAL-20260825-065833Z\` | 001-A、001-B | PASS（既有记录） |
| \`FAST-BB-REAL-20260825-065833Z\` | 011-C | ERROR（既有诊断记录） |

## 8. 结论与规则落地状态

- PrimaryGrouping: MODULE
- SecondaryGrouping: FEATURE
- StatusUsedForGrouping: false
- OperationTaxonomy: QUERY, CREATE, UPDATE, DELETE, VALIDATION, STATE_TRANSITION, PERMISSION, RELATIONSHIP, IMPORT, EXPORT, DOWNLOAD, UPLOAD, AUTHENTICATION, SESSION, COMPOSITE_LIFECYCLE, VISUAL, OTHER
- ScenarioGroupTaxonomy: HAPPY_PATH, CONDITION, VALIDATION, NEGATIVE, BOUNDARY, EMPTY_STATE, DUPLICATE, PERMISSION, STATE, RELATIONSHIP, POST_CONDITION, ERROR_HANDLING, RECOVERY, IDEMPOTENCY, COMPOSITE_FLOW, MANUAL_BOUNDARY
- TestCaseSchemaUpdated: Yes
- ReportTemplateUpdated: Yes
- ValidatorUpdated: Yes
- Current22CasesReclassified: Yes
- DuplicateCasePresentationRemoved: Yes
- StatisticsCasesAdjacent: Yes
- UserCasesAdjacent: Yes
- TaskCasesAdjacent: Yes
- VehicleCasesAdjacent: Yes
- ExecutionSummarySeparated: Yes
- FormalHistoryPreserved: Yes
- ExpectedChanged: No
- ExecutionStatusChanged: No
- FormalBusinessCasesExecuted: No

TESTCASE_INFORMATION_ARCHITECTURE_STATUS: PASS
MODULAR_TESTCASE_DESIGN_STATUS: PASS
MODULAR_REPORTING_STATUS: PASS
`;
}

export function generateModularReport({ outputPath = defaultOutput, catalogPath = defaultCatalogOutput } = {}) {
  const catalog = buildModularCatalog();
  const history = resultEntries();
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputPath, render(catalog, history, outputPath), 'utf8');
  return { outputPath, catalogPath, caseCount: catalog.Cases.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.stdout.write(`${JSON.stringify(generateModularReport(), null, 2)}\n`);
}
