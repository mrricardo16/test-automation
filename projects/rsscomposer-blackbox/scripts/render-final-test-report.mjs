import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateMarkdownFiles } from '../../../scripts/platform/markdown-table-validator.mjs';
import { genericReportTemplatePath, materializeFineGrainedCatalog, projectDirectory, reportPath, writeMaterializationReconciliation } from './materialize-fine-grained-catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(scriptDirectory, '..', '..', '..');
const templatePath = path.join(repositoryDirectory, 'docs', '最终测试报告模板.md');
const reportDirectory = path.dirname(reportPath);
const operationLabels = { AUTHENTICATION: '认证', SESSION: '会话', QUERY: '查询', CREATE: '新增', UPDATE: '修改', DELETE: '删除', VALIDATION: '校验', STATE_TRANSITION: '状态', STATE: '状态', PERMISSION: '权限', RELATIONSHIP: '关系', RELATION: '关系', COMPOSITE_LIFECYCLE: '生命周期', LIFECYCLE: '生命周期', RESET: '筛选重置', PAGINATION: '分页', SORT: '排序', VISUAL: '视觉检查', DOWNLOAD: '下载', UPLOAD: '上传', IMPORT: '导入', EXPORT: '导出', OTHER: '其他' };
const operationOrder = { QUERY: 10, AUTHENTICATION: 10, SESSION: 15, CREATE: 20, VALIDATION: 25, UPDATE: 30, RELATIONSHIP: 35, STATE_TRANSITION: 40, DELETE: 50, COMPOSITE_LIFECYCLE: 60, VISUAL: 70, DOWNLOAD: 80, OTHER: 90 };
const visualLineBreak = '&#10;';
const maximumStepsPerVisualLine = 2;
const maximumStepLineUnits = 30;
const canonicalTemplateMarkers = [
  '# 最终测试报告模板',
  '## 模板绑定',
  '## 3. 细粒度正式 Catalog',
  '主 TestCase 表固定为 9 列',
  '图片证据必须紧跟所属用例',
  '## 4. 模块状态汇总',
  '## 5. Current Effective State',
  '## 6. Expectation Gap',
  '## 7. 测试结论',
  '禁止显示 `<br>`',
  '每条步骤编号；短步骤可一行放 2 条',
];

export function validateCanonicalTemplate() {
  const template = fs.readFileSync(templatePath, 'utf8');
  const missing = canonicalTemplateMarkers.filter((marker) => !template.includes(marker));
  if (missing.length > 0) throw new Error(`Canonical final report template contract mismatch: ${missing.join(' | ')}`);
  return { Status: 'PASS', Missing: [] };
}

