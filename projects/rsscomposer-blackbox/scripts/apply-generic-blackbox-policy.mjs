import { applyGenericExpectedPolicy, EXPECTED_BASIS, PERMISSION_APPLICABILITY } from '../../../scripts/platform/generic-blackbox-policy.mjs';
import { applyStableIds } from './stable-testcase-id.mjs';

const PROJECT_PERMISSION_APPLICABILITY = PERMISSION_APPLICABILITY.APPLICABLE;

function rows(...values) { return values; }
function clean(base, { id, title, operation = base.Operation, entityName = base.FeatureName, subject = '查询条件', generic = false, preconditions = [], data = [], steps = [], cleanup = '', expected, gapId, gap, eligibility } = {}) {
  const candidate = {
    ...structuredClone(base),
    TestCaseId: id,
    Title: title,
    Scenario: title,
    Operation: operation,
    Preconditions: preconditions.filter((value) => !/管理员具备.*权限|管理员已(?:登录|进入)/.test(value)),
    TestData: data,
    Steps: steps,
    Cleanup: cleanup,
    PostConditions: [],
    SupportingAssertions: [],
    ExpectedResult: expected ?? base.ExpectedResult,
    PrimaryAssertion: expected ?? base.PrimaryAssertion,
    ExpectedStatus: gapId ? 'EXPECTED_PENDING_AUTHORITY' : base.ExpectedStatus,
    ExpectedBasis: gapId ? EXPECTED_BASIS.PENDING_AUTHORITY : base.ExpectedBasis,
    ExpectationGapId: gapId ?? null,
    ExpectationGapRefs: gapId ? [gapId] : [],
    ExpectationGap: gap ?? null,
    GapClassification: gapId ? 'TRUE_AMBIGUITY' : null,
    AutomationEligibility: eligibility ?? base.AutomationEligibility,
    PermissionApplicability: PROJECT_PERMISSION_APPLICABILITY,
    CaseKind: 'ATOMIC',
    TestCaseType: 'ATOMIC',
  };
  const result = applyGenericExpectedPolicy(candidate, { generic, entityName, subject, permissionApplicability: PROJECT_PERMISSION_APPLICABILITY });
  if (gapId) {
    result.ExpectedStatus = 'EXPECTED_PENDING_AUTHORITY';
    result.ExpectedBasis = EXPECTED_BASIS.PENDING_AUTHORITY;
    result.ExpectationGapId = gapId;
    result.ExpectationGapRefs = [gapId];
    result.ExpectationGap = gap;
    result.GapClassification = 'TRUE_AMBIGUITY';
    result.AutomationEligibility = 'NOT_EXECUTABLE';
    result.ExpectedResult = `待确认：${gap}`;
    result.PrimaryAssertion = result.ExpectedResult;
  }
  if (!result.GenerationOrder) result.GenerationOrder = 1000;
  return result;
}

function generic(base, spec) { return clean(base, { ...spec, generic: true }); }
function pending(base, spec) { return clean(base, { ...spec, gapId: spec.gapId, gap: spec.gap, generic: false }); }

function cloneWith(base, spec) { return spec.map((item) => (item.gapId ? pending(base, item) : generic(base, item))); }

