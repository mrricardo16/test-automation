import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildModularCatalog } from './modular-testcase-catalog.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');

const operationLabels = {
  QUERY: '查询', CREATE: '新增', UPDATE: '修改', DELETE: '删除', VALIDATION: '数据校验', STATE_TRANSITION: '状态转换',
  PERMISSION: '权限', RELATIONSHIP: '关联关系', IMPORT: '导入', EXPORT: '导出', DOWNLOAD: '下载', UPLOAD: '上传',
  AUTHENTICATION: '身份认证', SESSION: '会话', COMPOSITE_LIFECYCLE: '组合生命周期', VISUAL: '视觉检查', OTHER: '其他',
};
const scenarioLabels = {
  HAPPY_PATH: '正常场景', CONDITION: '条件场景', VALIDATION: '校验场景', NEGATIVE: '异常场景', BOUNDARY: '边界场景',
  EMPTY_STATE: '空数据场景', DUPLICATE: '重复数据', PERMISSION: '权限场景', STATE: '状态场景', RELATIONSHIP: '关系场景',
  POST_CONDITION: '后置状态', ERROR_HANDLING: '错误处理', RECOVERY: '恢复场景', IDEMPOTENCY: '幂等性', COMPOSITE_FLOW: '组合流程', MANUAL_BOUNDARY: '人工边界',
};
const dataLabels = {
  VALID_DATA: '合法数据', INVALID_DATA: '非法数据', BOUNDARY_DATA: '边界数据', EXISTING_DATA: '已存在数据', NON_EXISTING_DATA: '不存在数据',
  DUPLICATE_DATA: '重复数据', EMPTY_DATA: '空数据', TEST_OWNED_DATA: '测试自有数据', DISPOSABLE_DATA: '一次性测试数据', REFERENCE_DATA: '基准数据',
};

const historyFiles = [
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-081216Z', 'final-case-results.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-A.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-001-B.json'),
  path.join(projectDirectory, 'runs', 'FAST-BB-REAL-20260825-065833Z', 'case-results', 'TC-BB-REAL-011-C.json'),
];

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }

function loadHistory() {
  const results = [];
  for (const filePath of historyFiles) {
    if (!fs.existsSync(filePath)) continue;
    const value = readJson(filePath);
    if (Array.isArray(value.Results)) results.push(...value.Results.map((item) => ({ ...item, FormalRunId: value.FormalRunId })));
    else if (value.TestCaseId) results.push(value);
  }
  return new Map(results.map((item) => [item.TestCaseId, item]));
}

function dataCategory(testCase) {
  if (/重复|duplicate/i.test(testCase.Title)) return 'DUPLICATE_DATA';
  if (/非法|无效|拒绝/i.test(testCase.Title)) return 'INVALID_DATA';
  if (/无数据|空态/i.test(testCase.Title)) return 'EMPTY_DATA';
  if (testCase.Operation === 'QUERY') return 'REFERENCE_DATA';
  if (testCase.SideEffects && testCase.SideEffects !== 'NONE') return 'TEST_OWNED_DATA';
  return 'VALID_DATA';
}

function dataFields(testCase) {
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-001')) return ['账号', '密码'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-002')) return ['用户名', '显示名称', '密码', '角色'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-003')) return ['用户', '角色', '关联关系'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-004')) return ['模板', '车辆', '站点', '楼层', '任务参数'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-005') || testCase.TestCaseId.startsWith('TC-BB-REAL-006')) return ['任务状态', '任务归属', '派发状态'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-007')) return ['地图名称', '地图内容', '发布状态'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-008')) return ['车辆编号', '车辆类型', '车辆状态'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-009')) return ['看板指标', '地图状态', '车辆状态', '任务状态'];
  if (testCase.TestCaseId.startsWith('TC-BB-REAL-010')) return ['日志包范围', '批准范围', '下载路径'];
  return ['统计条件', '时间范围', '分页条件', '排序条件'];
}

