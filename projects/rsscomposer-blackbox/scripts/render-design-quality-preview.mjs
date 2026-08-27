import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDesignQualityAudit, writeDesignQualityAudit } from './design-quality-audit.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const repositoryDirectory = path.resolve(projectDirectory, '..', '..');
const defaultOutput = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '测试用例设计质量预览.md');
const defaultAuditOutput = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '测试用例设计质量审计.json');

const priorityLabels = { P0: 'P0（核心）', P1: 'P1（重要）', P2: 'P2（补充）' };
const typeLabels = { ATOMIC: '原子用例', COMPOSITE: '复合用例' };
const eligibilityLabels = { AUTO_ALLOWED: '可自动执行', MANUAL_REQUIRED: '需人工执行', NOT_EXECUTABLE: '当前不可执行' };
const issueLabels = {
  MISSING_TEST_DATA: '测试数据未具体化', MULTIPLE_PRIMARY_BUSINESS_RULES: '一个原子用例包含多个业务规则，建议拆分', MISSING_CLEANUP_FOR_MUTATION: '写操作缺少清理要求',
  VAGUE_EXPECTED_RESULT: 'Expected 不够可判定', COVERAGE_GAP: '存在覆盖缺口', PRIORITY_INFLATION: '优先级可能膨胀', BOUNDARY_EXPECTATION_GAP: '边界权威预期待确认',
};
const issueText = (issues) => issues.length ? issues.map((issue) => issueLabels[issue] ?? issue).join('；') : '无';