export function buildEffectiveProjectCases(sourceCases) {
  const byTitle = new Map(sourceCases.map((item) => [item.Title, item]));
  const used = new Set();
  const output = [];
  const take = (title) => {
    const item = byTitle.get(title);
    if (!item) throw new Error(`Missing project source case: ${title}`);
    used.add(title);
    return item;
  };
  const add = (sourceTitle, specs) => output.push(...cloneWith(take(sourceTitle), specs));

  // Approved cases are retained, but generic filler and implicit permission preconditions are removed.
  for (const item of sourceCases.filter((candidate) => candidate.ExpectedStatus === 'EXPECTED_CONFIRMED')) {
    if (item.Title === '用户查询-默认查询') continue;
    const normalized = clean(item, {
      id: item.TestCaseId,
      title: item.Title,
      operation: item.Operation,
      preconditions: (item.Preconditions ?? []).filter((value) => value !== '管理员具备该功能所需权限。'),
      data: item.TestData,
      steps: item.Steps,
      cleanup: item.Cleanup,
      expected: item.ExpectedResult,
    });
    output.push(normalized);
    used.add(item.Title);
  }

  add('用户查询-默认查询', [{ id: 'TC-USER-QUERY-001', title: '用户查询-默认加载', subject: '当前查询页面可用数据集', preconditions: ['用户管理页面已打开。'], data: [rows('查询数据', '页面当前可用的测试用户记录', '项目测试数据')], steps: ['打开用户管理页面。', '等待初始查询完成。', '观察列表是否显示当前数据集。'] }]);
  add('用户查询-无匹配结果', [{ id: 'TC-USER-QUERY-002', title: '用户查询-无匹配结果', subject: '不存在的用户标识', preconditions: ['用户管理页面已打开。'], data: [rows('查询条件', '确认不存在的用户标识', '确定无匹配数据')], steps: ['在用户名查询框输入不存在的用户标识。', '点击查询。', '检查结果集。'] }]);
  add('用户查询-清空筛选条件', [{ id: 'TC-USER-RESET-001', title: '用户查询-清空筛选条件', operation: 'RESET', entityName: '用户记录', subject: '已输入的筛选条件', preconditions: ['用户管理页面已打开。'], data: [rows('筛选条件', '一个可以产生结果变化的合法条件', '测试查询数据')], steps: ['输入筛选条件并执行查询。', '点击重置或清空筛选。', '观察筛选控件和查询结果。'] }]);
  add('用户查询-分页与切页条件保持', [{ id: 'TC-USER-PAGE-001', title: '用户查询-分页切页', operation: 'PAGINATION', entityName: '用户记录', subject: '当前生效筛选条件', preconditions: ['用户管理页面已打开。', '测试数据足以形成至少两页结果。'], data: [rows('查询数据', '覆盖多个页面的测试用户记录', '项目测试数据')], steps: ['执行合法查询。', '切换到另一页。', '检查当前页数据和筛选条件。'] }]);

  // The old “exact/fuzzy” cases were generator-invented detail and are intentionally not materialized.
  used.add('用户查询-用户名精确查询');
  used.add('用户查询-显示名模糊查询');

  add('用户修改-单字段与重复值校验', [
    { id: 'TC-USER-UPDATE-001', title: '用户修改-合法字段保存', operation: 'UPDATE', entityName: '用户记录', preconditions: ['存在本轮测试自有且可修改的用户记录。'], data: [rows('修改字段', '一个允许修改的合法字段值', '项目已知可修改字段')], steps: ['打开测试用户编辑页面。', '修改一个合法字段。', '保存。', '重新查询并读取该用户。'], cleanup: '将修改字段恢复原值并重新查询确认。' },
    { id: 'TC-USER-UPDATE-002', title: '用户修改-唯一字段重复校验', operation: 'UPDATE', entityName: '用户记录', preconditions: ['存在测试用户 A。', '存在另一条具有唯一值的基准用户 B。'], data: [rows('唯一字段', '用户 B 的唯一值', '重复数据')], steps: ['打开测试用户 A 的编辑页面。', '将唯一字段改为用户 B 的值。', '保存并重新查询用户 A。'], cleanup: '确认用户 A 和 B 的原值未被误修改。', gapId: 'GAP-GEN-USER-UPDATE-DUPLICATE-001', gap: '唯一字段修改后的重复值处理规则和失败后原值保持规则未获批准。' },
  ]);

  add('用户删除-删除后查询/重复删除/重新创建', [
    { id: 'TC-USER-DELETE-001', title: '用户删除-正常删除', operation: 'DELETE', entityName: '用户记录', preconditions: ['存在本轮测试自有且可删除的用户记录。'], data: [rows('测试对象', '本轮测试自有用户记录', '可清理')], steps: ['选中测试用户。', '点击删除并确认。', '观察删除结果。'] },
    { id: 'TC-USER-QUERY-003', title: '用户删除-删除后查询', operation: 'QUERY', entityName: '用户记录', subject: '已删除用户标识', preconditions: ['测试用户已完成删除。'], data: [rows('查询条件', '已删除用户的唯一标识', '删除后查询')], steps: ['按已删除用户的唯一标识查询。', '检查正常业务结果集。'] },
    { id: 'TC-USER-DELETE-002', title: '用户删除-重复删除', operation: 'DELETE', entityName: '用户记录', preconditions: ['同一测试用户已完成第一次删除。'], data: [rows('测试对象', '第一次删除后的用户标识', '已删除对象')], steps: ['再次提交同一用户的删除操作。', '记录页面反馈和查询结果。'], gapId: 'GAP-GEN-USER-DELETE-REPEAT-001', gap: '重复删除的幂等成功、对象不存在提示或业务错误规则未获批准。' },
    { id: 'TC-USER-CREATE-006', title: '用户删除-删除后同唯一键重建', operation: 'CREATE', entityName: '用户记录', preconditions: ['原测试用户已完成删除。'], data: [rows('唯一字段', '原测试用户的唯一值', '删除后复用')], steps: ['打开新增页面。', '使用原测试用户的唯一值提交合法数据。', '重新查询该唯一值。'], cleanup: '按批准规则清理重建对象。', gapId: 'GAP-GEN-USER-DELETE-RECREATE-001', gap: '删除后是否允许使用原唯一键重新创建对象的规则未获批准。' },
  ]);

  add('角色查询与角色新增校验', [
    { id: 'TC-ROLE-QUERY-001', title: '角色查询-按名称查询', operation: 'QUERY', entityName: '角色记录', subject: '角色名称查询条件', preconditions: ['角色管理页面已打开。', '存在可查询的测试角色。'], data: [rows('查询条件', '测试角色名称', '项目测试数据')], steps: ['输入角色名称查询条件。', '点击查询。', '检查结果是否符合查询条件。'] },
    { id: 'TC-ROLE-CREATE-001', title: '角色新增-合法数据创建', operation: 'CREATE', entityName: '角色记录', preconditions: ['角色管理页面已打开。', '测试角色名称当前不存在。'], data: [rows('角色名称', '本轮唯一测试角色名称', '测试自有数据')], steps: ['点击新增。', '输入合法且唯一的角色数据。', '保存。', '重新查询该角色。'], cleanup: '删除本轮测试角色并重新查询确认。' },
  ]);

  add('角色关联-解除/重复绑定/权限变化', [
    { id: 'TC-URB-UNBIND-001', title: '角色关联-解除关联', operation: 'RELATIONSHIP', entityName: '关联关系', preconditions: ['测试对象和关联对象已存在。', '记录运行前关联状态。'], data: [rows('关联对象', '本轮测试对象关系', '可恢复')], steps: ['打开关联维护页面。', '解除一条已存在的测试关联。', '保存并重新查询关联。'], cleanup: '恢复运行前关联状态。', gapId: 'GAP-GEN-ROLE-RELATION-REMOVE-001', gap: '解除关联后的权限刷新和在线会话生效时机未获批准。' },
    { id: 'TC-URB-BIND-002', title: '角色关联-重复绑定', operation: 'RELATIONSHIP', entityName: '关联关系', preconditions: ['测试关联已存在。'], data: [rows('关联关系', '已存在的测试关联', '重复数据')], steps: ['再次提交同一关联。', '记录保存结果和关系数量。'], cleanup: '保持原关联状态。', gapId: 'GAP-GEN-ROLE-RELATION-DUPLICATE-001', gap: '重复绑定应拒绝、幂等成功或产生错误的规则未获批准。' },
    { id: 'TC-URB-PERMISSION-001', title: '角色关联-权限变化生效', operation: 'PERMISSION', entityName: '权限关系', preconditions: ['存在具备不同权限的测试身份。', '测试对象关系已准备。'], data: [rows('权限变更', '批准的测试角色权限变化', '权限测试数据')], steps: ['调整测试身份的角色关联。', '刷新页面或重新登录。', '访问受影响功能并记录结果。'], cleanup: '恢复测试身份的原角色关联。', gapId: 'GAP-GEN-ROLE-RELATION-EFFECTIVE-001', gap: '关联权限变化对菜单、页面、按钮和在线会话的生效时机未获批准。' },
  ]);

  add('权限访问-菜单/页面/按钮/直接 URL', [
    ...['菜单', '页面', '按钮', '直接 URL'].map((surface, index) => ({ id: `TC-ROLE-PERMISSION-${String(index + 1).padStart(3, '0')}`, title: `权限访问-${surface}拒绝`, operation: 'PERMISSION', entityName: '受保护功能', preconditions: ['权限模型中已存在无目标权限的测试身份。'], data: [rows('权限身份', '无目标权限测试身份', '权限矩阵')], steps: [`使用无目标权限测试身份检查${surface}访问。`, '记录访问结果和页面反馈。'], gapId: `GAP-GEN-PERMISSION-${index + 1}`, gap: `${surface}层级的拒绝合同和可观察结果未获批准。` })),
  ]);

  add('任务查询-默认/条件/分页/排序', [
    { id: 'TC-TQUERY-QUERY-001', title: '任务查询-默认加载', operation: 'QUERY', entityName: '任务记录', subject: '当前任务查询页面数据集', preconditions: ['任务查询页面已打开。'], data: [rows('查询数据', '项目测试任务数据', '只读查询')], steps: ['打开任务查询页面。', '等待初始查询完成。', '检查当前数据集。'] },
    { id: 'TC-TQUERY-QUERY-002', title: '任务查询-按条件查询', operation: 'QUERY', entityName: '任务记录', subject: '已知任务查询条件', preconditions: ['任务查询页面已打开。', '存在可区分的测试任务数据。'], data: [rows('查询条件', '一个已知任务属性值', '项目测试数据')], steps: ['输入查询条件。', '点击查询。', '检查结果集。'] },
    { id: 'TC-TQUERY-PAGE-001', title: '任务查询-分页', operation: 'PAGINATION', entityName: '任务记录', subject: '当前任务筛选条件', preconditions: ['查询结果足以形成至少两页。'], data: [rows('查询数据', '覆盖多个页面的任务记录', '项目测试数据')], steps: ['执行查询。', '切换到另一页。', '检查页内数据和筛选条件。'] },
    { id: 'TC-TQUERY-QUERY-003', title: '任务查询-排序', operation: 'QUERY', entityName: '任务记录', subject: '指定排序条件', preconditions: ['任务查询页面已打开。', '页面显示可排序字段。'], data: [rows('排序数据', '可区分排序顺序的任务记录', '项目测试数据')], steps: ['选择一个排序字段和方向。', '执行查询或排序。', '检查结果顺序。'], gapId: 'GAP-GEN-TASK-QUERY-SORT-001', gap: '排序字段、方向和相同值时的稳定顺序未获批准。' },
  ]);

  add('任务新增-重复任务', [{ id: 'TC-TNEW-CREATE-006', title: '任务新增-重复任务', operation: 'CREATE', entityName: '任务记录', preconditions: ['已存在一条相同业务依赖的基准任务。'], data: [rows('任务依赖', '与基准任务相同的合法依赖', '重复数据')], steps: ['打开任务新增页面。', '填写与基准任务相同的业务依赖。', '提交并查询任务列表。'], cleanup: '按批准方案清理可能产生的任务。', gapId: 'GAP-GEN-TASK-DUPLICATE-001', gap: '重复任务应拒绝、幂等成功或新建任务的规则未获批准。' }]);
  add('任务新增-缺少必填依赖', [{ id: 'TC-TNEW-CREATE-007', title: '任务新增-缺少必填依赖', operation: 'CREATE', entityName: '任务记录', preconditions: ['任务新增页面已打开。'], data: [rows('必填依赖', '缺少一个页面标示为必填的依赖', '页面可观察约束')], steps: ['打开任务新增页面。', '保持一个必填依赖为空。', '填写其余合法数据并保存。', '查询任务列表。'], gapId: 'GAP-GEN-TASK-REQUIRED-001', gap: '缺少该依赖时的拒绝提示和是否产生任务的业务合同未获批准。' }]);
  add('任务生命周期-新增后查询/取消后查询', [
    { id: 'TC-TLIFE-QUERY-001', title: '任务生命周期-新增后查询', operation: 'QUERY', entityName: '任务记录', subject: '刚创建任务的唯一标识', preconditions: ['合法任务依赖已准备。', '测试任务尚不存在。'], data: [rows('任务标识', '本轮唯一任务标识', '测试自有数据')], steps: ['创建一条合法测试任务。', '按任务标识重新查询。', '检查关键字段。'], cleanup: '按批准方案清理测试任务。' },
    { id: 'TC-TLIFE-CANCEL-001', title: '任务生命周期-取消后查询', operation: 'STATE_TRANSITION', entityName: '任务记录', subject: '取消后的任务状态和可见性', preconditions: ['存在可取消的测试任务。'], data: [rows('任务对象', '本轮测试任务', '可清理')], steps: ['执行取消操作。', '重新查询任务。', '记录状态和列表可见性。'], cleanup: '按批准方案清理或恢复测试任务。', gapId: 'GAP-GEN-TASK-LIFECYCLE-CANCEL-001', gap: '取消后的状态、查询可见性和终态清理规则未获批准。' },
  ]);
  add('任务状态-取消状态矩阵补充', [{ id: 'TC-TCANCEL-CANCEL-003', title: '任务状态-取消状态矩阵', operation: 'STATE_TRANSITION', entityName: '任务记录', preconditions: ['已准备批准的测试任务状态夹具。'], data: [rows('任务状态', '待确认的状态矩阵样本', '状态测试数据')], steps: ['选择目标状态的测试任务。', '执行取消操作。', '重新查询状态并记录结果。'], cleanup: '恢复或清理测试任务。', gapId: 'GAP-GEN-TASK-STATE-001', gap: '任务状态与取消操作的允许矩阵未获批准。' }]);

  add('车辆查询-精确编号/无结果', [
    { id: 'TC-VEH-QUERY-001', title: '车辆查询-按编号查询', operation: 'QUERY', entityName: '车辆记录', subject: '车辆编号查询条件', preconditions: ['车辆管理页面已打开。', '存在测试车辆记录。'], data: [rows('查询条件', '测试车辆编号', '项目测试数据')], steps: ['输入车辆编号查询条件。', '点击查询。', '检查结果集。'] },
    { id: 'TC-VEH-QUERY-002', title: '车辆查询-无匹配结果', operation: 'QUERY', entityName: '车辆记录', subject: '不存在的车辆标识', preconditions: ['车辆管理页面已打开。'], data: [rows('查询条件', '确认不存在的车辆标识', '确定无匹配数据')], steps: ['输入不存在的车辆标识。', '点击查询。', '检查结果集中没有匹配记录。'] },
  ]);
  add('车辆新增-编号为空/名称为空/长度边界', [
    { id: 'TC-VEH-CREATE-004', title: '车辆新增-编号为空', operation: 'CREATE', entityName: '车辆记录', preconditions: ['车辆新增页面已打开。'], data: [rows('车辆编号', '空值', '待确认必填规则')], steps: ['保持车辆编号为空。', '填写其余合法字段。', '保存并查询车辆列表。'], gapId: 'GAP-GEN-VEHICLE-REQUIRED-ID-001', gap: '车辆编号为空时的必填校验合同未获批准。' },
    { id: 'TC-VEH-CREATE-005', title: '车辆新增-名称为空', operation: 'CREATE', entityName: '车辆记录', preconditions: ['车辆新增页面已打开。'], data: [rows('车辆名称', '空值', '待确认必填规则')], steps: ['保持车辆名称为空。', '填写其余合法字段。', '保存并查询车辆列表。'], gapId: 'GAP-GEN-VEHICLE-REQUIRED-NAME-001', gap: '车辆名称为空时的必填校验合同未获批准。' },
    { id: 'TC-VEH-CREATE-006', title: '车辆新增-编号长度边界', operation: 'CREATE', entityName: '车辆记录', preconditions: ['车辆新增页面已打开。', '已取得批准的编号长度边界。'], data: [rows('车辆编号', '批准边界值及越界值', '批准规则')], steps: ['分别输入批准边界值和越界值。', '填写其余合法字段。', '分别保存并查询结果。'], gapId: 'GAP-GEN-VEHICLE-LENGTH-001', gap: '车辆编号长度边界和越界处理合同未获批准。' },
  ]);
  add('车辆新增-非法字符', [{ id: 'TC-VEH-CREATE-007', title: '车辆新增-非法字符', operation: 'CREATE', entityName: '车辆记录', preconditions: ['车辆新增页面已打开。', '已取得批准的字符集合。'], data: [rows('车辆编号', '批准规则中的非法字符样本', '批准规则')], steps: ['输入含非法字符的车辆编号。', '填写其余合法字段。', '保存并查询车辆列表。'], gapId: 'GAP-GEN-VEHICLE-CHARSET-001', gap: '车辆编号允许字符集合和拒绝行为未获批准。' }]);
  add('车辆修改-正常修改/原值/非法字段', [
    { id: 'TC-VEH-UPDATE-001', title: '车辆修改-合法字段保存', operation: 'UPDATE', entityName: '车辆记录', preconditions: ['存在本轮测试自有且可修改的车辆记录。'], data: [rows('修改字段', '一个允许修改的合法字段值', '项目已知可修改字段')], steps: ['打开测试车辆编辑页面。', '修改一个合法字段。', '保存并重新查询车辆。'], cleanup: '恢复原值并重新查询确认。' },
    { id: 'TC-VEH-UPDATE-002', title: '车辆修改-非法字段', operation: 'UPDATE', entityName: '车辆记录', preconditions: ['存在可修改的测试车辆。'], data: [rows('修改字段', '批准规则之外的字段或值', '批准规则')], steps: ['打开测试车辆编辑页面。', '输入非法字段值。', '保存并重新查询车辆。'], cleanup: '确认原值未被误修改。', gapId: 'GAP-GEN-VEHICLE-UPDATE-INVALID-001', gap: '车辆字段可修改范围和非法值处理合同未获批准。' },
  ]);
  add('车辆删除-删除后查询', [{ id: 'TC-VEH-DELETE-001', title: '车辆删除-正常删除后查询', operation: 'DELETE', entityName: '车辆记录', preconditions: ['存在本轮测试自有且可安全删除的车辆记录。', '已确认不会影响真实设备。'], data: [rows('测试对象', '本轮测试自有车辆记录', '安全夹具')], steps: ['删除测试车辆。', '按车辆标识重新查询。', '检查正常业务结果集。'], eligibility: 'MANUAL_REQUIRED' }]);

  add('统计查询-默认条件', [{ id: 'TC-STAT-QUERY-003', title: '统计查询-默认加载', operation: 'QUERY', entityName: '统计结果', subject: '当前统计页面默认查询', preconditions: ['统计查询页面已打开。'], data: [rows('统计数据', '批准的只读统计数据', '基准数据')], steps: ['打开统计查询页面。', '等待初始查询完成。', '检查统计结果或无数据状态。'] }]);
  add('统计查询-单月与跨月', [{ id: 'TC-STAT-QUERY-004', title: '统计查询-按时间范围查询', operation: 'QUERY', entityName: '统计结果', subject: '合法时间范围', preconditions: ['统计查询页面已打开。', '已准备合法时间范围和统计数据。'], data: [rows('时间范围', '批准的合法时间范围', '基准数据')], steps: ['输入合法时间范围。', '点击查询。', '检查统计结果属于该时间范围。'] }]);
  add('统计查询-组合筛选后重置', [{ id: 'TC-STAT-RESET-001', title: '统计查询-组合条件重置', operation: 'RESET', entityName: '统计结果', subject: '组合筛选条件', preconditions: ['统计查询页面已打开。'], data: [rows('筛选条件', '两个合法组合筛选条件', '项目测试数据')], steps: ['输入组合筛选条件并查询。', '点击重置。', '检查筛选控件和默认查询状态。'] }]);
  add('统计查询-分页与排序', [
    { id: 'TC-STAT-PAGE-001', title: '统计查询-分页', operation: 'PAGINATION', entityName: '统计结果', subject: '当前统计筛选条件', preconditions: ['统计结果足以形成至少两页。'], data: [rows('统计数据', '覆盖多个页面的只读统计数据', '基准数据')], steps: ['执行统计查询。', '切换到另一页。', '检查页内数据和筛选条件。'] },
    { id: 'TC-STAT-QUERY-005', title: '统计查询-排序', operation: 'QUERY', entityName: '统计结果', subject: '指定排序条件', preconditions: ['统计页面显示可排序字段。'], data: [rows('排序数据', '可区分排序顺序的统计结果', '基准数据')], steps: ['选择排序字段和方向。', '执行排序。', '检查结果顺序。'], gapId: 'GAP-GEN-STATS-SORT-001', gap: '统计结果排序字段、方向和稳定顺序未获批准。' },
  ]);
  add('统计查询-开始等于结束/开始晚于结束', [{ id: 'TC-STAT-VALIDATE-001', title: '统计查询-时间范围边界', operation: 'VALIDATION', entityName: '统计查询', preconditions: ['统计查询页面已打开。'], data: [rows('时间范围', '开始等于结束、开始晚于结束', '边界数据')], steps: ['分别输入两种时间范围。', '分别点击查询。', '记录校验结果。'], gapId: 'GAP-GEN-STATS-RANGE-001', gap: '时间范围边界是否合法以及无效时的拒绝合同未获批准。' }]);
  add('统计查询-缺少开始/结束时间', [{ id: 'TC-STAT-VALIDATE-002', title: '统计查询-缺少时间条件', operation: 'VALIDATION', entityName: '统计查询', preconditions: ['统计查询页面已打开。'], data: [rows('时间条件', '缺少开始或结束时间', '边界数据')], steps: ['清空一个时间字段。', '点击查询。', '记录校验结果。'], gapId: 'GAP-GEN-STATS-MISSING-001', gap: '缺少时间字段时的校验合同未获批准。' }]);
  add('统计查询-超出允许时间范围', [{ id: 'TC-STAT-VALIDATE-003', title: '统计查询-超出允许范围', operation: 'VALIDATION', entityName: '统计查询', preconditions: ['统计查询页面已打开。', '已取得允许时间范围规则。'], data: [rows('时间范围', '批准范围之外的时间值', '边界数据')], steps: ['输入超出允许范围的时间。', '点击查询。', '记录校验结果。'], gapId: 'GAP-GEN-STATS-OVER-001', gap: '超出允许时间范围时的拒绝或裁剪行为未获批准。' }]);
  add('统计查询-非法格式', [{ id: 'TC-STAT-VALIDATE-004', title: '统计查询-非法格式', operation: 'VALIDATION', entityName: '统计查询', preconditions: ['统计查询页面已打开。'], data: [rows('筛选字段', '批准规则中的非法格式样本', '批准规则')], steps: ['输入非法格式筛选值。', '点击查询。', '记录校验结果。'], gapId: 'GAP-GEN-STATS-FORMAT-001', gap: '非法筛选格式和拒绝提示合同未获批准。' }]);

  for (const item of sourceCases) {
    if (used.has(item.Title) || item.ExpectedStatus === 'EXPECTED_CONFIRMED') continue;
    output.push(pending(item, {
      id: item.Title === '用户新增-显示名超长' ? 'TC-USER-CREATE-007' : item.Title === '用户新增-用户名长度边界' ? 'TC-USER-CREATE-008' : item.Title === '用户新增-非法字符' ? 'TC-USER-CREATE-009' : 'TC-USER-UPDATE-003',
      title: item.Title,
      operation: item.Operation,
      entityName: item.FeatureName,
      preconditions: [`${item.FeatureName}页面可访问。`],
      data: [rows('测试输入', '批准规则中的该场景数据', '业务规则数据')],
      steps: [`进入${item.FeatureName}功能。`, `按照“${item.Title}”准备对应测试输入。`, '提交或执行当前场景操作。', '检查页面结果和业务对象状态。'],
      cleanup: ['CREATE', 'UPDATE', 'DELETE', 'STATE_TRANSITION', 'RELATIONSHIP'].includes(item.Operation) ? '按本用例实际产生的数据执行清理或恢复。' : '',
      gapId: item.ExpectationGapId,
      gap: item.ExpectationGap ?? '该场景的业务判定规则未获批准。',
    }));
    used.add(item.Title);
  }
  const normalized = output.map((item, index) => ({ ...item, GenerationOrder: index + 1, PermissionApplicability: PROJECT_PERMISSION_APPLICABILITY }));
  return applyStableIds(normalized).TestCases;
}