function businessRules(testCase) {
  const id = testCase.TestCaseId;
  if (id === 'TC-BB-REAL-002-B') return ['重复用户名必须拒绝', '密码低于最小长度必须拒绝'];
  if (id === 'TC-BB-REAL-004-B') return ['无效模板依赖必须拒绝', '无效车辆依赖必须拒绝', '无效站点依赖必须拒绝', '无效楼层依赖必须拒绝'];
  if (id === 'TC-BB-REAL-008-B') return ['重复车辆编号必须拒绝', '车辆必填字段缺失必须拒绝', '非法车辆类型必须拒绝'];
  if (id === 'TC-BB-REAL-011-C') return ['具体非法筛选规则必须由批准基线定义'];
  return [testCase.PrimaryAssertion ?? testCase.Title];
}

function supportingAssertions(testCase) {
  if (testCase.Operation === 'QUERY') return ['结果区域可见', '查询条件与提交条件一致', '不显示业务错误', '结果属于查询范围'];
  if (testCase.Operation === 'CREATE') return ['保存成功提示可见', '列表重新查询可见新对象', '对象数量变化符合预期'];
  if (testCase.Operation === 'VALIDATION') return ['显示针对当前规则的校验提示', '失败后无非法残留数据', '页面仍可继续操作'];
  if (testCase.Operation === 'STATE_TRANSITION') return ['状态显示与批准状态模型一致', '非法转换不改变原状态'];
  if (testCase.Operation === 'RELATIONSHIP') return ['关联结果可重新查询', '关系变更不产生错误孤儿关系'];
  if (testCase.CaseKind === 'COMPOSITE') return ['每个步骤均有可观察结果', '跨步骤状态保持一致'];
  return ['页面结果可观察', '错误提示和业务状态不矛盾'];
}

function techniques(testCase) {
  const result = new Set();
  if (testCase.Operation === 'QUERY') result.add('QUERY_TEST_MATRIX');
  if (['CREATE', 'VALIDATION', 'AUTHENTICATION'].includes(testCase.Operation)) result.add('EQUIVALENCE_PARTITIONING');
  if (/边界|长度|筛选|分页/.test(testCase.Title) || testCase.TestCaseId === 'TC-BB-REAL-002-B') result.add('BOUNDARY_VALUE');
  if (['STATE_TRANSITION', 'SESSION'].includes(testCase.Operation)) result.add('STATE_MODEL');
  if (testCase.Operation === 'STATE_TRANSITION') result.add('DECISION_TABLE');
  if (testCase.Operation === 'RELATIONSHIP') result.add('RELATIONSHIP_MATRIX');
  if (testCase.Operation === 'COMPOSITE_LIFECYCLE') result.add('CRUD_LIFECYCLE_MATRIX');
  if (testCase.ScenarioGroup === 'MANUAL_BOUNDARY') result.add('MANUAL_BOUNDARY');
  if (testCase.Operation === 'VISUAL') result.add('REPRESENTATIVE_PARTITION');
  if (testCase.Operation === 'DOWNLOAD') result.add('ERROR_RECOVERY');
  return [...result];
}

function recommendedPriority(testCase) {
  if (['TC-BB-REAL-001-A', 'TC-BB-REAL-002-A', 'TC-BB-REAL-004-A'].includes(testCase.TestCaseId)) return 'P0';
  if (['TC-BB-REAL-009-M', 'TC-BB-REAL-010-M'].includes(testCase.TestCaseId)) return 'P2';
  return 'P1';
}

function effectiveEligibility(testCase, sourceHasData) {
  if (testCase.AutomationType === 'MANUAL' || testCase.ScenarioGroup === 'MANUAL_BOUNDARY') return 'MANUAL_REQUIRED';
  if (!sourceHasData || testCase.AutomationEligibility === 'NOT_EXECUTABLE') return 'NOT_EXECUTABLE';
  return 'AUTO_ALLOWED';
}