function escapeCell(value) { return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\r', '').replaceAll('\n', ' ').trim() || '—'; }
function markdownRow(values) { return `| ${values.map(escapeCell).join(' | ')} |`; }
function table(rows) { return [markdownRow(rows[0]), markdownRow(rows[0].map(() => '---')), ...rows.slice(1).map(markdownRow)].join('\n'); }
function normalizeHumanReadablePunctuation(value) {
  return String(value ?? '')
    .replaceAll('。；', '；')
    .replaceAll('；。', '；')
    .replaceAll('；；', '；')
    .replaceAll('。。', '。')
    .replace(/[；，、]\s*$/u, '。')
    .replace(/^\s*[；，、]/u, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
function splitSemanticSegments(value) {
  return normalizeHumanReadablePunctuation(value).split(/[\r\n]+|(?<=；)/u).map((item) => normalizeHumanReadablePunctuation(item)).filter(Boolean);
}
function formatNumberedSegments(values = [], separator = '　') {
  const segments = values.flatMap((value) => splitSemanticSegments(value));
  return {
    segments,
    display: segments.map((item, index) => `${index + 1}、${item}`).join(separator) || '—',
  };
}
function estimateVisualUnits(value) {
  return [...String(value ?? '')].reduce((total, character) => total + (/[\u0000-\u00ff]/u.test(character) ? 0.6 : 1), 0);
}
function formatStepSegments(values = []) {
  const segments = values.flatMap((value) => splitSemanticSegments(value));
  const rows = [];
  let current = [];
  let currentUnits = 0;
  segments.forEach((item, index) => {
    const numbered = `${index + 1}、${item}`;
    const numberedUnits = estimateVisualUnits(numbered);
    const candidateUnits = current.length === 0 ? numberedUnits : currentUnits + 2 + numberedUnits;
    if (current.length >= maximumStepsPerVisualLine || (current.length > 0 && candidateUnits > maximumStepLineUnits)) {
      rows.push(current.join('　'));
      current = [numbered];
      currentUnits = numberedUnits;
    } else {
      current.push(numbered);
      currentUnits = candidateUnits;
    }
  });
  if (current.length > 0) rows.push(current.join('　'));
  return { segments, display: rows.join(visualLineBreak) || '—' };
}
function formatPreconditions(values = []) {
  const segments = values.map((value) => normalizeHumanReadablePunctuation(value)).filter(Boolean);
  const displaySegments = segments.map((item, index) => index < segments.length - 1 ? item.replace(/[。！？]$/u, '') : item);
  return { segments, display: displaySegments.join('；') || '—' };
}
function formatData(rows = []) {
  const segments = rows.map((row) => `${normalizeHumanReadablePunctuation(row[0] ?? '字段')}：${normalizeHumanReadablePunctuation(row[1] ?? '—')}`).filter(Boolean);
  return { segments, display: segments.join('　') || '—' };
}
function formatExpected(testCase) {
  if (testCase.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY') {
    return { segments: [`【待确认】${normalizeHumanReadablePunctuation(testCase.ExpectationGap ?? '业务判定规则尚未定义。')}`], display: `【待确认】${normalizeHumanReadablePunctuation(testCase.ExpectationGap ?? '业务判定规则尚未定义。')}` };
  }
  return formatNumberedSegments([testCase.ExpectedResult, ...(testCase.SupportingAssertions ?? []), ...(testCase.PostConditions ?? []).map((item) => `业务后置：${item}`)], visualLineBreak);
}
function formatSteps(testCase) {
  const numbered = formatStepSegments(testCase.Steps ?? []);
  const cleanup = normalizeHumanReadablePunctuation(testCase.Cleanup ?? '');
  return { ...numbered, display: cleanup ? `${numbered.display}${visualLineBreak}【清理】${cleanup}` : numbered.display };
}
function formatSegments(values = []) { return values.filter(Boolean).map(normalizeHumanReadablePunctuation).join('；') || '—'; }
function operationDisplayName(operation, testCase) { return testCase.OperationDisplayName ?? operationLabels[operation] ?? operation.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (value) => value.toUpperCase()); }

function mainRow(testCase, effectiveState) {
  const preconditions = formatPreconditions(testCase.Preconditions);
  const data = formatData(testCase.TestData);
  const steps = formatSteps(testCase);
  const expected = formatExpected(testCase);
  return [testCase.Title, testCase.TestCaseId, preconditions.display, data.display, steps.display, expected.display, `${testCase.ExecutionStatus === 'SKIPPED' ? '尚未执行' : testCase.ExecutionStatus} / ${effectiveState.CurrentEligibility}`, testCase.Actual ?? '—', '—'];
}

function groupCatalog(cases) {
  const modules = new Map();
  for (const testCase of cases) {
    if (!modules.has(testCase.ModuleName)) modules.set(testCase.ModuleName, new Map());
    const features = modules.get(testCase.ModuleName);
    if (!features.has(testCase.FeatureName)) features.set(testCase.FeatureName, new Map());
    const operations = features.get(testCase.FeatureName);
    if (!operations.has(testCase.Operation)) operations.set(testCase.Operation, []);
    operations.get(testCase.Operation).push(testCase);
  }
  return modules;
}

export function generateFinalReport() {
  const templateContract = validateCanonicalTemplate();
  const { catalog, history, state } = materializeFineGrainedCatalog();
  const stateById = new Map(state.TestCases.map((item) => [item.TestCaseId, item]));
  const groups = groupCatalog(catalog.TestCases);
  const pending = catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY');
  const confirmed = catalog.TestCases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED');
  const manual = state.TestCases.filter((item) => item.CurrentEligibility === '需人工执行').length;
  const notExecutable = state.TestCases.filter((item) => item.CurrentEligibility === '当前不可执行').length;
  const auto = state.TestCases.filter((item) => item.CurrentEligibility === '可自动执行').length;
  const lines = [];
  lines.push('# RSSComposer 调度系统测试报告\n');
  lines.push('> 本报告由通用黑盒测试用例规范和 RSSComposer 项目适配器生成。本次只材料化测试设计资产并重生成报告，没有执行 Formal Run、FAST、Regression、Runtime 或业务测试。\n');
  lines.push('## 1. 测试基本信息\n');
  lines.push(table([['项目', '内容'], ['报告名称', 'RSSComposer 调度系统测试报告'], ['正式 Catalog 版本', catalog.CatalogVersion], ['生成来源', catalog.GeneratedFrom], ['权威版本', catalog.AuthorityVersion], ['Handoff Hash', catalog.HandoffHash], ['Generation Standard', catalog.GenerationStandardVersion], ['材料化时间', catalog.MaterializedAt], ['细粒度正式用例', `${catalog.TestCaseCount} 条；确认预期 ${catalog.ConfirmedCount} 条，pending ${catalog.PendingCount} 条`], ['报告范围', '仅展示当前正式 Catalog 的完整细粒度测试用例；历史执行记录不进入本报告正文']]));
  lines.push('\n## 2. 测试结果概览\n');
  lines.push('新细粒度用例全部为“尚未执行”，不继承任何历史 PASS、FAIL 或 ERROR。只有会改变主要 PASS/FAIL 判定的真实业务歧义才保留为 Pending；通用 CRUD 语义使用 DESIGN_DEFAULT。\n');
  lines.push(table([['指标', '结果'], ['主 Catalog 用例总数', catalog.TestCaseCount], ['Expected 已确认', confirmed.length], ['Expected Pending', pending.length], ['Expectation Gap', pending.filter((item) => item.ExpectationGapId).length], ['新细粒度尚未执行', catalog.TestCaseCount], ['可自动执行设计资格', auto], ['需人工执行设计资格', manual], ['当前不可执行', notExecutable]]));
  lines.push('\n## 3. 细粒度正式 Catalog\n');
  lines.push('主表只显示正式 Catalog 中的细粒度 TestCase。每条用例一行，固定九列；pending 用例与确认预期用例共同可见，但 pending 不进入执行队列。\n');
  let moduleIndex = 0;
  let mainTestCaseTableCount = 0;
  for (const [moduleName, features] of groups.entries()) {
    moduleIndex += 1;
    lines.push(`### 3.${moduleIndex} ${moduleName}\n`);
    for (const [featureName, operations] of features.entries()) {
      lines.push(`#### ${featureName}\n`);
      const orderedOperations = [...operations.entries()].sort((left, right) => (operationOrder[left[0]] ?? 99) - (operationOrder[right[0]] ?? 99));
      for (const [operation, cases] of orderedOperations) {
        cases.sort((left, right) => left.GenerationOrder - right.GenerationOrder);
        lines.push(`##### ${operationDisplayName(operation, cases[0])}\n`);
        lines.push(table([['测试场景', 'TestCaseId', '前置条件', '测试数据', '操作步骤', '预期结果', '状态', '实际验证', '图片示例'], ...cases.map((item) => mainRow(item, stateById.get(item.TestCaseId)))]));
        mainTestCaseTableCount += 1;
        lines.push('');
      }
    }
  }
  lines.push('\n## 4. 模块状态汇总\n');
  const moduleRows = [];
  for (const [moduleName, features] of groups.entries()) {
    const cases = [...features.values()].flatMap((operations) => [...operations.values()].flat());
    moduleRows.push([moduleName, cases.length, cases.filter((item) => item.ExpectedStatus === 'EXPECTED_CONFIRMED').length, cases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY').length, cases.length]);
  }
  lines.push(table([['模块', '主 Catalog 用例', 'Expected 已确认', 'Expected Pending', '尚未执行'], ...moduleRows]));
  lines.push('\n## 5. Current Effective State\n');
  lines.push(table([['类别', '数量', '当前含义'], ['可自动执行设计资格', auto, 'Expected 已确认且设计资格为 AUTO_ALLOWED；本次仍未执行'], ['需人工执行设计资格', manual, '保留人工控制或视觉判断；本次仍未执行'], ['当前不可执行', notExecutable, 'Expected 权威缺口或既有设计边界未解决；不得进入执行队列'], ['尚未执行', state.TestCaseCount, '全部细粒度 TestCase 均未继承历史执行结果']]));
  lines.push('\n## 6. Expectation Gap\n');
  lines.push('所有 pending TestCase 都保留非空 ExpectedResult，但其语义仅为权威缺口描述，不是业务判定 oracle。\n');
  lines.push(table([['GapId', 'TestCaseId', '所属模块', '测试场景', '待确认 Expected / Gap', '当前状态'], ...pending.map((item) => [item.ExpectationGapId, item.TestCaseId, item.ModuleName, item.Title, item.ExpectationGap ?? item.ExpectedResult, '当前不可执行；尚未执行'])]));
  lines.push('\n## 7. 测试结论\n');
  lines.push(`正式 Fine-Grained Catalog 已材料化 ${catalog.TestCaseCount} 条用例，其中 ${confirmed.length} 条 Expected 已确认，${pending.length} 条保留真实权威缺口。本次仅生成测试设计报告，没有执行任何业务用例；完整测试用例均在第 3 节按模块、功能和操作连续展示。`);
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  const markdownValidation = validateMarkdownFiles([reportPath, templatePath, genericReportTemplatePath]);
  if (markdownValidation.invalidMarkdownTableCount > 0) throw new Error(`Generated Markdown contains invalid tables: ${JSON.stringify(markdownValidation.invalid)}`);
  const reconciliation = writeMaterializationReconciliation({ catalog, history, state });
  return { ReportPath: path.relative(projectDirectory, reportPath).split(path.sep).join('/'), CatalogVersion: catalog.CatalogVersion, MainCatalogCount: catalog.TestCaseCount, HistoricalRetainedCount: history.HistoricalTestCaseCount, ConfirmedCount: confirmed.length, PendingCount: pending.length, GapCount: pending.filter((item) => item.ExpectationGapId).length, ReportMainCatalogCount: reconciliation.ReportMainCatalogCount, TemplateContractStatus: templateContract.Status, FormalBusinessCasesExecuted: 'No' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.stdout.write(`${JSON.stringify(generateFinalReport(), null, 2)}\n`);
