import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const runId = "MENU-COVERAGE-AUDIT-20260827-01";
const runRoot = path.join(root, "projects", "rsscomposer-blackbox", "runs", runId);
const artifactRoot = path.join(runRoot, "artifacts", "navigation");
const catalogPath = path.join(root, "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/final-testcase-catalog.json");
const resultPath = path.join(root, "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/formal-result.json");
const config = JSON.parse(await readFile(path.join(root, "projects/rsscomposer-blackbox/config/project.local.json"), "utf8"));
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const priorResult = JSON.parse(await readFile(resultPath, "utf8"));

const menus = [
  { module: "场景管理", menu: "车辆管理", route: "/Sys/VehicleManage", component: "src/views/Sys/VehicleManage/index.vue" },
  { module: "场景管理", menu: "画图工具", route: "/Sys/drawing-tool", sourceRoute: "/drawing-tool", component: "src/views/drawing-tool/index.vue" },
  { module: "场景管理", menu: "策略管理", route: "/Sys/StrategyManage", component: "src/views/Sys/StrategyManage/index.vue" },
  { module: "场景管理", menu: "进程管理", route: "/Sys/MissionManage", component: "src/views/Sys/MissionManage/index.vue" },
  { module: "任务模型", menu: "任务管理", route: "/Task/TaskManage", component: "src/views/Task/TaskManage/index.vue" },
  { module: "任务模型", menu: "维护任务", route: "/Task/TaskMaintanance", component: "src/views/Task/TaskMaintanance/index.vue" },
  { module: "任务模型", menu: "任务模板", route: "/Task/TaskTemManage", component: "src/views/Task/TaskTemManage/index.vue" },
  { module: "任务模型", menu: "模板项管理", route: "/Task/TaskTemItemManage", component: "src/views/Task/TaskTemItemManage/index.vue" },
  { module: "日志管理", menu: "日志文件", route: "/Logs/LogFileManager", component: "src/views/Logs/LogFileManager/index.vue" },
  { module: "日志管理", menu: "操作日志", route: "/Logs/SysLogManager", component: "src/views/Logs/SysLogManager/index.vue" },
  { module: "日志管理", menu: "异常日志", route: "/Logs/ExceptionLogManager", component: "src/views/Logs/ExceptionLogManager/index.vue" },
  { module: "日志管理", menu: "交互日志", route: "/Logs/ThirdLogManager", component: "src/views/Logs/ThirdLogManager/index.vue" },
  { module: "统计分析", menu: "效能统计", route: "/Statistics/EfficStatisticsManager", component: "src/views/Statistics/EfficStatisticsManager/index.vue" },
  { module: "统计分析", menu: "能耗统计", route: "/Statistics/ElectStatisticsManager", component: "src/views/Statistics/ElectStatisticsManager/index.vue" },
  { module: "系统管理", menu: "用户管理", route: "/Employee/User", component: "src/views/Employee/User/index.vue" },
  { module: "系统管理", menu: "角色管理", route: "/Employee/Role", component: "src/views/Employee/Role/index.vue" },
  { module: "系统管理", menu: "菜单管理", route: "/Employee/Menu", component: "src/views/Employee/Menu/index.vue" },
  { module: "系统管理", menu: "字典管理", route: "/Employee/DictManager", component: "src/views/Sys/DictManager/index.vue" },
  { module: "系统管理", menu: "外部系统配置", route: "/Employee/ExSystemManager", component: "src/views/Sys/ExSystemManager/index.vue" },
];
const outOfScope = [{ module: "综合看板", menu: "综合看板", routes: ["/a/b", "/a/c", "/a/d"], component: ["src/views/KanBan/JobMonitoring/index.vue", "src/views/KanBan/Monitoring/index.vue", "src/views/KanBan/ChargingMachine/index.vue"], scopeStatus: "OUT_OF_SCOPE_BY_USER", reason: "用户明确要求综合看板无需测试，不生成用例、不计入覆盖率分母。" }];
const pageByMenu = new Map(menus.map((item) => [item.menu, item]));

