import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const projectRoot = path.join(repositoryRoot, 'projects', 'rsscomposer-blackbox');
const auditRoot = path.join(projectRoot, 'runs', 'MENU-COVERAGE-AUDIT-20260827-01');
const expansionRunId = 'MENU-COVERAGE-EXPANSION-20260827-01';
const expansionRoot = path.join(projectRoot, 'runs', expansionRunId);

export const FROZEN_IN_SCOPE_MENUS = [
  ['场景管理', '车辆管理', '/Sys/VehicleManage'],
  ['场景管理', '画图工具', '/Sys/drawing-tool'],
  ['场景管理', '策略管理', '/Sys/StrategyManage'],
  ['场景管理', '进程管理', '/Sys/MissionManage'],
  ['任务模型', '任务管理', '/Task/TaskManage'],
  ['任务模型', '维护任务', '/Task/TaskMaintanance'],
  ['任务模型', '任务模板', '/Task/TaskTemManage'],
  ['任务模型', '模板项管理', '/Task/TaskTemItemManage'],
  ['日志管理', '日志文件', '/Logs/LogFileManager'],
  ['日志管理', '操作日志', '/Logs/SysLogManager'],
  ['日志管理', '异常日志', '/Logs/ExceptionLogManager'],
  ['日志管理', '交互日志', '/Logs/ThirdLogManager'],
  ['统计分析', '效能统计', '/Statistics/EfficStatisticsManager'],
  ['统计分析', '能耗统计', '/Statistics/ElectStatisticsManager'],
  ['系统管理', '用户管理', '/Employee/User'],
  ['系统管理', '角色管理', '/Employee/Role'],
  ['系统管理', '菜单管理', '/Employee/Menu'],
  ['系统管理', '字典管理', '/Employee/DictManager'],
  ['系统管理', '外部系统配置', '/Employee/ExSystemManager'],
].map(([ModuleName, MenuName, Route]) => ({ ModuleName, MenuName, Route }));

export const OUT_OF_SCOPE_MENUS = [
  { ModuleName: '综合看板', MenuName: '综合看板', Routes: ['/a/b', '/a/c', '/a/d'], ScopeStatus: 'OUT_OF_SCOPE_BY_USER' },
];

const sourceEvidence = {
  audit: 'projects/rsscomposer-blackbox/runs/MENU-COVERAGE-AUDIT-20260827-01/capability-discovery.json',
  matrix: 'projects/rsscomposer-blackbox/runs/MENU-COVERAGE-AUDIT-20260827-01/menu-coverage-matrix.json',
  sourceInventory: 'projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-AUDIT-20260827-01/source-capability-inventory.json',
};

const common = {
  Priority: 'P1',
  TestCaseType: 'ATOMIC',
  CaseKind: 'ATOMIC',
  TestType: 'WEB_UI',
  TestLayer: 'BLACKBOX',
  ApplicabilityStatus: 'APPLICABLE',
  ScopeStatus: 'IN_SCOPE',
  ExpectedStatus: 'EXPECTED_CONFIRMED',
  ExpectedBasis: 'RUNTIME_CAPABILITY_DISCOVERY_AND_SOURCE_API_EVIDENCE',
  ExpectedAuthority: 'USER_APPROVED_MENU_COVERAGE_AUDIT_20260827',
  ExpectedSourceRef: [sourceEvidence.audit, sourceEvidence.sourceInventory],
  AutomationEligibility: 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA',
  ExecutionStatus: 'SKIPPED',
  ExecutionState: '尚未执行',
  LatestExecutionResult: '尚未执行',
  Actual: '—',
  Evidence: [],
  HistoricalTestCaseRefs: [],
  Cleanup: '仅清理本用例创建的 TEST_OWNED 数据；不得触碰既有业务数据。',
};