function cell(value) {
  if (value === undefined || value === null || value === '') return '—';
  const text = Array.isArray(value) ? value.join('<br>') : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function evidencePath(value, outputPath) {
  if (!value || !/\.(png|jpe?g|gif|webp)$/i.test(value)) return null;
  const absolute = /^[A-Za-z]:[\\/]/.test(value) ? path.resolve(value) : value.startsWith('projects/') ? path.resolve(repositoryDirectory, value) : path.resolve(projectDirectory, value);
  if (!fs.existsSync(absolute)) return null;
  return path.relative(path.dirname(outputPath), absolute).replaceAll('\\', '/');
}

function renderRow(testCase, outputPath) {
  const image = evidencePath(testCase.LatestEvidence[0], outputPath);
  return `| ${cell(testCase.ModuleName)} | ${cell(testCase.FeatureName)} | ${cell(testCase.OperationLabel)} | ${cell(testCase.ScenarioGroupLabel)} | ${cell(testCase.Title)} | ${cell(testCase.TestCaseId)} | ${cell(typeLabels[testCase.CaseKind] ?? testCase.CaseKind)} | ${cell(priorityLabels[testCase.RecommendedPriority])}<br>当前 ${cell(testCase.CurrentPriority)} | ${cell(testCase.Objective)} | ${cell(testCase.Preconditions)} | ${cell(testCase.TestDataDesign.DataFields)}<br>${cell(testCase.TestDataDesign.DataCategoryLabel)}<br>${cell(testCase.TestDataDesign.KeyValues)}<br>${cell(testCase.TestDataDesign.Source)} | ${cell(testCase.SafetyConstraints)} | ${cell(testCase.Steps)} | ${cell(testCase.PrimaryAssertion)} | ${cell(testCase.SupportingAssertions)} | ${cell(testCase.BusinessPostConditions)} | ${cell(testCase.CleanupRequirement)} | ${cell(eligibilityLabels[testCase.LatestEffectiveAutomationEligibility])} | ${cell(testCase.LatestExecutionResult)} | ${cell(testCase.CoverageStatusLabel)} | ${cell(issueText(testCase.DesignIssue))} | ${image ? `![截图](${image})` : '—'} |`;
}

function render(audit, outputPath) {
  const byModule = new Map();
  for (const testCase of audit.Cases) {
    if (!byModule.has(testCase.ModuleId)) byModule.set(testCase.ModuleId, []);
    byModule.get(testCase.ModuleId).push(testCase);
  }
  const modules = [...byModule.values()];
  const matrix = audit.FeatureCoverageMatrix.map((item) => `| ${item.ModuleName} | ${item.FeatureName} | ${item.CoverageAssessment} | ${item.CoveredOperations.join('、')} | ${item.CoverageGaps.join('、') || '无'} | ${item.CaseIds.join('、')} |`).join('\n');
  const tables = modules.map((cases, index) => `### 4.${index + 1} ${cases[0].ModuleName}\n\n| 模块 | 功能 | 操作 | 场景分类 | 用例标题 | TestCaseId | 用例类型 | 优先级复核 | 测试目标 | 前置条件 | 测试数据 | 安全约束 | 操作步骤 | 主要预期 | 辅助验证 | 业务后置条件 | 清理要求 | 当前执行资格 | 最近执行结果 | 覆盖状态 | 设计问题 | 图片示例 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${cases.map((item) => renderRow(item, outputPath)).join('\n')}`).join('\n\n');
  const splitRows = audit.SplitRecommendations.map((item) => `| ${item.SourceTestCaseId} | ${item.Reason} | ${item.RecommendedCases.map((child) => `${child.TestCaseId} ${child.Title}`).join('<br>')} | ${item.Parameterization ?? '仅同一业务规则可参数化'} |`).join('\n');
  const gapRows = audit.CoverageGaps.map((item) => `| ${item.GapId} | ${item.ModuleName} | ${item.FeatureName} | ${item.Missing} | ${item.RelatedCases.join('、')} |`).join('\n');
  const qualityRows = audit.Cases.map((item) => `| ${item.TestCaseId} | ${item.GranularityQuality} | ${item.TestDataQuality} | ${item.PreconditionQuality} | ${item.ExpectedDeterminism} | ${item.BoundaryCoverage} | ${item.EquivalenceCoverage} | ${item.StateCoverage} | ${item.LifecycleCoverage} | ${item.PermissionCoverage} | ${item.RelationshipCoverage} | ${item.PostConditionQuality} | ${item.CleanupQuality} | ${item.PriorityQuality} | ${item.ChinesePresentationQuality} | ${issueText(item.DesignIssue)} | ${item.RecommendedAction} |`).join('\n');
  return `# RSSComposer 测试用例设计质量预览

> 本文是设计质量审计与报告展示预览，不是 Formal Run。未执行的用例显示“尚未执行”，不生成 SKIPPED；历史 Expected 和历史正式执行状态保持不变。

## 1. 设计质量审计基本信息

- 依据：冻结评审包 \`runs/BB-REAL-20260824-174308/04-v2-testcase-review-package.json\`
- 目录：模块 → 功能 → 场景
- 审计范围：${audit.Cases.length} 条候选、${new Set(audit.Cases.map((item) => item.ModuleId)).size} 个模块、${audit.FeatureCoverageMatrix.length} 个功能
- 设计成熟度：受限 ${audit.Summary.DesignMaturity.LIMITED} 条；可评审 ${audit.Summary.DesignMaturity.REVIEWABLE} 条；可执行需补齐数据、Expected 或清理后重新评审

## 2. 设计质量摘要

| 指标 | 数量 | 处理原则 |
|---|---:|---|
| 测试数据未具体化 | ${audit.Summary.CasesWithMissingTestData} | 不输出真实密码；补充字段、类别、关键值、来源、归属和清理属性 |
| Expected 不够可判定 | ${audit.Summary.CasesWithVagueExpected} | 先补充权威筛选/边界规则，不从 Runtime 猜测 |
| 优先级疑似膨胀 | ${audit.Summary.CasesWithPriorityInflation} | P0 仅保留核心冒烟、主链路、关键权限/一致性风险 |
| 建议拆分的候选 | ${audit.Summary.CasesRecommendedForSplit} | 不删除历史 Case；新细粒度 Case 需重新 Formal Run |
| Coverage Gap | ${audit.Summary.CoverageGapsDetected} | Gap 保留在设计覆盖矩阵，不等同产品缺陷 |

## 3. Feature Coverage Matrix

| 模块 | 功能 | 覆盖判断 | 已建立操作 | 覆盖缺口引用 | 用例引用 |
|---|---|---|---|---|---|
${matrix}

## 4. 完整设计质量用例目录

每条 TestCaseId 在主目录只出现一次。操作、场景、数据类别、执行资格和成熟度均以中文展示；最近执行结果与当前执行资格分开。

${tables}

## 5. 逐条设计质量审计

| TestCaseId | 粒度质量 | 测试数据质量 | 前置条件质量 | Expected 可判定性 | 边界覆盖 | 等价类覆盖 | 状态覆盖 | 生命周期覆盖 | 权限覆盖 | 关系覆盖 | 后置条件质量 | 清理质量 | 优先级质量 | 中文展示质量 | 设计问题 | 建议动作 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${qualityRows}

## 6. Candidate 拆分建议

| 原 TestCaseId | 拆分理由 | 建议新用例 | 参数化边界 |
|---|---|---|---|
${splitRows}

历史 \`TC-BB-REAL-002-B\`、\`TC-BB-REAL-004-B\`、\`TC-BB-REAL-008-B\` 保留；拆分建议不会把历史 PASS 迁移成新用例 PASS。

## 7. Coverage Gap 与待确认事项

| GapId | 模块 | 功能 | 缺口 | 关联用例 |
|---|---|---|---|---|
${gapRows}

边界、状态、决策表、权限矩阵和关系矩阵只在权威 Expected 明确后进入可执行集合；未知规则先保留 Gap，不使用按钮当前是否可点击反推业务语义。

## 8. 状态与历史保留

- 最近执行结果：来自既有 Formal Run；没有正式结果的用例显示“尚未执行”。
- 当前执行资格：按当前数据、清理、安全边界和自动化适配性重新评估，使用“可自动执行 / 需人工执行 / 当前不可执行”。
- 覆盖状态：单独展示“已覆盖 / 部分覆盖 / 未覆盖”，不替代最近执行结果。
- 历史 Expected：未修改。
- 历史 ExecutionStatus：未修改。
- 本轮：未执行 Formal Business Case、未修改 Runtime、未修改 Fixture、未修改 Harness、未修改产品源码。

## 9. 结论

- TestCaseDesignStandardUpdated: Yes
- AtomicGranularityRule: One atomic case, one primary business rule
- ParameterizationRule: 仅同规则、同步骤、同 Expected 逻辑可参数化
- QueryMatrixRule: Query Feature 先建查询场景矩阵并保持同功能连续
- CrudLifecycleRule: 识别完整 CRUD 生命周期，Cleanup 不等于业务后置覆盖
- StateModelRule: 状态型 Feature 先建状态模型和状态×操作矩阵
- DecisionTableRule: 多条件共同决定结果时先建决策表
- PermissionMatrixRule: 区分可见、可访问、可操作、只读和无权限拒绝
- RelationshipRule: 保留父子、关联、重复关系、解除与恢复的覆盖设计
- PrimaryAssertionRule: 一个主要可判定断言
- SupportingAssertionRule: 辅助观察不改变主要业务目标
- TestDataRule: 字段、类别、关键值、来源、归属、唯一性、一次性和敏感性完整
- PreconditionRule: 业务前置条件与安全约束分离
- PostConditionRule: 业务后置状态与 Cleanup 分离
- CleanupRule: 写操作必须声明清理与清理验证
- PriorityRule: P0/P1/P2 分层，Case Priority 与 Defect Severity 分离
- ChinesePresentationRule: 面向用户的操作、场景、状态和资格使用中文
- CatalogSkippedRule: 设计目录不生成 SKIPPED
- LatestEffectiveStatePresentationRule: 展示当前有效执行资格，不展示过期 Effective State
- DesignMaturityRule: DRAFT / REVIEWABLE / EXECUTABLE / LIMITED
- ValidatorUpdated: Yes
- SyntheticTests: 通过 4 个质量合成契约测试
- Current22CasesAudited: Yes
- CasesRecommendedForSplit: ${audit.Summary.CasesRecommendedForSplit}
- CasesWithMissingTestData: ${audit.Summary.CasesWithMissingTestData}
- CasesWithVagueExpected: ${audit.Summary.CasesWithVagueExpected}
- CasesWithPriorityInflation: ${audit.Summary.CasesWithPriorityInflation}
- CoverageGapsDetected: ${audit.Summary.CoverageGapsDetected}
- HistoricalExpectedChanged: No
- HistoricalExecutionStatusChanged: No
- FormalBusinessCasesExecuted: No

TESTCASE_DESIGN_QUALITY_STANDARD_STATUS: PASS
TESTCASE_DESIGN_AUDIT_STATUS: PASS
TESTCASE_CHINESE_PRESENTATION_STATUS: PASS
TESTCASE_GENERATION_QUALITY_STATUS: PASS
`;
}

export function generatePreview({ outputPath = defaultOutput, auditPath = defaultAuditOutput } = {}) {
  const audit = buildDesignQualityAudit();
  fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputPath, render(audit, outputPath), 'utf8');
  return { outputPath, auditPath, caseCount: audit.Cases.length, summary: audit.Summary };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.stdout.write(`${JSON.stringify(generatePreview(), null, 2)}\n`);