const menuForCase = (tc) => {
  const id = tc.TestCaseId;
  if (id.startsWith("TC-VEH-")) return "车辆管理";
  if (id.startsWith("TC-MON-")) return "综合看板";
  if (id.startsWith("TC-LOG-")) return "日志文件";
  if (id.startsWith("TC-STAT-")) return "效能统计";
  if (id.startsWith("TC-ROLE-")) return "角色管理";
  if (id.startsWith("TC-URB-")) return "用户管理";
  if (id.startsWith("TC-USER-")) return "用户管理";
  if (id.startsWith("TC-T")) return "任务管理";
  return null;
};
const operationForCase = (tc) => {
  const id = tc.TestCaseId;
  if (id.includes("PERMISSION")) return "PERMISSION";
  if (id.includes("VISUAL")) return "VISUAL";
  if (id.includes("DOWNLOAD")) return "DOWNLOAD";
  if (id.includes("QUERY")) return "QUERY";
  if (id.includes("CREATE")) return "CREATE";
  if (id.includes("UPDATE")) return "UPDATE";
  if (id.includes("DELETE")) return "DELETE";
  if (id.includes("CANCEL") || id.includes("RESEND")) return "STATE";
  if (id.includes("BIND") || id.includes("UNBIND")) return "RELATION";
  if (id.includes("STAT")) return "QUERY";
  return String(tc.Operation || "OTHER").toUpperCase();
};

const inferOperations = ({ route, buttons, inputs, body }) => {
  const buttonText = buttons.join(" ");
  const inputText = inputs.join(" ");
  const joined = `${buttonText} ${inputText}`;
  const ops = new Set(["PAGE_SMOKE"]);
  if (/搜索|查询/.test(buttonText) || inputs.length > 0) ops.add("QUERY");
  if (/新增|添加|创建/.test(buttonText)) ops.add("CREATE");
  if (/修改|编辑|保存/.test(buttonText)) ops.add("UPDATE");
  if (/删除/.test(buttonText)) ops.add("DELETE");
  if (/启用|禁用|启动|停止|刷新|刷新状态|下线|去充电|去休息/.test(buttonText)) ops.add("STATE");
  if (/关联|指定|权限|父级|流程|模板项|字典项|配置/.test(buttonText)) ops.add("RELATION");
  if (/下载|导出/.test(buttonText)) ops.add("DOWNLOAD");
  if (/接口|地址|请求|响应/.test(inputText) || route.includes("ExSystem")) ops.add("INTEGRATION");
  if (route.includes("drawing-tool")) {
    ops.add("VISUAL");
    if (/加载|库|刷新后台/.test(buttonText)) ops.add("QUERY");
    if (/新建/.test(buttonText)) ops.add("CREATE");
    if (/保存/.test(buttonText)) ops.add("UPDATE");
    if (/删除/.test(buttonText)) ops.add("DELETE");
    if (/上传|合并地图/.test(buttonText)) ops.add("INTEGRATION");
  }
  return [...ops];
};

