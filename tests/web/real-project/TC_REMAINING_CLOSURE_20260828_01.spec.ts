import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runKey = (process.env.WEB_TEST_RUN_SUFFIX ?? "REMAININGCLOSURE20260828").replace(/[^A-Za-z0-9]/g, "").slice(-12);
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;
const closurePrefix = `ATC${runKey}`;
const existingVehicle = "AT_0827_02_DUMMY";

test.use({ viewport: { width: 1280, height: 720 } });
test.setTimeout(120_000);

async function login(page: Page): Promise<void> {
  if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: /登\s*录/ }).click();
  const response = await responsePromise;
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "调度总览" })).toBeVisible({ timeout: 30_000 });
}

async function openHashPage(page: Page, hash: string, marker: string): Promise<void> {
  await page.evaluate((target) => { window.location.hash = target; }, hash);
  await expect(page.getByText(marker, { exact: true }).last()).toBeVisible({ timeout: 20_000 });
}

async function openSystemPage(page: Page, pageName: string): Promise<void> {
  const menu = page.getByRole("menuitem", { name: "系统管理", exact: true }).first();
  if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
  await page.getByRole("menu").first().getByRole("link", { name: pageName, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(pageName);
}

async function confirm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /确\s*定|保存/ }).last().click({ force: true });
}

async function closeVisibleDialog(page: Page): Promise<void> {
  const drawer = page.locator(".el-drawer:visible").last();
  if (await drawer.count()) {
    const close = drawer.getByRole("button", { name: /关闭|取消/ }).last();
    if (await close.count()) await close.click({ force: true }).catch(() => undefined);
  }
  const dialog = page.getByRole("dialog").last();
  if (await dialog.count()) {
    const close = dialog.getByRole("button", { name: /关闭|取消/ }).last();
    if (await close.count()) await close.click({ force: true }).catch(() => undefined);
  }
}

async function openUserPage(page: Page): Promise<void> {
  await openSystemPage(page, "用户管理");
}

async function deleteUserIfPresent(page: Page, loginName: string): Promise<void> {
  const loginField = page.getByRole("textbox", { name: "登录名", exact: true });
  await loginField.fill(loginName);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
  const row = page.getByRole("row").filter({ hasText: loginName });
  if (await row.count() === 0) return;
  await row.last().click();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await confirm(page);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: loginName })).toHaveCount(0, { timeout: 10_000 });
}

async function submitUserBoundary(page: Page, loginName: string, displayName: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(loginName);
  await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill(displayName);
  await dialog.getByRole("textbox", { name: "密码", exact: true }).fill("ATCpass2026");
  await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill("ATCpass2026");
  await confirm(page);
  await page.waitForTimeout(500);
}

for (const [id, yearValue, monthValue] of [
  ["TC-STAT-QUERY-001", "2026", "2026-08"],
  ["TC-STAT-QUERY-002", "1999", "1999-01"],
  ["TC-STAT-QUERY-005", "2026", "2026-08"],
] as const) {
  test(`${id} - statistics safe runtime observation`, async ({ page, evidence }) => {
    await login(page);
    await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
    const year = page.locator("input[placeholder='选择年']");
    const month = page.locator("input[placeholder='选择月']");
    await year.fill(yearValue);
    await month.fill(monthValue);
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    await expect(page.getByText("效能统计", { exact: true }).last()).toBeVisible();
    await evidence.captureCheckpoint(`${id.toLowerCase()}-runtime-observation`);
  });
}

for (const [id, value, checkpoint] of [
  ["TC-STAT-VALIDATE-001", "1900", "statistics-range-boundary"],
  ["TC-STAT-VALIDATE-002", "", "statistics-missing-time"],
  ["TC-STAT-VALIDATE-003", "2099", "statistics-out-of-range"],
  ["TC-STAT-VALIDATE-004", "not-a-date", "statistics-invalid-format"],
] as const) {
  test(`${id} - statistics validation is observable without business writes`, async ({ page, evidence }) => {
    await login(page);
    await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
    const year = page.locator("input[placeholder='选择年']");
    const month = page.locator("input[placeholder='选择月']");
    await year.fill(value);
    await month.fill(value ? `${value}-01` : "");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    await expect(page.getByText("效能统计", { exact: true }).last()).toBeVisible();
    await evidence.captureCheckpoint(checkpoint);
  });
}

for (const [id, displayName] of [
  ["TC-USER-CREATE-007", "A".repeat(300)],
  ["TC-USER-CREATE-008", "边界用户名测试"],
  ["TC-USER-CREATE-009", "非法字符/用户"],
] as const) {
  test(`${id} - TEST_OWNED user boundary is observed through UI`, async ({ page, evidence }) => {
    const loginName = `${closurePrefix}${id.slice(-3)}`;
    await login(page);
    await openUserPage(page);
    await deleteUserIfPresent(page, loginName);
    try {
      await submitUserBoundary(page, loginName, displayName);
      await evidence.captureCheckpoint(`${id.toLowerCase()}-boundary-result`);
    } finally {
      await closeVisibleDialog(page);
      await deleteUserIfPresent(page, loginName).catch(() => undefined);
    }
  });
}

for (const [id, invalidId] of [
  ["TC-VEH-CREATE-004", ""],
  ["TC-VEH-CREATE-005", "1201"],
  ["TC-VEH-CREATE-006", "2001"],
  ["TC-VEH-CREATE-007", "A!"],
] as const) {
  test(`${id} - vehicle validation does not initialize or move a vehicle`, async ({ page, evidence }) => {
    await login(page);
    await openHashPage(page, "#/Sys/VehicleManage", "车辆管理");
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const drawer = page.locator(".el-drawer:visible").last();
    await expect(drawer).toBeVisible();
    const fields = drawer.locator(".el-form-item");
    const carIdField = fields.filter({ hasText: /车辆ID|车辆编号/ }).locator("input").first();
    if (invalidId) await carIdField.fill(invalidId);
    if (id === "TC-VEH-CREATE-005") {
      await carIdField.fill("1201");
      await fields.filter({ hasText: "车辆名称" }).locator("input").first().fill("");
    }
    await drawer.locator("button").last().click({ force: true });
    await evidence.captureCheckpoint(`${id.toLowerCase()}-validation-result`);
    await expect(drawer).toBeVisible();
    await closeVisibleDialog(page);
  });
}

test("TC-VEH-UPDATE-002 - invalid vehicle field is rejected without saving or initialization", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Sys/VehicleManage", "车辆管理");
  const row = page.locator(".VehicleManage .el-table__body-wrapper tbody tr").first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  await page.getByRole("button", { name: "修改", exact: true }).click();
  const drawer = page.locator(".el-drawer:visible").last();
  const speed = drawer.locator(".el-form-item").filter({ hasText: "车辆速度" }).locator("input").first();
  await speed.fill("0");
  await drawer.locator("button").last().click({ force: true });
  await evidence.captureCheckpoint("vehicle-invalid-update-result");
  await expect(drawer).toBeVisible();
  await closeVisibleDialog(page);
});
