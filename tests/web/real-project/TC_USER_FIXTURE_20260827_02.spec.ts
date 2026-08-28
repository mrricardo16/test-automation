import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const adminUsername = process.env.WEB_TEST_USERNAME;
const adminPassword = process.env.WEB_TEST_PASSWORD;
const fixtureUsername = process.env.WEB_FORMAL_FIXTURE_USERNAME;
const fixturePassword = process.env.WEB_FORMAL_FIXTURE_PASSWORD;
const fixtureDisplayName = process.env.WEB_FORMAL_FIXTURE_DISPLAY_NAME ?? "自动化测试用户";
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;

test.use({ viewport: { width: 1280, height: 720 } });

async function login(page: Page): Promise<void> {
  if (!adminUsername || !adminPassword) {
    test.skip(true, "BLOCKED: administrator credentials are missing");
    return;
  }
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(adminUsername);
  await page.getByPlaceholder("用户密码").fill(adminPassword);
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await page.getByRole("button").filter({ hasText: /登\s*录/ }).click();
  const response = await responsePromise;
  const payload = (await response.json().catch(() => ({}))) as { statusCode?: number; isSuccess?: boolean };
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  expect(payload.statusCode).toBe(200);
  expect(payload.isSuccess).toBe(true);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "调度总览" })).toBeVisible({ timeout: 30_000 });
}

async function openUserManagement(page: Page): Promise<void> {
  const systemMenu = page.getByRole("menuitem", { name: "系统管理", exact: true }).first();
  if ((await systemMenu.getAttribute("aria-expanded")) !== "true") await systemMenu.click();
  await page.getByRole("menu").first().getByRole("link", { name: "用户管理", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText("用户管理");
}

async function searchFixture(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "登录名", exact: true }).fill(fixtureUsername ?? "");
  const searchResponsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/User\/GetUserList(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await searchResponsePromise;
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

async function clickDialogConfirm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /确\s*定|确定/ }).last().click();
}

function fixtureRows(page: Page) {
  return page.getByRole("row").filter({ hasText: fixtureUsername ?? "" });
}

async function deleteFixtureIfPresent(page: Page): Promise<boolean> {
  await page.reload({ waitUntil: "domcontentloaded" });
  await openUserManagement(page);
  await searchFixture(page);
  const rows = fixtureRows(page);
  const count = await rows.count();
  if (count === 0) return false;
  if (count !== 1) throw new Error(`ERROR_CLEANUP: expected one exact fixture row, found ${count}`);
  const row = rows.first();
  await row.click();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/User\/DeleteSysUser\/?(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await clickDialogConfirm(page);
  const response = await responsePromise;
  const payload = (await response.json().catch(() => ({}))) as { statusCode?: number; isSuccess?: boolean };
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  expect(payload.statusCode).toBe(200);
  expect(payload.isSuccess).toBe(true);
  await searchFixture(page);
  await expect(page.getByRole("row").filter({ hasText: fixtureUsername ?? "" })).toHaveCount(0, { timeout: 10_000 });
  return true;
}

test("TC-USER-CREATE-001 - create, verify, cleanup and verify test-owned user", async ({ page, evidence }) => {
  if (!fixtureUsername || !fixturePassword) {
    evidence.markBlocked("run-scoped fixture credentials are missing");
    test.skip(true, "BLOCKED: run-scoped fixture credentials are missing");
    return;
  }

  await login(page);
  try {
    await openUserManagement(page);
    await searchFixture(page);
    await expect(fixtureRows(page)).toHaveCount(0);

    await page.getByRole("button", { name: "新增", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(fixtureUsername);
    await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill(fixtureDisplayName);
    await dialog.getByRole("textbox", { name: "密码", exact: true }).fill(fixturePassword);
    await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill(fixturePassword);
    const createResponsePromise = page.waitForResponse(
      (response) => response.request().method() === "POST" && /\/User\/AddSysUser(?:$|\?)/i.test(response.url()),
      { timeout: 30_000 },
    );
    await clickDialogConfirm(page);
    const createResponse = await createResponsePromise;
    const createPayload = (await createResponse.json().catch(() => ({}))) as { statusCode?: number; isSuccess?: boolean };
    expect(createResponse.status()).toBeGreaterThanOrEqual(200);
    expect(createResponse.status()).toBeLessThan(300);
    expect(createPayload.statusCode).toBe(200);
    expect(createPayload.isSuccess).toBe(true);

    await searchFixture(page);
    const createdRow = fixtureRows(page).first();
    await expect(createdRow).toBeVisible({ timeout: 10_000 });
    await expect(createdRow).toContainText(fixtureDisplayName);
    await evidence.captureCheckpoint("fixture-created");

    await deleteFixtureIfPresent(page);
    await evidence.captureCheckpoint("fixture-cleanup-verified");
  } finally {
    await deleteFixtureIfPresent(page);
  }
});