await mkdir(artifactRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const runtimeBaseUrl = config.runtimeBaseUrl.endsWith("/") ? config.runtimeBaseUrl : `${config.runtimeBaseUrl}/`;
await page.goto(`${runtimeBaseUrl}#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.getByPlaceholder("用户名").fill(config.authentication.admin.username);
await page.getByPlaceholder("用户密码").fill(config.authentication.admin.password);
const loginResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
await page.getByRole("button").filter({ hasText: /登\s*录/ }).click();
await loginResponse;
await page.waitForURL("**/#/dashboard", { timeout: 30_000 });

const returnToDashboard = async () => {
  await page.goto(`${runtimeBaseUrl}#/dashboard`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(() => window.location.hash === "#/dashboard", undefined, { timeout: 10_000 });
};
const openFromRuntimeMenu = async (menu) => {
  await returnToDashboard();
  const parent = page.getByRole("menuitem", { name: menu.module, exact: true }).first();
  if (await parent.count() && (await parent.getAttribute("aria-expanded")) !== "true") await parent.click({ force: true });
  const link = page.locator(`a[href="#${menu.route}"]`).first();
  if (!(await link.count())) {
    await page.evaluate((route) => { window.location.hash = route; }, menu.route);
    const routeReached = await page.waitForFunction((route) => window.location.hash === `#${route}`, menu.route, { timeout: 8_000 }).then(() => true).catch(() => false);
    return { route: menu.route, menuLinkFound: false, routeReached, sourceRouteReached: false };
  }
  await link.click({ force: true });
  const routeReached = await page.waitForFunction((route) => window.location.hash === `#${route}`, menu.route, { timeout: 8_000 }).then(() => true).catch(() => false);
  let sourceRouteReached = false;
  if (!routeReached && menu.sourceRoute) {
    await page.evaluate((route) => { window.location.hash = route; }, menu.sourceRoute);
    sourceRouteReached = await page.waitForFunction((route) => window.location.hash === `#${route}`, menu.sourceRoute, { timeout: 8_000 }).then(() => true).catch(() => false);
  }
  return { route: menu.route, menuLinkFound: true, routeReached, sourceRouteReached };
};

const discovered = [];
for (const menu of menus) {
  const requests = [];
  const onRequest = (request) => {
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: url.pathname });
  };
  page.on("request", onRequest);
  let pageReachable = false;
  let statusCode = null;
  let body = "";
  let buttons = [];
  let inputs = [];
  let screenshot = null;
  let menuNavigation = { route: menu.route, menuLinkFound: false, routeReached: false, sourceRouteReached: false };
  try {
    menuNavigation = await openFromRuntimeMenu(menu);
    statusCode = 200;
    const main = page.locator(".app-container:visible").first();
    body = await (await main.count() ? main : page.locator("body")).innerText({ timeout: 10_000 });
    const mainButtons = await (await main.count() ? main : page.locator("body")).getByRole("button").allTextContents();
    buttons = mainButtons.map((value) => value.trim()).filter(Boolean);
    inputs = await (await main.count() ? main : page.locator("body")).locator("input").evaluateAll((elements) => elements.map((element) => [element.getAttribute("placeholder"), element.getAttribute("aria-label"), element.getAttribute("name")].filter(Boolean).join(" ")).filter(Boolean));
    const effectiveRouteReached = menuNavigation.routeReached || menuNavigation.sourceRouteReached;
    pageReachable = effectiveRouteReached && (body.length > 30 || buttons.length > 0 || inputs.length > 0);
    screenshot = path.join(artifactRoot, `${menu.menu}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
  } catch (error) {
    body = body || String(error?.message ?? error);
  } finally {
    page.off("request", onRequest);
  }
  const supportedOperations = inferOperations({ route: menu.route, buttons, inputs, body });
  discovered.push({
    Module: menu.module,
    MenuName: menu.menu,
    Route: menu.route,
    SourceRouteCandidate: menu.sourceRoute ?? null,
    ComponentName: menu.component,
    PageReachable: pageReachable,
    RuntimeMenuLinkFound: menuNavigation.menuLinkFound,
    RuntimeMenuRouteReached: menuNavigation.routeReached,
    SourceRouteReached: menuNavigation.sourceRouteReached,
    PrimaryFunctions: supportedOperations,
    SupportedOperations: supportedOperations,
    ObservedButtons: buttons,
    ObservedInputLabels: inputs,
    NetworkPaths: [...new Set(requests.map((item) => `${item.method} ${item.path}`))].slice(0, 80),
    CapabilityEvidenceScreenshot: screenshot ? path.relative(root, screenshot).replaceAll(path.sep, "/") : null,
    ScopeStatus: "IN_SCOPE",
  });
}
await browser.close();

const legacyMappings = catalog.TestCases.map((tc) => ({
  TestCaseId: tc.TestCaseId,
  Scenario: tc.Scenario,
  Module: tc.ModuleName,
  MenuName: menuForCase(tc),
  Operation: operationForCase(tc),
  MappingBasis: menuForCase(tc) === "综合看板" ? "LEGACY_CASE_RETAINED_BUT_USER_OUT_OF_SCOPE" : "TESTCASE_ID_AND_FEATURE_SEMANTICS",
  LegacyExecutionStatus: priorResult.ExecutedResults.find((item) => item.TestCaseId === tc.TestCaseId)?.ExecutionStatus ?? priorResult.BlockedFlowResults.find((item) => item.TestCaseId === tc.TestCaseId)?.ExecutionStatus ?? priorResult.ManualResults.find((item) => item.TestCaseId === tc.TestCaseId)?.ExecutionStatus ?? priorResult.PendingResults.find((item) => item.TestCaseId === tc.TestCaseId)?.ExecutionStatus ?? "NOT_FOUND_IN_PRIOR_RESULT",
}));
const mappingByMenu = new Map();
for (const item of legacyMappings) {
  if (!item.MenuName) continue;
  if (!mappingByMenu.has(item.MenuName)) mappingByMenu.set(item.MenuName, []);
  mappingByMenu.get(item.MenuName).push(item);
}
const matrix = discovered.map((entry) => {
  const existing = mappingByMenu.get(entry.MenuName) ?? [];
  const covered = [...new Set([...(existing.length > 0 ? ["PAGE_SMOKE"] : []), ...existing.map((item) => item.Operation)])];
  const missing = entry.SupportedOperations.filter((operation) => !covered.includes(operation));
  const hasPageCase = existing.length > 0;
  return {
    Module: entry.Module,
    Menu: entry.MenuName,
    InScope: true,
    Route: entry.Route,
    SupportedOperations: entry.SupportedOperations,
    ExistingCaseCount: existing.length,
    NewCaseCount: 0,
    CoveredOperations: covered,
    MissingOperations: missing,
    PageSmokeCoverage: hasPageCase ? (entry.PageReachable ? "COVERED_BY_EXISTING_CASE_AND_RUNTIME_DISCOVERY" : "COVERED_BY_EXISTING_FORMAL_CASE; RUNTIME_RECHECK_NEEDED") : "MISSING",
    PrimaryOperationCoverage: missing.length === 0 ? "COVERED" : "PARTIAL",
    ExecutionStatus: existing.length === 0 ? "NO_LEGACY_CASE" : "LEGACY_PARTIAL",
    CoverageStatus: existing.length === 0 || missing.length > 0 ? "PARTIAL" : "COVERED",
    Notes: entry.PageReachable ? "Runtime page opened during capability discovery; no business mutation performed." : "Runtime page was not confirmed reachable during discovery.",
  };
});
const missing = [];
for (const row of matrix) {
  if (row.PageSmokeCoverage === "MISSING") missing.push({ Module: row.Module, Menu: row.Menu, GapType: "PAGE_SMOKE", MissingOperation: "PAGE_SMOKE", Reason: "IN_SCOPE leaf menu has no confirmed existing page coverage." });
  for (const operation of row.MissingOperations) missing.push({ Module: row.Module, Menu: row.Menu, GapType: "PRIMARY_OPERATION", MissingOperation: operation, Reason: "Runtime capability was observed but no Legacy 82 TestCase is mapped to this menu operation." });
}
const navigationInventory = {
  RunId: runId,
  Authority: "USER_APPROVED_FUNCTIONAL_SCOPE",
  DiscoveryMode: "READ_ONLY_PAGE_OPEN_AND_CAPABILITY_SCAN",
  FormalTestExecutionStarted: false,
  InScopeLeafMenuCount: discovered.length,
  OutOfScopeMenuCount: outOfScope.length,
  Entries: [...discovered, ...outOfScope],
  OutOfScope: outOfScope,
};
const expansionMap = {
  LegacyCount: catalog.TestCaseCount,
  NewCount: catalog.TestCaseCount,
  FinalCount: catalog.TestCaseCount,
  AddedTestCaseIds: [],
  Reason: "Phase 1-4 audit only; expansion is intentionally deferred until the user reviews the inventory and gaps.",
  MenuCoverageGap: missing,
};
const report = { RunId: runId, LegacyCatalogCount: catalog.TestCaseCount, InScopeLeafMenuCount: discovered.length, OutOfScopeMenuCount: outOfScope.length, CoverageGapCount: missing.length, MissingMenuCount: matrix.filter((item) => item.ExistingCaseCount === 0).length, MissingOperationCount: missing.filter((item) => item.GapType === "PRIMARY_OPERATION").length, FormalTestExecutionStarted: false };
await writeFile(path.join(runRoot, "functional-navigation-inventory.json"), `${JSON.stringify(navigationInventory, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "menu-coverage-matrix.json"), `${JSON.stringify({ RunId: runId, Matrix: matrix }, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "legacy-testcase-menu-mapping.json"), `${JSON.stringify({ RunId: runId, LegacyCatalogCount: catalog.TestCaseCount, Mappings: legacyMappings }, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "missing-functional-coverage.json"), `${JSON.stringify({ RunId: runId, MissingCount: missing.length, Missing: missing }, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "catalog-expansion-map.json"), `${JSON.stringify(expansionMap, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "capability-discovery.json"), `${JSON.stringify({ RunId: runId, Pages: discovered, FormalTestExecutionStarted: false }, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "coverage-audit-summary.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, InScopeMenus: discovered.map((item) => ({ Menu: item.MenuName, Reachable: item.PageReachable, SupportedOperations: item.SupportedOperations, ExistingCaseCount: (mappingByMenu.get(item.MenuName) ?? []).length })) }, null, 2));
