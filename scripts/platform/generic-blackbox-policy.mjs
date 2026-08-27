export const EXPECTED_BASIS = Object.freeze({ DESIGN_DEFAULT: 'DESIGN_DEFAULT', AUTHORITATIVE_RULE: 'AUTHORITATIVE_RULE', PENDING_AUTHORITY: 'PENDING_AUTHORITY' });
export const PERMISSION_APPLICABILITY = Object.freeze({ APPLICABLE: 'APPLICABLE', NOT_APPLICABLE: 'NOT_APPLICABLE', UNSPECIFIED: 'UNSPECIFIED' });

const filler = [
  '管理员具备该功能所需权限。',
  '测试数据按批准规则准备并可清理。',
  '实际执行前必须补齐可判定的权威 Expected。',
  '准备该场景所需的隔离测试数据。',
  '执行目标操作并记录结果。',
  '按批准规则清理测试数据。',
  '未执行，不产生业务数据；取得权威规则后补充清理验证。',
  '未执行业务操作，不产生产品状态变化。',
];

export function removeGenericFiller(testCase) {
  const result = structuredClone(testCase);
  for (const field of ['Preconditions', 'Steps', 'SupportingAssertions', 'PostConditions']) {
    if (Array.isArray(result[field])) result[field] = result[field].filter((item) => !filler.includes(item));
  }
  if (typeof result.Cleanup === 'string' && filler.some((item) => result.Cleanup.includes(item))) result.Cleanup = '';
  if (Array.isArray(result.Preconditions) && result.Preconditions.length === 0) result.Preconditions = ['目标功能页面可访问。'];
  if (Array.isArray(result.TestData) && result.TestData.some((row) => String(row[1]).includes('待依据确认后按业务约束生成'))) result.TestData = [['测试对象', '由项目夹具提供的目标对象', '项目测试数据', '仅使用本用例所需数据']];
  return result;
}

export function genericExpected(operation, entityName = '目标对象', subject = '目标条件') {
  switch (operation) {
    case 'QUERY': return `查询结果符合${subject}；不返回明显不匹配的${entityName}；查询不修改业务数据。`;
    case 'CREATE': return `合法且唯一的${entityName}创建成功；重新查询可以读取该对象；关键字段与提交值一致。`;
    case 'UPDATE': return `合法字段保存成功；重新读取得到修改后的值；非目标字段没有无关变化。`;
    case 'DELETE': return `删除操作成功；${entityName}不再作为正常有效对象出现在普通业务查询结果中。`;
    case 'RESET': return `筛选条件被清除；界面恢复该功能定义的默认查询状态。`;
    case 'PAGINATION': return `指定页显示该页对应的数据集；当前生效的筛选条件未被无故改变。`;
    default: return '';
  }
}

export function applyGenericExpectedPolicy(testCase, { entityName = '目标对象', subject = '查询条件', generic = false, permissionApplicability = PERMISSION_APPLICABILITY.UNSPECIFIED } = {}) {
  const result = removeGenericFiller(testCase);
  result.PermissionApplicability = permissionApplicability;
  if (!generic) return result;
  const expected = genericExpected(result.Operation, entityName, subject);
  if (!expected) return result;
  result.ExpectedResult = expected;
  result.PrimaryAssertion = expected;
  result.ExpectedStatus = 'EXPECTED_CONFIRMED';
  result.ExpectedBasis = EXPECTED_BASIS.DESIGN_DEFAULT;
  result.ExpectationGapId = null;
  result.ExpectationGapRefs = [];
  result.ExpectationGap = null;
  result.GapClassification = null;
  result.ExpectedSourceRef = ['generic-blackbox-testcase-generation-standard.md'];
  result.ExpectedAuthority = 'GENERIC-DESIGN-DEFAULTS-V1';
  result.ExpectedAuthorityCompleteness = { ExpectedCandidateFound: 'Yes', SearchCompleteness: 'GENERIC_DEFAULT' };
  result.AutomationEligibility = result.AutomationEligibility === 'NOT_EXECUTABLE' ? 'AUTO_ALLOWED' : result.AutomationEligibility;
  return result;
}

export function isTrueAmbiguity(testCase) {
  return Boolean(testCase.ExpectationGapId) && /重复删除|删除后再次删除|重新创建|复用|会话|状态矩阵|重复任务|权限层级|长度|非法字符|必填|时间范围|枚举/.test(`${testCase.Title} ${testCase.ExpectationGap ?? ''}`);
}

export function auditAtomicity(testCase) {
  const text = `${testCase.Title} ${testCase.Objective ?? ''}`;
  const markers = ['/', '与', '及', '和', '正常/异常', '默认/条件', '正常修改/'];
  const multiple = markers.some((marker) => text.includes(marker));
  return { Atomic: !multiple, Code: multiple ? 'MULTIPLE_PRIMARY_RULES' : 'ATOMIC_PRIMARY_RULE' };
}

export function runSyntheticAcceptance() {
  const cases = [
    applyGenericExpectedPolicy({ Operation: 'QUERY', Title: '按名称查询', Preconditions: [], TestData: [], Steps: [] }, { generic: true, entityName: '对象', subject: '名称查询条件' }),
    applyGenericExpectedPolicy({ Operation: 'DELETE', Title: '删除对象', Preconditions: [], TestData: [], Steps: [] }, { generic: true, entityName: '对象' }),
    { Operation: 'DELETE', Title: '删除后再次删除', ExpectationGapId: 'SYN-C' },
  ];
  const issues = [];
  if (cases[0].ExpectedBasis !== EXPECTED_BASIS.DESIGN_DEFAULT || cases[0].ExpectedStatus !== 'EXPECTED_CONFIRMED') issues.push('SYNTHETIC_A_FAILED');
  if (cases[1].ExpectedBasis !== EXPECTED_BASIS.DESIGN_DEFAULT || cases[1].ExpectedStatus !== 'EXPECTED_CONFIRMED') issues.push('SYNTHETIC_B_FAILED');
  if (!isTrueAmbiguity(cases[2])) issues.push('SYNTHETIC_C_FAILED');
  if (auditAtomicity({ Title: '对象修改-正常修改/重复校验' }).Code !== 'MULTIPLE_PRIMARY_RULES') issues.push('SYNTHETIC_G_FAILED');
  return { Pass: issues.length === 0, Issues: issues };
}
