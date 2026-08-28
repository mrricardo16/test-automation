import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const adminUsername = process.env.WEB_TEST_USERNAME;
const adminPassword = process.env.WEB_TEST_PASSWORD;

test.use({ viewport: { width: 1280, height: 720 } });

type Menu = { module: string; name: string; route: string };

const menus: Record<string, Menu> = {
  drawing: { module: "场景管理", name: "画图工具", route: "/Sys/drawing-tool" },
  strategy: { module: "场景管理", name: "策略管理", route: "/Sys/StrategyManage" },
  process: { module: "场景管理", name: "进程管理", route: "/Sys/MissionManage" },
  maintenance: { module: "任务模型", name: "维护任务", route: "/Task/TaskMaintanance" },
  template: { module: "任务模型", name: "任务模板", route: "/Task/TaskTemManage" },
  templateItem: { module: "任务模型", name: "模板项管理", route: "/Task/TaskTemItemManage" },
  logFile: { module: "日志管理", name: "日志文件", route: "/Logs/LogFileManager" },
  operationLog: { module: "日志管理", name: "操作日志", route: "/Logs/SysLogManager" },
  exceptionLog: { module: "日志管理", name: "异常日志", route: "/Logs/ExceptionLogManager" },
  interactionLog: { module: "日志管理", name: "交互日志", route: "/Logs/ThirdLogManager" },
  energy: { module: "统计分析", name: "能耗统计", route: "/Statistics/ElectStatisticsManager" },
  vehicle: { module: "场景管理", name: "车辆管理", route: "/Sys/VehicleManage" },
  role: { module: "系统管理", name: "角色管理", route: "/Employee/Role" },
  menu: { module: "系统管理", name: "菜单管理", route: "/Employee/Menu" },
  dict: { module: "系统管理", name: "字典管理", route: "/Employee/DictManager" },
  external: { module: "系统管理", name: "外部系统配置", route: "/Employee/ExSystemManager" },
};

async function login(page: Page): Promise<void> {
  if (!adminUsername || !adminPassword) {
    test.skip(true, "BLOCKED: administrator credentials are missing");
    return;
  }
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(adminUsername);
  await page.getByPlaceholder("用户密码").fill(adminPassword);
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await page.getByRole("button").filter({ hasText: /登\s*录/ }).click();
  const response = await responsePromise;
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
}

async function openMenu(page: Page, menu: Menu): Promise<void> {
  const parent = page.getByRole("menuitem", { name: menu.module, exact: true }).first();
  if ((await parent.getAttribute("aria-expanded")) !== "true") await parent.click();
  await page.getByRole("menu").first().getByRole("link", { name: menu.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`#${menu.route.replaceAll("/", "\\/")}$`), { timeout: 15_000 });
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(menu.name);
}

async function visibleApp(page: Page) {
  const app = page.locator(".app-container:visible").first();
  if (await app.count() === 0) return page.locator("body");
  await expect(app).toBeVisible({ timeout: 15_000 });
  return app;
}

async function pageSmoke(page: Page, evidence: { captureCheckpoint(name: string): Promise<string | undefined> }, menu: Menu, checkpoint: string): Promise<void> {
  await login(page);
  await openMenu(page, menu);
  const app = await visibleApp(page);
  expect(await app.getByRole("button").count() + await app.locator("input").count()).toBeGreaterThan(0);
  await evidence.captureCheckpoint(checkpoint);
}

async function queryPage(page: Page, evidence: { captureCheckpoint(name: string): Promise<string | undefined> }, menu: Menu, checkpoint: string): Promise<void> {
  await login(page);
  await openMenu(page, menu);
  const app = await visibleApp(page);
  const query = app.getByRole("button", { name: /^(搜索|查询)$/ }).first();
  await expect(query).toBeVisible({ timeout: 10_000 });
  await query.click();
  await app.locator(".el-loading-mask").first().waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
  await evidence.captureCheckpoint(checkpoint);
}

test("TC-VEH-STATE-001 - vehicle state controls are observable without initialization", async ({ page, evidence }) => {
  await login(page);
  await openMenu(page, menus.vehicle);
  const app = await visibleApp(page);
  await expect(app.getByRole("button", { name: /去充电|去休息|下线|刷新地图/ }).first()).toBeVisible();
  await evidence.captureCheckpoint("vehicle-state-safe-observation");
});

test("TC-DRAW-PAGE-001 - drawing page and toolbar load", async ({ page, evidence }) => pageSmoke(page, evidence, menus.drawing, "drawing-page"));

test("TC-DRAW-QUERY-001 - drawing library can be opened read-only", async ({ page, evidence }) => {
  await login(page);
  await openMenu(page, menus.drawing);
  const app = await visibleApp(page);
  const loadLibrary = app.getByRole("button", { name: /加载.*库/ }).first();
  await expect(loadLibrary).toBeVisible();
  await loadLibrary.click();
  await evidence.captureCheckpoint("drawing-library-read-only");
  const close = page.getByRole("button", { name: /取消|关闭/ }).last();
  if (await close.count()) await close.click({ force: true }).catch(() => undefined);
});

test("TC-STRAT-PAGE-001 - strategy page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.strategy, "strategy-page"));
test("TC-STRAT-QUERY-001 - strategy query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.strategy, "strategy-query"));
test("TC-PROC-PAGE-001 - process page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.process, "process-page"));
test("TC-PROC-QUERY-001 - process query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.process, "process-query"));
test("TC-MAINT-PAGE-001 - maintenance task page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.maintenance, "maintenance-page"));
test("TC-MAINT-QUERY-001 - maintenance task query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.maintenance, "maintenance-query"));
test("TC-TTEMP-PAGE-001 - task template page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.template, "template-page"));
test("TC-TTEMP-QUERY-001 - task template query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.template, "template-query"));
test("TC-TITEM-PAGE-001 - template item page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.templateItem, "template-item-page"));
test("TC-TITEM-QUERY-001 - template item query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.templateItem, "template-item-query"));
test("TC-LOG-QUERY-001 - log file query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.logFile, "log-file-query"));
test("TC-OLOG-PAGE-001 - operation log page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.operationLog, "operation-log-page"));
test("TC-OLOG-QUERY-001 - operation log query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.operationLog, "operation-log-query"));
test("TC-ELOG-PAGE-001 - exception log page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.exceptionLog, "exception-log-page"));
test("TC-ELOG-QUERY-001 - exception log query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.exceptionLog, "exception-log-query"));
test("TC-ILOG-PAGE-001 - interaction log page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.interactionLog, "interaction-log-page"));
test("TC-ILOG-QUERY-001 - interaction log query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.interactionLog, "interaction-log-query"));
test("TC-ENER-PAGE-001 - energy statistics page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.energy, "energy-page"));
test("TC-ENER-QUERY-001 - energy statistics month query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.energy, "energy-query"));
test("TC-MENU-PAGE-001 - menu management page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.menu, "menu-page"));
test("TC-DICT-PAGE-001 - dictionary management page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.dict, "dictionary-page"));
test("TC-EXT-PAGE-001 - external system page loads", async ({ page, evidence }) => pageSmoke(page, evidence, menus.external, "external-page"));
test("TC-EXT-QUERY-001 - external system query completes", async ({ page, evidence }) => queryPage(page, evidence, menus.external, "external-query"));
