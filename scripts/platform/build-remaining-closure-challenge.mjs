import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const runId = "REMAINING-CLOSURE-20260828-01";
const priorRun = path.join(projectRoot, "runs", "FULL-138-UNFINISHED-REGRESSION-20260828-01");
const outputRoot = path.join(projectRoot, "runs", runId);
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const writeJson = async (name, value) => writeFile(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
await mkdir(outputRoot, { recursive: true });
const partition = await readJson(path.join(priorRun, "final-case-status-partition.json"));
const reconciliation = await readJson(path.join(priorRun, "full-138-case-status-reconciliation.json"));
const catalog = await readJson(path.join(projectRoot, "test-cases", "catalog", "menu-coverage-expanded-catalog.json"));
const byId = new Map(catalog.TestCases.map((item) => [item.TestCaseId, item]));
const priorById = new Map(reconciliation.Rows.map((item) => [item.TestCaseId, item]));
const statsSafe = new Set(["TC-STAT-QUERY-001", "TC-STAT-QUERY-002", "TC-STAT-VALIDATE-001", "TC-STAT-VALIDATE-002", "TC-STAT-VALIDATE-003", "TC-STAT-VALIDATE-004"]);
const safeNow = new Set([...statsSafe, "TC-STAT-QUERY-005"]);
const physical = new Set(["TC-MAINT-CREATE-001", "TC-TFLOW-COMPOSITE-002", "TC-TFLOW-COMPOSITE-003", "TC-TFLOW-COMPOSITE-004", "TC-TFLOW-COMPOSITE-005", "TC-TFLOW-COMPOSITE-006", "TC-TFLOW-COMPOSITE-007", "TC-TFLOW-COMPOSITE-008", "TC-TFLOW-COMPOSITE-009", "TC-TFLOW-COMPOSITE-010"]);
const menuBlocked = new Set(["TC-MENU-CREATE-001", "TC-MENU-UPDATE-001", "TC-MENU-DELETE-001"]);
const rows = partition.Partition.BLOCKED_BEFORE_EXECUTION.map((id) => {
  const tc = byId.get(id);
  const prior = priorById.get(id);
  let classification = "TEST_FIXTURE_NOT_SAFELY_CONSTRUCTIBLE";
  let dependencies = ["经批准的 TEST_OWNED 前置数据", "网页可观察的清理路径"];
  let reason = "当前尚未证明可以通过网页构造该 Case 的隔离前置数据并在不触发物理动作的情况下完成清理。";
  let requiredAction = "先在网页完成最小 TEST_OWNED fixture 构造验证，再建立独立 Closure Manifest。";
  let physicalMovement = false;
  let mapMutation = false;
  let externalSystem = false;
  let humanJudgment = false;
  let canFixture = true;
  let canMock = false;
  let canRead = false;
  let canDiscovery = true;
  let canExecute = false;
  let status = "BLOCKED_BEFORE_EXECUTION";
  if (safeNow.has(id)) {
    classification = "AUTO_ALLOWED_NOW";
    dependencies = ["效能统计页面", "现有运行时日期/月份或只读数据库发现", "无业务写入"];
    reason = "主断言是统计查询/排序/输入校验，可通过页面和只读运行时数据完成，不需要车辆运动、地图修改或真实外部系统。";
    requiredAction = "通过网页进入效能统计，使用现有日期/月份与无数据范围完成查询或校验，并保存截图。";
    canMock = true;
    canRead = true;
    canExecute = true;
  } else if (/^TC-USER-(CREATE-00[789])$/.test(id)) {
    classification = "AUTO_ALLOWED_NOW";
    dependencies = ["用户管理页面", "TEST_OWNED 用户字段校验输入", "网页删除/查询确认路径"];
    reason = "用户字段边界和非法字符校验是普通管理页面行为，可用唯一 TEST_OWNED 登录名通过网页完成，不触碰管理员账号。";
    requiredAction = "用 TEST_OWNED 登录名执行输入校验，确认拒绝或运行时基线结果，随后网页查询清理。";
    canExecute = true;
  } else if (/^TC-VEH-CREATE-00[4567]$|^TC-VEH-UPDATE-002$/.test(id)) {
    classification = "AUTO_ALLOWED_NOW";
    dependencies = ["车辆管理页面", "TEST_OWNED 普通车辆字段", "禁止初始化/ResetAGV", "网页删除或恢复路径"];
    reason = "这些是普通车辆字段校验/修改，不要求初始化、定位、派车或物理运动；仅允许 TEST_OWNED 记录。";
    requiredAction = "通过网页创建或定位 TEST_OWNED 普通车辆，执行字段校验/恢复并网页清理；严禁初始化车辆。";
    canExecute = true;
  } else if (physical.has(id)) {
    classification = "PHYSICAL_DEVICE_SAFETY";
    dependencies = ["DummyCar 安全定位或批准模拟器", "隔离地图", "链式/反馈进程", "WCS/反馈 mock", "物理流回滚证明"];
    reason = "主断言包含派车、执行、门控、车辆释放、重发或物理异常恢复；当前 DummyCar 初始化路径已知会导致窗体重启，不能绕过安全边界。";
    requiredAction = "提供不触发已知重启缺陷的批准模拟器或完成产品缺陷修复，并提供隔离地图与回滚证明。";
    physicalMovement = true;
    canFixture = false;
  } else if (id === "TC-EXT-INTEGRATION-001") {
    classification = "RUNTIME_CAPABILITY_UNAVAILABLE";
    dependencies = ["外部系统配置页面真实 Integration 触发入口", "Local Mock 连通性断言"];
    reason = "页面已发现配置 CRUD，但没有独立 Integration/连通性操作；保存配置不能冒充连通性执行。";
    requiredAction = "产品提供独立的本地 Mock 连通性触发与结果展示后再执行。";
    externalSystem = true;
    canFixture = false;
  } else if (menuBlocked.has(id)) {
    classification = "ENVIRONMENT_DEPENDENCY_MISSING";
    dependencies = ["经批准的 TEST_OWNED 父菜单", "TEST_OWNED 菜单树隔离与回滚"];
    reason = "菜单 CRUD 需要安全的 TEST_OWNED 父节点；当前只有 RSS Root/正式菜单/自动化依赖菜单，不能作为写入父级。";
    requiredAction = "先通过网页创建并批准隔离父菜单，确认可删除和不影响正式菜单后再执行。";
    mapMutation = true;
    canFixture = false;
  } else if (/^TC-(URB|ROLE)-PERMISSION|^TC-USER-(UPDATE-002|DELETE-002|UPDATE-003)$/.test(id)) {
    classification = "ENVIRONMENT_DEPENDENCY_MISSING";
    dependencies = ["TEST_OWNED 普通用户", "TEST_OWNED 角色", "独立登录会话", "权限刷新/会话生效合同"];
    reason = "主断言依赖普通用户权限边界、重复关系或在线会话刷新；当前只有管理员执行会话，缺少经批准的隔离普通用户验证链路。";
    requiredAction = "通过网页创建 TEST_OWNED 普通用户/角色并批准独立登录会话，再验证权限和关系刷新；不得修改 sa。";
    canFixture = false;
  } else if (/^TC-STAT-/.test(id)) {
    classification = "ENVIRONMENT_DEPENDENCY_MISSING";
    dependencies = ["统计页面可识别的现有数据范围", "只读数据库/运行时日期发现"];
    reason = "统计页面能力可访问，但该 Case 的数据范围和可观察结果尚未完成只读发现，不能把未知数据状态伪造成有数据或无数据。";
    requiredAction = "先用 UI/只读数据库发现实际月份和结果形态，再执行一次对应查询。";
    canRead = true;
  } else if (/^TC-TQUERY-(PAGE|QUERY-003)/.test(id)) {
    classification = "TEST_FIXTURE_NOT_SAFELY_CONSTRUCTIBLE";
    dependencies = ["网页创建 state0 TEST_OWNED Task", "PageSize+1 受控任务数量", "取消/清理路径", "确认不触发派车"];
    reason = "分页/排序本身是只读，但当前尚未证明网页任务创建能稳定生成可清理的 state0 数据且不会触发派车。";
    requiredAction = "先用网页创建少量 state0 TEST_OWNED Task，确认无物理调度后再完成分页/排序断言。";
    canFixture = false;
  } else if (/^TC-TNEW-|^TC-TLIFE-|^TC-TCANCEL-/.test(id)) {
    classification = "TEST_FIXTURE_NOT_SAFELY_CONSTRUCTIBLE";
    dependencies = ["合法 TEST_OWNED Task 依赖", "网页 state0 创建路径", "任务取消/清理路径", "不触发物理调度的证明"];
    reason = "任务创建、取消或生命周期 Case 需要合法任务依赖；当前没有完成网页 state0 构造和不派车证明，不能直接尝试。";
    requiredAction = "先通过网页创建并查询 state0 TEST_OWNED Task，确认不派车，再执行目标操作并按状态清理。";
    canFixture = false;
  } else if (id === "TC-TFLOW-COMPOSITE-001") {
    classification = "RUNTIME_CAPABILITY_UNAVAILABLE";
    dependencies = ["模板项/步骤/路线关系的网页入口或批准本地 mock", "TEST_OWNED 模板链路", "反向清理"];
    reason = "主断言只涉及模板关系铺设，但当前 catalog 指向 API 级组合步骤，未发现可通过网页完成同等关系断言的安全入口。";
    requiredAction = "提供网页可操作的模板步骤/路线关系入口或批准的本地 mock 流程后执行。";
    canMock = true;
    canFixture = false;
  }
  return {
    TestCaseId: id,
    Module: tc?.ModuleName,
    Menu: tc?.MenuName ?? tc?.FeatureName,
    Scenario: tc?.Scenario ?? tc?.Title,
    PreviousBlockReason: prior?.BlockReason ?? prior?.ActualResult,
    RequiredDependencies: dependencies,
    PrimaryAssertion: tc?.PrimaryAssertion ?? tc?.ExpectedResult,
    DoesPrimaryAssertionRequirePhysicalMovement: physicalMovement,
    DoesPrimaryAssertionRequireMapMutation: mapMutation,
    DoesPrimaryAssertionRequireExternalRealSystem: externalSystem,
    DoesPrimaryAssertionRequireHumanJudgment: humanJudgment,
    CanUseTestOwnedFixture: canFixture,
    CanUseMock: canMock,
    CanUseReadOnlyObservation: canRead,
    CanUseRuntimeDiscovery: canDiscovery,
    CanExecuteSafelyNow: canExecute,
    ReclassifiedStatus: status,
    BlockerClassification: canExecute ? null : classification,
    ConcreteReason: reason,
    RequiredAction: requiredAction,
  };
});
await writeJson("blocked-case-challenge.json", { RunId: runId, PreviousBlockedBeforeCount: partition.Partition.BLOCKED_BEFORE_EXECUTION.length, ReviewedCount: rows.length, AutoAllowedNowCount: rows.filter((row) => row.CanExecuteSafelyNow).length, Rows: rows });
await writeJson("remaining-closure-target-set.json", { RunId: runId, Definition: "BLOCKED cases challenged and now AUTO_ALLOWED_NOW only", Count: rows.filter((row) => row.CanExecuteSafelyNow).length, TestCaseIds: rows.filter((row) => row.CanExecuteSafelyNow).map((row) => row.TestCaseId), Rows: rows.filter((row) => row.CanExecuteSafelyNow) });
await writeJson("remaining-closure-manifest.json", { ManifestId: `REMAINING-CLOSURE-MANIFEST-${runId}`, Scope: "FROZEN_138_CLOSURE_ONLY", TargetCaseIds: rows.filter((row) => row.CanExecuteSafelyNow).map((row) => row.TestCaseId), ExistingTerminalIntersection: [], NoRerunPassFailError: true });
console.log(JSON.stringify({ RunId: runId, ReviewedCount: rows.length, AutoAllowedNowCount: rows.filter((row) => row.CanExecuteSafelyNow).length, Classifications: Object.fromEntries([...new Set(rows.map((row) => row.BlockerClassification ?? "AUTO_ALLOWED_NOW"))].map((value) => [value, rows.filter((row) => (row.BlockerClassification ?? "AUTO_ALLOWED_NOW") === value).length])) }));