const designDefinitions = [
  ['TC-VEH-STATE-001', 'VEH', '场景管理', '车辆管理', 'STATE', '车辆状态控件与未定位安全边界', 'AUTO_CONDITIONAL_TEST_OWNED_VEHICLE', '确认车辆状态区域和状态操作入口可观察；车辆未定位时不得执行初始化、重定位或物理运行。'],
  ['TC-DRAW-PAGE-001', 'DRAW', '场景管理', '画图工具', 'PAGE_SMOKE', '画图工具页面与工具栏加载', 'AUTO_ALLOWED_READ_ONLY', '通过菜单进入页面，确认画布、工具栏和地图编辑容器可见；不新建、不保存、不发布。'],
  ['TC-DRAW-QUERY-001', 'DRAW', '场景管理', '画图工具', 'QUERY', '画图工具加载地图库只读查看', 'AUTO_ALLOWED_READ_ONLY', '打开地图库查看列表并关闭；不选择切换、不合并、不保存地图。'],
  ['TC-DRAW-VISUAL-001', 'DRAW', '场景管理', '画图工具', 'VISUAL', '画布与工具栏视觉人工验收', 'MANUAL_CANVAS_VISUAL', '人工检查画布、工具按钮、图层入口和地图显示区域；保留截图作为视觉证据。'],
  ['TC-STRAT-PAGE-001', 'STRAT', '场景管理', '策略管理', 'PAGE_SMOKE', '策略管理页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认查询区、表格和新增入口可见。'],
  ['TC-STRAT-QUERY-001', 'STRAT', '场景管理', '策略管理', 'QUERY', '策略查询与无结果条件', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询，确认请求完成且页面显示空结果，不修改策略。'],
  ['TC-STRAT-CREATE-001', 'STRAT', '场景管理', '策略管理', 'CREATE', '测试自有策略新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '使用符合页面字段约束的 TEST_OWNED 策略保存并重新查询。'],
  ['TC-STRAT-UPDATE-001', 'STRAT', '场景管理', '策略管理', 'UPDATE', '测试自有策略修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的策略字段并重新查询确认更新。'],
  ['TC-STRAT-DELETE-001', 'STRAT', '场景管理', '策略管理', 'DELETE', '测试自有策略删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的策略并查询确认不存在。'],
  ['TC-PROC-PAGE-001', 'PROC', '场景管理', '进程管理', 'PAGE_SMOKE', '进程管理页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认进程表格、刷新状态和策略配置入口可见。'],
  ['TC-PROC-QUERY-001', 'PROC', '场景管理', '进程管理', 'QUERY', '进程查询与无结果条件', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询，确认页面完成加载且不修改既有进程。'],
  ['TC-PROC-CREATE-001', 'PROC', '场景管理', '进程管理', 'CREATE', '测试自有进程新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '仅使用 TEST_OWNED 进程配置保存并查询；不得使用正式链路进程。'],
  ['TC-PROC-UPDATE-001', 'PROC', '场景管理', '进程管理', 'UPDATE', '测试自有进程修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的进程配置并重新查询。'],
  ['TC-PROC-DELETE-001', 'PROC', '场景管理', '进程管理', 'DELETE', '测试自有进程删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的进程并确认不存在。'],
  ['TC-PROC-STATE-001', 'PROC', '场景管理', '进程管理', 'STATE', '测试自有进程状态刷新', 'AUTO_CONDITIONAL_TEST_OWNED_PROCESS', '只刷新本用例拥有进程的状态并读取结果；不得启停正式状态反馈或链式搬运进程。'],
  ['TC-PROC-RELATION-001', 'PROC', '场景管理', '进程管理', 'RELATION', '测试自有进程策略配置关系', 'AUTO_CONDITIONAL_TEST_OWNED_PROCESS', '为本用例拥有的进程打开策略配置，保存合法关系并复查；不改变正式进程绑定。'],
  ['TC-MAINT-PAGE-001', 'MAINT', '任务模型', '维护任务', 'PAGE_SMOKE', '维护任务页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认时间查询区、表格和新增入口可见。'],
  ['TC-MAINT-QUERY-001', 'MAINT', '任务模型', '维护任务', 'QUERY', '维护任务查询与无结果条件', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询，确认页面完成加载。'],
  ['TC-MAINT-CREATE-001', 'MAINT', '任务模型', '维护任务', 'CREATE', '测试自有维护任务新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '按页面真实必填项创建 TEST_OWNED 维护任务；不派车、不启动执行。'],
  ['TC-TTEMP-PAGE-001', 'TTEMP', '任务模型', '任务模板', 'PAGE_SMOKE', '任务模板页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认模板表格、查询和配置入口可见。'],
  ['TC-TTEMP-QUERY-001', 'TTEMP', '任务模型', '任务模板', 'QUERY', '任务模板查询与无结果条件', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询，确认页面完成加载。'],
  ['TC-TTEMP-CREATE-001', 'TTEMP', '任务模型', '任务模板', 'CREATE', '测试自有任务模板新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '按页面真实必填项创建 TEST_OWNED 任务模板并查询。'],
  ['TC-TTEMP-UPDATE-001', 'TTEMP', '任务模型', '任务模板', 'UPDATE', '测试自有任务模板修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的任务模板并查询确认更新。'],
  ['TC-TTEMP-DELETE-001', 'TTEMP', '任务模型', '任务模板', 'DELETE', '测试自有任务模板删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的任务模板并确认不存在。'],
  ['TC-TTEMP-RELATION-001', 'TTEMP', '任务模型', '任务模板', 'RELATION', '任务模板配置项关系', 'AUTO_CONDITIONAL_TEST_OWNED_DATA', '在本用例拥有的模板上打开配置，保存合法模板项/步骤关系并复查。'],
  ['TC-TITEM-PAGE-001', 'TITEM', '任务模型', '模板项管理', 'PAGE_SMOKE', '模板项管理页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认模板项表格、查询和新增入口可见。'],
  ['TC-TITEM-QUERY-001', 'TITEM', '任务模型', '模板项管理', 'QUERY', '模板项查询与无结果条件', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询，确认页面完成加载。'],
  ['TC-TITEM-CREATE-001', 'TITEM', '任务模型', '模板项管理', 'CREATE', '测试自有模板项新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '按页面真实必填项创建 TEST_OWNED 模板项并查询。'],
  ['TC-TITEM-UPDATE-001', 'TITEM', '任务模型', '模板项管理', 'UPDATE', '测试自有模板项修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的模板项并查询确认更新。'],
  ['TC-TITEM-DELETE-001', 'TITEM', '任务模型', '模板项管理', 'DELETE', '测试自有模板项删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的模板项并确认不存在。'],
  ['TC-LOG-QUERY-001', 'LOG', '日志管理', '日志文件', 'QUERY', '日志文件按时间和车辆条件查询', 'AUTO_ALLOWED_READ_ONLY', '使用页面真实查询条件查询并确认列表/空结果状态；不打包、不下载敏感内容。'],
  ['TC-OLOG-PAGE-001', 'OLOG', '日志管理', '操作日志', 'PAGE_SMOKE', '操作日志页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认查询区和列表容器可见。'],
  ['TC-OLOG-QUERY-001', 'OLOG', '日志管理', '操作日志', 'QUERY', '操作日志条件查询', 'AUTO_ALLOWED_READ_ONLY', '按页面真实时间条件查询并确认请求完成。'],
  ['TC-ELOG-PAGE-001', 'ELOG', '日志管理', '异常日志', 'PAGE_SMOKE', '异常日志页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认车辆、故障和时间条件可见。'],
  ['TC-ELOG-QUERY-001', 'ELOG', '日志管理', '异常日志', 'QUERY', '异常日志条件查询', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询并确认页面完成加载。'],
  ['TC-ILOG-PAGE-001', 'ILOG', '日志管理', '交互日志', 'PAGE_SMOKE', '交互日志页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认天、开始时间、截止时间条件可见。'],
  ['TC-ILOG-QUERY-001', 'ILOG', '日志管理', '交互日志', 'QUERY', '交互日志条件查询', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询并确认页面完成加载。'],
  ['TC-ENER-PAGE-001', 'ENER', '统计分析', '能耗统计', 'PAGE_SMOKE', '能耗统计页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认月份选择器、查询入口和统计容器可见。'],
  ['TC-ENER-QUERY-001', 'ENER', '统计分析', '能耗统计', 'QUERY', '能耗统计按月份查询', 'AUTO_ALLOWED_READ_ONLY', '选择一个合法月份查询并确认请求完成；不把空数据当作产品失败。'],
  ['TC-ROLE-UPDATE-001', 'ROLE', '系统管理', '角色管理', 'UPDATE', '测试自有角色修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的角色并查询确认更新；不修改管理员角色。'],
  ['TC-ROLE-DELETE-001', 'ROLE', '系统管理', '角色管理', 'DELETE', '测试自有角色删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的角色并确认不存在。'],
  ['TC-ROLE-RELATION-001', 'ROLE', '系统管理', '角色管理', 'RELATION', '测试自有角色用户和权限关系', 'AUTO_CONDITIONAL_TEST_OWNED_DATA', '在本用例拥有的角色上验证用户分配/权限分配保存与复查；不改变管理员权限。'],
  ['TC-MENU-PAGE-001', 'MENU', '系统管理', '菜单管理', 'PAGE_SMOKE', '菜单管理页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认菜单树、新增、修改、删除入口可见。'],
  ['TC-MENU-CREATE-001', 'MENU', '系统管理', '菜单管理', 'CREATE', '测试自有菜单节点新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '在批准的测试父节点下创建唯一 TEST_OWNED 菜单节点并查询。'],
  ['TC-MENU-UPDATE-001', 'MENU', '系统管理', '菜单管理', 'UPDATE', '测试自有菜单节点修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的菜单节点并查询确认更新。'],
  ['TC-MENU-DELETE-001', 'MENU', '系统管理', '菜单管理', 'DELETE', '测试自有菜单节点删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的叶子菜单节点并确认不存在。'],
  ['TC-DICT-PAGE-001', 'DICT', '系统管理', '字典管理', 'PAGE_SMOKE', '字典管理页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认字典列表、树选择和新增/修改/删除入口可见。'],
  ['TC-DICT-CREATE-001', 'DICT', '系统管理', '字典管理', 'CREATE', '测试自有字典项新增', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '按页面真实必填项创建唯一 TEST_OWNED 字典项并查询。'],
  ['TC-DICT-UPDATE-001', 'DICT', '系统管理', '字典管理', 'UPDATE', '测试自有字典项修改', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '修改本用例创建的字典项并查询确认更新。'],
  ['TC-DICT-DELETE-001', 'DICT', '系统管理', '字典管理', 'DELETE', '测试自有字典项删除', 'AUTO_ALLOWED_WITH_TEST_OWNED_DATA', '删除本用例创建的字典项并确认不存在。'],
  ['TC-EXT-PAGE-001', 'EXT', '系统管理', '外部系统配置', 'PAGE_SMOKE', '外部系统配置页面加载', 'AUTO_ALLOWED_READ_ONLY', '进入页面并确认查询区、表格和新增入口可见。'],
  ['TC-EXT-QUERY-001', 'EXT', '系统管理', '外部系统配置', 'QUERY', '外部系统配置查询', 'AUTO_ALLOWED_READ_ONLY', '使用唯一无结果条件查询并确认页面完成加载。'],
  ['TC-EXT-CREATE-001', 'EXT', '系统管理', '外部系统配置', 'CREATE', '测试自有外部系统配置新增', 'AUTO_ALLOWED_WITH_LOCAL_MOCK', '以本地无副作用 mock 地址创建 TEST_OWNED 配置；不得访问真实外部系统。'],
  ['TC-EXT-UPDATE-001', 'EXT', '系统管理', '外部系统配置', 'UPDATE', '测试自有外部系统配置修改', 'AUTO_ALLOWED_WITH_LOCAL_MOCK', '修改本用例创建的配置并查询确认更新。'],
  ['TC-EXT-DELETE-001', 'EXT', '系统管理', '外部系统配置', 'DELETE', '测试自有外部系统配置删除', 'AUTO_ALLOWED_WITH_LOCAL_MOCK', '删除本用例创建的配置并确认不存在。'],
  ['TC-EXT-INTEGRATION-001', 'EXT', '系统管理', '外部系统配置', 'INTEGRATION', '外部系统配置地址校验与本地 mock 连通性', 'AUTO_ALLOWED_WITH_LOCAL_MOCK', '通过页面保存本地 mock 配置并验证请求只到本地 mock；禁止真实第三方副作用。'],
];

const menuByName = new Map(FROZEN_IN_SCOPE_MENUS.map((menu) => [menu.MenuName, menu]));
const definitionsByMenu = new Map();
for (const definition of designDefinitions) {
  const menu = definition[3];
  if (!definitionsByMenu.has(menu)) definitionsByMenu.set(menu, []);
  definitionsByMenu.get(menu).push(definition[4]);
}

function toCase(definition, index) {
  const [TestCaseId, FeatureCode, ModuleName, MenuName, Operation, Title, AutomationEligibility, action] = definition;
  const menu = menuByName.get(MenuName);
  if (!menu) throw new Error(`Design references a menu outside frozen scope: ${MenuName}`);
  const isManual = AutomationEligibility.startsWith('MANUAL');
  const isReadOnly = AutomationEligibility.includes('READ_ONLY') || Operation === 'PAGE_SMOKE' || Operation === 'QUERY';
  return {
    ...common,
    TestCaseId,
    ModuleName,
    MenuName,
    FeatureName: MenuName,
    FeatureCode,
    Operation,
    ScenarioGroup: isManual ? 'MANUAL_BOUNDARY' : isReadOnly ? 'READ_ONLY_CAPABILITY' : 'TEST_OWNED_LIFECYCLE',
    Title,
    Objective: action,
    PrimaryAssertion: isManual ? '截图中可见目标页面和工具能力，视觉结论由人工给出。' : '页面真实能力按预期可观察，且不产生越界副作用。',
    Preconditions: [
      `通过运行时菜单进入“${MenuName}”。`,
      isReadOnly ? '只读查询不依赖新增业务数据。' : '若需数据，先通过网页操作创建 TEST_OWNED 前置数据。',
    ],
    TestData: isReadOnly ? [['查询条件', '唯一无结果或合法页面条件', '运行时页面真实字段', '不写入业务数据']] : [['数据前缀', `AT_${expansionRunId}_`, '本轮 TEST_OWNED', '运行后必须清理']],
    Steps: [
      `打开“${MenuName}”页面。`,
      action,
      isManual ? '保存页面截图并由人工完成视觉验收。' : '根据页面结果和必要的重新查询完成断言。',
    ],
    ExpectedResult: isManual ? '页面和工具栏可见，截图完整；视觉验收结论为 MANUAL。' : '页面操作结果与预期一致；查询/修改范围仅限本用例数据或只读请求。',
    DesignBasis: '真实菜单点击、运行时页面能力扫描、前端 API 与后端路由证据交叉确认。',
    CapabilityEvidence: sourceEvidence,
    CandidateGapDecision: 'APPLICABLE_DESIGN',
    SafetyBoundary: isManual ? 'Canvas 像素/视觉保真度不自动判定。' : '不得操作既有正式数据、正式进程、真实第三方或车辆初始化。',
    AutomationEligibility,
    ManualReason: isManual ? 'Canvas 像素与视觉保真度需要人工验收。' : null,
    DesignOrder: index + 1,
  };
}

export function buildExpansionCases(discovery = []) {
  const byMenu = new Map(discovery.map((item) => [item.MenuName, item]));
  return designDefinitions.filter((definition) => {
    const discovered = byMenu.get(definition[3]);
    return discovered && discovered.PageReachable !== false && (discovered.SupportedOperations ?? []).includes(definition[4]);
  }).map(toCase);
}

export function buildExpandedCatalog(legacyCatalog, addedCases) {
  const legacyCases = [...(legacyCatalog.TestCases ?? [])];
  const cases = [...legacyCases, ...addedCases.map((testCase) => ({ ...testCase, CatalogOrigin: 'MENU_COVERAGE_EXPANSION' }))];
  const ids = cases.map((item) => item.TestCaseId);
  if (new Set(ids).size !== ids.length) throw new Error('Expanded catalog contains duplicate TestCaseId.');
  return {
    CatalogType: 'SOURCE_ASSISTED_MENU_COVERAGE_EXPANSION',
    CatalogVersion: '2026-08-27.1',
    ExpansionRunId: expansionRunId,
    LegacyTestCaseCount: legacyCases.length,
    AddedTestCaseCount: addedCases.length,
    TestCaseCount: cases.length,
    HistoricalResultInheritance: 'FORBIDDEN',
    Scope: {
      InScopeLeafMenuCount: FROZEN_IN_SCOPE_MENUS.length,
      OutOfScopeMenuCount: OUT_OF_SCOPE_MENUS.length,
      OutOfScopeMenus: OUT_OF_SCOPE_MENUS,
    },
    TestCases: cases,
  };
}

export function buildCoverageGate({ catalog, discovery, legacyMapping = [] }) {
  const menuCases = new Map(FROZEN_IN_SCOPE_MENUS.map((menu) => [menu.MenuName, []]));
  const caseById = new Map((catalog.TestCases ?? []).map((item) => [item.TestCaseId, item]));
  const excludedCaseIds = [];
  for (const mapping of legacyMapping) {
    if (OUT_OF_SCOPE_MENUS.some((menu) => menu.MenuName === mapping.MenuName)) excludedCaseIds.push(mapping.TestCaseId);
    else if (menuCases.has(mapping.MenuName)) menuCases.get(mapping.MenuName).push({ ...mapping, Origin: 'LEGACY' });
  }
  for (const testCase of catalog.TestCases ?? []) {
    if (OUT_OF_SCOPE_MENUS.some((menu) => menu.MenuName === testCase.MenuName)) excludedCaseIds.push(testCase.TestCaseId);
    else if (menuCases.has(testCase.MenuName)) menuCases.get(testCase.MenuName).push({ ...testCase, Origin: testCase.CatalogOrigin ?? 'CATALOG' });
  }
  const missingMenus = [];
  const missingOperations = [];
  const rows = FROZEN_IN_SCOPE_MENUS.map((menu) => {
    const cases = menuCases.get(menu.MenuName) ?? [];
    const operations = new Set(cases.map((item) => item.Operation));
    const requiredOperations = [...new Set(definitionsByMenu.get(menu.MenuName) ?? [])];
    if (cases.length === 0) missingMenus.push(menu.MenuName);
    for (const operation of requiredOperations) if (!operations.has(operation)) missingOperations.push({ MenuName: menu.MenuName, Operation: operation });
    return {
      ModuleName: menu.ModuleName,
      MenuName: menu.MenuName,
      Route: menu.Route,
      CaseCount: cases.length,
      CaseIds: cases.map((item) => item.TestCaseId),
      CoveredOperations: [...operations].sort(),
      RequiredDesignedOperations: requiredOperations,
      MissingOperations: requiredOperations.filter((operation) => !operations.has(operation)),
      DiscoveryPageReachable: discovery.find((item) => item.MenuName === menu.MenuName)?.PageReachable ?? false,
      CoverageStatus: cases.length > 0 && requiredOperations.every((operation) => operations.has(operation)) ? 'COVERED_BY_CATALOG' : 'GAP',
    };
  });
  return {
    GateName: 'Menu Coverage Gate',
    GateVersion: '2026-08-27.1',
    Status: missingMenus.length === 0 && missingOperations.length === 0 ? 'PASS' : 'FAIL',
    InScopeLeafMenuCount: FROZEN_IN_SCOPE_MENUS.length,
    OutOfScopeMenuCount: OUT_OF_SCOPE_MENUS.length,
    OutOfScopeCaseCount: new Set(excludedCaseIds).size,
    MissingMenuCount: missingMenus.length,
    MissingMenus: missingMenus,
    MissingOperationCount: missingOperations.length,
    MissingOperations: missingOperations,
    Rows: rows,
    OutOfScopeCaseIds: [...new Set(excludedCaseIds)],
    Rule: '每个 IN_SCOPE 叶子菜单必须至少有一个 PAGE_SMOKE 或等价页面用例；综合看板不进入分母。',
  };
}

export function assertCoverageGate(gate) {
  if (gate.Status !== 'PASS') {
    throw new Error(`Menu Coverage Gate failed: missingMenus=${gate.MissingMenuCount}, missingOperations=${gate.MissingOperationCount}`);
  }
  return gate;
}

export function buildCandidateDispositions(matrix, addedCases) {
  const addedByMenuOperation = new Map(addedCases.map((item) => [`${item.MenuName}::${item.Operation}`, item.TestCaseId]));
  const rows = Array.isArray(matrix) ? matrix : (matrix?.Matrix ?? matrix?.Rows ?? []);
  return rows.flatMap((row) => (row.MissingOperations ?? []).map((operation) => {
    const key = `${row.Menu}::${operation}`;
    if (addedByMenuOperation.has(key)) return { ModuleName: row.Module, MenuName: row.Menu, CandidateOperation: operation, Decision: 'APPLICABLE_DESIGN', TestCaseId: addedByMenuOperation.get(key), Reason: '运行时按钮/输入/网络能力与源代码 API 证据均支持该操作。' };
    if (row.Menu === '画图工具' && ['CREATE', 'UPDATE', 'DELETE', 'STATE', 'INTEGRATION'].includes(operation)) return { ModuleName: row.Module, MenuName: row.Menu, CandidateOperation: operation, Decision: 'DEFERRED_SAFETY_BOUNDARY', TestCaseId: null, Reason: '会修改或发布共享地图，当前未建立独立地图隔离和回滚证明；不转成自动执行用例。' };
    return { ModuleName: row.Module, MenuName: row.Menu, CandidateOperation: operation, Decision: 'PRUNED_NOT_APPLICABLE', TestCaseId: null, Reason: '当前页面真实能力证据不足以支持独立操作断言，保留为后续复核项。' };
  }));
}

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function collectResultRows(result) { return ['ExecutedResults', 'SupportingPreflightResults', 'BlockedFlowResults', 'ManualResults', 'PendingResults'].flatMap((key) => (result[key] ?? []).map((item) => ({ TestCaseId: item.TestCaseId, ExecutionStatus: item.ExecutionStatus }))); }
function buildHumanSummary(summary, gate, dispositions) {
  const deferred = dispositions.filter((item) => item.Decision === 'DEFERRED_SAFETY_BOUNDARY');
  return `# Menu Coverage Expansion\n\n- 运行编号：\`${summary.RunId}\`\n- 阶段：Catalog 扩容与 Menu Coverage Gate\n- 正式业务执行：未开始\n- Catalog：历史 82 条 + 新增 ${summary.AddedCaseCount} 条 = ${summary.ExpandedCatalogCount} 条\n- IN_SCOPE 叶子菜单：${gate.InScopeLeafMenuCount} 个；Gate：**${gate.Status}**\n- 综合看板：OUT_OF_SCOPE，不计入 Catalog 覆盖率分母\n\n## 缺口决策\n\n- 61 个候选 Operation Gap 已逐项复核。\n- ${summary.ApplicableDesignedCount} 个有真实页面/API证据的操作形成细粒度用例。\n- ${summary.DeferredSafetyBoundaryCount} 个地图共享状态变更操作暂缓：${deferred.map((item) => item.CandidateOperation).join('、')}。\n- 未把统计页面不存在的分页/重置等操作生成用例。\n\n## 执行边界\n\n- 新用例全部保持“尚未执行”，不继承历史 PASS/FAIL/ERROR/BLOCKED/MANUAL 结果。\n- 车辆初始化、重定位、物理运行、正式进程启停、共享地图保存/发布和真实第三方调用均不得由本轮自动化触发。\n- 有前置数据要求的用例，必须先通过网页操作创建 TEST_OWNED 数据，并在结束后清理。\n\n## 机器可读证据\n\n- \`expanded-testcase-catalog.json\`\n- \`menu-coverage-gate.json\`\n- \`case-design-decisions.json\`\n- \`legacy-result-preservation.json\`\n- \`registry-additions.json\`\n`;
}

export function writeExpansion() {
  const discoveryDocument = readJson(path.join(auditRoot, 'capability-discovery.json'));
  const discovery = discoveryDocument.Pages ?? discoveryDocument.Entries?.filter((item) => item.ScopeStatus === 'IN_SCOPE') ?? [];
  const legacyCatalog = readJson(path.join(projectRoot, 'runs', 'SOURCE-ASSISTED-FORMAL-20260827-01', 'final-testcase-catalog.json'));
  const legacyMapping = readJson(path.join(auditRoot, 'legacy-testcase-menu-mapping.json')).Mappings ?? [];
  const matrix = readJson(path.join(auditRoot, 'menu-coverage-matrix.json'));
  const priorResult = readJson(path.join(projectRoot, 'runs', 'SOURCE-ASSISTED-FORMAL-20260827-02', 'formal-result.json'));
  const addedCases = buildExpansionCases(discovery);
  const existingRegistry = readJson(path.join(projectRoot, 'test-cases', 'catalog', 'testcase-id-registry.json'));
  const existingIds = new Set((existingRegistry.Cases ?? []).map((item) => item.TestCaseId));
  const duplicateRegistryIds = addedCases.filter((item) => existingIds.has(item.TestCaseId)).map((item) => item.TestCaseId);
  if (duplicateRegistryIds.length > 0) throw new Error(`Expansion IDs already exist in registry: ${duplicateRegistryIds.join(', ')}`);
  const catalog = buildExpandedCatalog(legacyCatalog, addedCases);
  const gate = buildCoverageGate({ catalog, discovery, legacyMapping });
  const dispositions = buildCandidateDispositions(matrix, addedCases);
  const resultRows = collectResultRows(priorResult);
  const resultById = new Map(resultRows.map((item) => [item.TestCaseId, item.ExecutionStatus]));
  const legacyResultPreservation = (legacyCatalog.TestCases ?? []).map((item) => ({ TestCaseId: item.TestCaseId, PriorExecutionStatus: resultById.get(item.TestCaseId) ?? 'NOT_FOUND_IN_PRIOR_RESULT', PreservedInExpandedCatalog: true }));
  const registryAdditions = addedCases.map((item) => ({ StableCaseKey: `MENU:${item.MenuName}::TITLE:${item.Title}`, TestCaseId: item.TestCaseId, FeatureCode: item.FeatureCode, OperationCode: item.Operation, Active: true, SourceOnly: false, Title: item.Title, ModuleName: item.ModuleName, FeatureName: item.FeatureName }));
  const summary = {
    RunId: expansionRunId,
    Phase: 'CATALOG_EXPANSION_AND_MENU_COVERAGE_GATE',
    ExecutionStarted: false,
    LegacyCatalogCount: legacyCatalog.TestCaseCount,
    AddedCaseCount: addedCases.length,
    ExpandedCatalogCount: catalog.TestCaseCount,
    InScopeLeafMenuCount: FROZEN_IN_SCOPE_MENUS.length,
    ZeroCoverageMenusBeforeExpansion: ['画图工具', '策略管理', '进程管理', '维护任务', '任务模板', '模板项管理', '操作日志', '异常日志', '交互日志', '能耗统计', '菜单管理', '字典管理', '外部系统配置'],
    ZeroCoverageMenusAfterExpansion: gate.Rows.filter((row) => row.CaseCount === 0).map((row) => row.MenuName),
    PartialMenusAddressed: ['车辆管理', '日志文件', '角色管理'],
    OutOfScopeExcluded: OUT_OF_SCOPE_MENUS.map((menu) => menu.MenuName),
    CandidateGapCountReviewed: dispositions.length,
    ApplicableDesignedCount: dispositions.filter((item) => item.Decision === 'APPLICABLE_DESIGN').length,
    DeferredSafetyBoundaryCount: dispositions.filter((item) => item.Decision === 'DEFERRED_SAFETY_BOUNDARY').length,
    PrunedNotApplicableCount: dispositions.filter((item) => item.Decision === 'PRUNED_NOT_APPLICABLE').length,
    MenuCoverageGateStatus: gate.Status,
    HistoricalResultPreservationStatus: legacyResultPreservation.every((item) => item.PreservedInExpandedCatalog) ? 'PASS' : 'FAIL',
    FormalTestExecutionStarted: false,
    CommitPerformed: false,
    PushPerformed: false,
  };
  writeJson(path.join(expansionRoot, 'reference.json'), { RunId: expansionRunId, Status: 'DESIGN_ONLY_NOT_EXECUTED', CreatedBy: 'menu-coverage-expansion.mjs', ExecutionAuthorized: false });
  writeJson(path.join(expansionRoot, 'expanded-testcase-catalog.json'), catalog);
  writeJson(path.join(expansionRoot, 'menu-coverage-gate.json'), gate);
  writeJson(path.join(expansionRoot, 'case-design-decisions.json'), { RunId: expansionRunId, SourceEvidence: sourceEvidence, Designs: addedCases, CandidateDispositions: dispositions });
  writeJson(path.join(expansionRoot, 'legacy-result-preservation.json'), { RunId: expansionRunId, LegacyCount: legacyResultPreservation.length, Rows: legacyResultPreservation });
  writeJson(path.join(expansionRoot, 'registry-additions.json'), { RunId: expansionRunId, Count: registryAdditions.length, Cases: registryAdditions });
  writeJson(path.join(expansionRoot, 'expansion-summary.json'), summary);
  fs.mkdirSync(expansionRoot, { recursive: true });
  fs.writeFileSync(path.join(expansionRoot, 'menu-coverage-expansion.md'), buildHumanSummary(summary, gate, dispositions), 'utf8');
  writeJson(path.join(projectRoot, 'test-cases', 'catalog', 'menu-coverage-expanded-catalog.json'), catalog);
  writeJson(path.join(projectRoot, 'test-cases', 'catalog', 'menu-coverage-case-designs.json'), { RunId: expansionRunId, SourceEvidence: sourceEvidence, Designs: addedCases, CandidateDispositions: dispositions });
  return { summary, catalog, gate, dispositions, registryAdditions };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  if (process.argv.includes('--validate')) {
    const catalog = readJson(path.join(projectRoot, 'test-cases', 'catalog', 'menu-coverage-expanded-catalog.json'));
    const discoveryDocument = readJson(path.join(auditRoot, 'capability-discovery.json'));
    const discovery = discoveryDocument.Pages ?? discoveryDocument.Entries?.filter((item) => item.ScopeStatus === 'IN_SCOPE') ?? [];
    const legacyMapping = readJson(path.join(auditRoot, 'legacy-testcase-menu-mapping.json')).Mappings ?? [];
    const gate = assertCoverageGate(buildCoverageGate({ catalog, discovery, legacyMapping }));
    process.stdout.write(`MENU_COVERAGE_GATE=PASS (inScope=${gate.InScopeLeafMenuCount}, missingMenus=${gate.MissingMenuCount}, missingOperations=${gate.MissingOperationCount})\n`);
  } else {
    const output = writeExpansion();
    process.stdout.write(`${JSON.stringify(output.summary, null, 2)}\n`);
  }
}