function qualityCase(testCase, history) {
  const sourceHasData = Object.prototype.hasOwnProperty.call(testCase, 'TestData');
  const rules = businessRules(testCase);
  const issues = [];
  if (!sourceHasData) issues.push('MISSING_TEST_DATA');
  if (testCase.CaseKind === 'ATOMIC' && rules.length > 1) issues.push('MULTIPLE_PRIMARY_BUSINESS_RULES');
  if (testCase.SideEffects !== 'NONE' && !testCase.Cleanup) issues.push('MISSING_CLEANUP_FOR_MUTATION');
  if (testCase.TestCaseId === 'TC-BB-REAL-011-C') issues.push('VAGUE_EXPECTED_RESULT', 'COVERAGE_GAP');
  if (testCase.Priority === 'P0' && recommendedPriority(testCase) !== 'P0') issues.push('PRIORITY_INFLATION');
  if (testCase.TestCaseId === 'TC-BB-REAL-002-B') issues.push('BOUNDARY_EXPECTATION_GAP');
  const historyResult = history.get(testCase.TestCaseId);
  const latest = historyResult?.ExecutionStatus ?? '尚未执行';
  const sourceData = sourceHasData ? '已声明，需核对字段' : '待补充：必须由批准基线或测试数据方案提供';
  const category = dataCategory(testCase);
  const qualityLimited = issues.some((code) => ['MISSING_TEST_DATA', 'MISSING_CLEANUP_FOR_MUTATION', 'VAGUE_EXPECTED_RESULT', 'COVERAGE_GAP', 'BOUNDARY_EXPECTATION_GAP'].includes(code));
  const profile = {
    ...testCase,
    BusinessRules: rules,
    PrimaryBusinessRule: rules[0],
    SupportingAssertions: supportingAssertions(testCase),
    TestDataDesign: {
      DataFields: dataFields(testCase),
      DataCategory: category,
      DataCategoryLabel: dataLabels[category],
      KeyValues: sourceHasData ? ['沿用候选定义并脱敏'] : [`AUTO_TEST_${testCase.FeatureId}`],
      Source: sourceHasData ? '候选定义' : '待补充：Approved Baseline / Requirement',
      Ownership: 'TEST_OWNED',
      Unique: testCase.Operation === 'CREATE',
      Disposable: testCase.SideEffects !== 'NONE',
      Sensitive: /密码|账号|会话|日志/.test(testCase.Title),
      SourceDataState: sourceData,
    },
    SafetyConstraints: ['仅操作 TEST_OWNED 或明确批准的隔离数据。', '不得输出密码、Token、Cookie 或敏感响应值。', ...(testCase.SideEffects !== 'NONE' ? ['执行后必须按归属清理并验证。'] : [])],
    DesignTechniques: techniques(testCase),
    BoundaryValues: { Applicable: testCase.TestCaseId === 'TC-BB-REAL-002-B' || testCase.TestCaseId === 'TC-BB-REAL-011-C', Values: testCase.TestCaseId === 'TC-BB-REAL-002-B' ? ['批准最小值-1', '批准最小值', '批准最小值+1'] : ['批准时间/分页边界'], ExpectedKnown: testCase.TestCaseId !== 'TC-BB-REAL-002-B' && testCase.TestCaseId !== 'TC-BB-REAL-011-C' },
    SafetyConstraintsLabel: '安全约束',
    BusinessPostConditions: testCase.PostConditions ?? ['待补充：业务后置状态必须由批准来源定义。'],
    CleanupRequirement: testCase.Cleanup ?? (testCase.SideEffects === 'NONE' ? '不适用：本用例不写入业务数据。' : '待补充：删除测试自有数据并验证不存在。'),
    CurrentPriority: testCase.Priority,
    RecommendedPriority: recommendedPriority(testCase),
    PriorityQuality: testCase.Priority === recommendedPriority(testCase) ? '合理' : '疑似 P0 膨胀，建议降级',
    LatestExecutionResult: latest,
    LatestRunId: historyResult?.FormalRunId ?? '—',
    LatestEvidence: Array.isArray(historyResult?.Evidence) ? historyResult.Evidence : historyResult?.Evidence ? [historyResult.Evidence] : [],
    LatestEffectiveAutomationEligibility: effectiveEligibility(testCase, sourceHasData),
    CoverageStatus: latest === 'PASS' ? 'COVERED' : latest === 'ERROR' ? 'PARTIAL' : 'UNTESTED',
    CoverageStatusLabel: latest === 'PASS' ? '已覆盖' : latest === 'ERROR' ? '部分覆盖' : '未覆盖',
    DesignIssue: issues,
    GranularityQuality: rules.length > 1 && testCase.CaseKind === 'ATOMIC' ? '需拆分' : '合格',
    TestDataQuality: sourceHasData ? '已声明，需核对具体性' : '缺失',
    PreconditionQuality: Array.isArray(testCase.Preconditions) && testCase.Preconditions.some((item) => /ignored local config|测试负责人批准|不得使用|禁止/.test(item)) ? '需业务化并与安全约束分离' : '已声明',
    ExpectedDeterminism: testCase.TestCaseId === 'TC-BB-REAL-011-C' ? '待确认' : '可判定',
    BoundaryCoverage: testCase.TestCaseId === 'TC-BB-REAL-002-B' ? '已识别但 Expected 待确认' : testCase.Operation === 'QUERY' ? '需按查询矩阵评估' : '未单独适用',
    EquivalenceCoverage: techniques(testCase).includes('EQUIVALENCE_PARTITIONING') ? '已识别' : '需评估',
    StateCoverage: techniques(testCase).includes('STATE_MODEL') ? '已识别' : ['STATE_TRANSITION', 'SESSION'].includes(testCase.Operation) ? '需补充状态模型' : '未单独适用',
    LifecycleCoverage: techniques(testCase).includes('CRUD_LIFECYCLE_MATRIX') ? '已识别' : ['CREATE', 'UPDATE', 'DELETE'].includes(testCase.Operation) ? '部分识别' : '未单独适用',
    PermissionCoverage: testCase.Operation === 'PERMISSION' || /权限|角色|登录|会话/.test(testCase.Title) ? '已识别' : '需评估',
    RelationshipCoverage: testCase.Operation === 'RELATIONSHIP' || /依赖|关联/.test(testCase.Title) ? '已识别' : '需评估',
    PostConditionQuality: Array.isArray(testCase.PostConditions) && testCase.PostConditions.length > 0 ? '已声明，需与清理分离' : '缺失',
    CleanupQuality: testCase.SideEffects === 'NONE' ? '不适用' : testCase.Cleanup ? '已声明' : '缺失',
    ChinesePresentationQuality: '合格',
    RecommendedAction: issues.length === 0 ? '进入设计评审' : issues.includes('MULTIPLE_PRIMARY_BUSINESS_RULES') ? '按业务规则拆分 TestCaseId' : issues.includes('MISSING_TEST_DATA') ? '补充具体测试数据方案后复审' : '补齐缺口后复审',
    DesignMaturity: qualityLimited ? 'LIMITED' : 'REVIEWABLE',
    DesignMaturityLabel: qualityLimited ? '受限' : '可评审',
    OperationLabel: operationLabels[testCase.Operation] ?? testCase.Operation,
    ScenarioGroupLabel: scenarioLabels[testCase.ScenarioGroup] ?? testCase.ScenarioGroup,
  };
  delete profile.ExecutionStatus;
  return profile;
}