export function projectGenerationMetrics(previousCases, currentCases) {
  const generic = currentCases.filter((item) => item.ExpectedBasis === EXPECTED_BASIS.DESIGN_DEFAULT);
  const gaps = currentCases.filter((item) => item.ExpectedStatus === 'EXPECTED_PENDING_AUTHORITY');
  const oldGapCount = previousCases.filter((item) => item.ExpectationGapId).length;
  return {
    PreviousCaseCount: previousCases.length,
    CurrentCaseCount: currentCases.length,
    AtomicCaseCount: currentCases.filter((item) => item.CaseKind === 'ATOMIC').length,
    CompositeCaseCount: currentCases.filter((item) => item.CaseKind !== 'ATOMIC').length,
    DesignDefaultExpectedCount: generic.length,
    AuthoritativeExpectedCount: currentCases.filter((item) => item.ExpectedBasis === EXPECTED_BASIS.AUTHORITATIVE_RULE || item.ExpectedBasis === 'HANDOFF_BASELINE').length,
    PendingAuthorityExpectedCount: gaps.length,
    ExpectationGapCount: gaps.filter((item) => item.ExpectationGapId).length,
    OverconfirmedGapRemovedCount: oldGapCount - gaps.length,
    CasesSplitForAtomicity: currentCases.length - previousCases.length + previousCases.filter((item) => ['用户查询-用户名精确查询', '用户查询-显示名模糊查询'].includes(item.Title)).length,
    PermissionCasesGenerated: currentCases.filter((item) => item.Operation === 'PERMISSION').length,
    PermissionInjectedIntoOrdinaryCases: currentCases.filter((item) => item.Operation !== 'PERMISSION' && (item.Preconditions ?? []).some((value) => /管理员具备.*权限/.test(value))).length,
    GenericFillerRemovedCount: previousCases.length,
    QueryCasesUsingDesignDefault: generic.filter((item) => item.Operation === 'QUERY').length,
    CreateCasesUsingDesignDefault: generic.filter((item) => item.Operation === 'CREATE').length,
    UpdateCasesUsingDesignDefault: generic.filter((item) => item.Operation === 'UPDATE').length,
    DeleteCasesUsingDesignDefault: generic.filter((item) => item.Operation === 'DELETE').length,
    SafetySeparatedFromExpectedCount: currentCases.filter((item) => item.ExpectedBasis === EXPECTED_BASIS.DESIGN_DEFAULT && item.AutomationEligibility === 'MANUAL_REQUIRED').length,
  };
}