const explicitGaps = [
  { GapId: 'GAP-BB-USER-QUERY-001', ModuleName: '系统管理', FeatureName: '用户管理', Missing: '查询、空结果、模糊查询、分页和重置场景未形成独立用例。', RelatedCases: ['TC-BB-REAL-002-A', 'TC-BB-REAL-002-B'] },
  { GapId: 'GAP-BB-USER-CRUD-001', ModuleName: '系统管理', FeatureName: '用户管理', Missing: '修改、删除、删除后查询、删除后重新新增未形成独立业务用例；Cleanup 不等于业务覆盖。', RelatedCases: ['TC-BB-REAL-002-C'] },
  { GapId: 'GAP-BB-STAT-QUERY-001', ModuleName: '统计分析', FeatureName: '统计查询', Missing: '时间范围、分页、排序、筛选后分页和刷新后条件状态仍需明确。', RelatedCases: ['TC-BB-REAL-011-A', 'TC-BB-REAL-011-B', 'TC-BB-REAL-011-C'] },
  { GapId: 'GAP-BB-RELATION-001', ModuleName: '系统管理', FeatureName: '角色与用户关系', Missing: '重复关联、解除关联、恢复关联、父对象删除时的关系规则需补齐。', RelatedCases: ['TC-BB-REAL-003-C'] },
  { GapId: 'GAP-BB-TASK-STATE-001', ModuleName: '任务管理', FeatureName: '任务取消/重发', Missing: '任务状态 × 操作 × 权限 × 归属 × 派发状态决策表需补齐。', RelatedCases: ['TC-BB-REAL-005-A', 'TC-BB-REAL-005-B', 'TC-BB-REAL-006-A', 'TC-BB-REAL-006-B'] },
];

const splitRecommendations = [
  { SourceTestCaseId: 'TC-BB-REAL-002-B', Reason: '重复用户名与密码过短是两个独立业务规则，失败后需要不同根因定位。', RecommendedCases: [{ TestCaseId: 'TC-BB-REAL-002-B1', Title: '用户新增-重复用户名校验' }, { TestCaseId: 'TC-BB-REAL-002-B2', Title: '用户新增-密码低于最小长度校验' }], Parameterization: '密码边界可以在 B2 内参数化；不得与 B1 合并。' },
  { SourceTestCaseId: 'TC-BB-REAL-004-B', Reason: '模板、车辆、站点、楼层是不同引用关系；只有同一引用校验规则才能参数化。', RecommendedCases: [{ TestCaseId: 'TC-BB-REAL-004-B1', Title: '任务新增-无效模板引用校验' }, { TestCaseId: 'TC-BB-REAL-004-B2', Title: '任务新增-无效车辆引用校验' }, { TestCaseId: 'TC-BB-REAL-004-B3', Title: '任务新增-无效站点/楼层引用校验' }] },
  { SourceTestCaseId: 'TC-BB-REAL-008-B', Reason: '重复编号、必填缺失、非法类型的失败根因不同，不能合并为“无效车辆数据”。', RecommendedCases: [{ TestCaseId: 'TC-BB-REAL-008-B1', Title: '车辆新增-重复编号校验' }, { TestCaseId: 'TC-BB-REAL-008-B2', Title: '车辆新增-必填字段校验' }, { TestCaseId: 'TC-BB-REAL-008-B3', Title: '车辆新增-非法类型校验' }] },
];

export function buildDesignQualityAudit({ catalog = buildModularCatalog(), history = loadHistory() } = {}) {
  const cases = catalog.Cases.map((testCase) => qualityCase(testCase, history));
  const featureGroups = new Map();
  for (const testCase of cases) {
    const key = `${testCase.ModuleId}|${testCase.FeatureId}`;
    if (!featureGroups.has(key)) featureGroups.set(key, []);
    featureGroups.get(key).push(testCase);
  }
  const featureCoverageMatrix = [...featureGroups.values()].map((featureCases) => ({
    ModuleName: featureCases[0].ModuleName,
    FeatureName: featureCases[0].FeatureName,
    FeatureId: featureCases[0].FeatureId,
    CoveredOperations: [...new Set(featureCases.map((item) => item.OperationLabel))],
    CaseIds: featureCases.map((item) => item.TestCaseId),
    CoverageAssessment: explicitGaps.some((gap) => gap.FeatureName === featureCases[0].FeatureName) ? '部分覆盖' : '已建立候选，仍需执行确认',
    CoverageGaps: explicitGaps.filter((gap) => gap.FeatureName === featureCases[0].FeatureName).map((gap) => gap.GapId),
  }));
  const summary = {
    Cases: cases.length,
    CasesWithMissingTestData: cases.filter((item) => item.DesignIssue.includes('MISSING_TEST_DATA')).length,
    CasesWithVagueExpected: cases.filter((item) => item.DesignIssue.includes('VAGUE_EXPECTED_RESULT')).length,
    CasesWithPriorityInflation: cases.filter((item) => item.DesignIssue.includes('PRIORITY_INFLATION')).length,
    CasesRecommendedForSplit: splitRecommendations.length,
    CoverageGapsDetected: explicitGaps.length,
    DesignMaturity: { LIMITED: cases.filter((item) => item.DesignMaturity === 'LIMITED').length, REVIEWABLE: cases.filter((item) => item.DesignMaturity === 'REVIEWABLE').length },
  };
  return { PrimaryGrouping: 'MODULE', SecondaryGrouping: 'FEATURE', Mode: 'DESIGN', Cases: cases, FeatureCoverageMatrix: featureCoverageMatrix, CoverageGaps: explicitGaps, SplitRecommendations: splitRecommendations, Summary: summary };
}

export function writeDesignQualityAudit({ outputPath = path.join(projectDirectory, 'runs', 'BB-REAL-20260824-174308', '测试用例设计质量审计.json') } = {}) {
  const audit = buildDesignQualityAudit();
  fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  return { outputPath, caseCount: audit.Cases.length, summary: audit.Summary };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) process.stdout.write(`${JSON.stringify(writeDesignQualityAudit(), null, 2)}\n`);
