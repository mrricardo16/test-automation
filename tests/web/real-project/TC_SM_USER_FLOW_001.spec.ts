import type { Browser, Page } from "@playwright/test";
import { expect, test, type EvidenceContext } from "../helpers/evidence";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const adminUsername = process.env.WEB_TEST_USERNAME;
const adminPassword = process.env.WEB_TEST_PASSWORD;
const flowUsername = process.env.WEB_TEST_FLOW_USERNAME ?? "FLOW20260820";
const flowPassword = process.env.WEB_TEST_FLOW_PASSWORD;
const flowRole = process.env.WEB_TEST_FLOW_ROLE ?? `${flowUsername}_ROLE`;
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;

test.use({ viewport: { width: 1280, height: 720 } });
test.describe.configure({ mode: "serial" });

async function login(page: Page, username: string | undefined, password: string | undefined, evidence?: EvidenceContext) {
  if (!username || !password) {
    evidence?.markBlocked("required runtime credentials are missing");
    test.skip(true, "BLOCKED: required runtime credentials are missing");
    return;
  }

  evidence?.step(`Open login page for ${username === adminUsername ? "administrator" : "normal account"}`);
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  const usernameInput = page.getByPlaceholder("用户名");
  const passwordInput = page.getByPlaceholder("用户密码");
  const loginButton = page.getByRole("button").filter({ hasText: /登\s*录/ });
  await expect(usernameInput).toBeVisible({ timeout: 15_000 });
  await expect(passwordInput).toHaveAttribute("type", "password");
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  const responsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await loginButton.click();
  const response = await responsePromise;
  const payload = (await response.json().catch(() => ({}))) as { statusCode?: number; isSuccess?: boolean };
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  expect(payload.statusCode).toBe(200);
  expect(payload.isSuccess).toBe(true);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "调度总览" })).toBeVisible({ timeout: 30_000 });
}

async function openSystemPage(page: Page, pageName: string): Promise<void> {
  const systemMenu = page.getByRole("menuitem", { name: "系统管理", exact: true }).first();
  if ((await systemMenu.getAttribute("aria-expanded")) !== "true") await systemMenu.click();
  await page.getByRole("menu").first().getByRole("link", { name: pageName, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(pageName);
}

async function clickConfirm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /确\s*定|确定/ }).last().click();
}

async function searchUser(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "登录名", exact: true }).fill(flowUsername);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

async function searchRole(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "角色编码", exact: true }).fill(flowRole);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

async function removeUserIfPresent(page: Page): Promise<void> {
  await openSystemPage(page, "用户管理");
  await searchUser(page);
  const row = page.getByRole("row").filter({ hasText: flowUsername }).last();
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await openSystemPage(page, "用户管理");
    await searchUser(page);
    await expect(page.getByRole("row").filter({ hasText: flowUsername })).toHaveCount(0, { timeout: 10_000 });
  }
}

async function removeRoleIfPresent(page: Page): Promise<void> {
  await openSystemPage(page, "角色管理");
  await searchRole(page);
  const row = page.getByRole("row").filter({ hasText: flowRole }).last();
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: flowRole })).toHaveCount(0, { timeout: 10_000 });
  }
}

async function createFixture(page: Page): Promise<void> {
  await login(page, adminUsername, adminPassword);
  await removeUserIfPresent(page);
  await removeRoleIfPresent(page);

  await openSystemPage(page, "用户管理");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const userDialog = page.getByRole("dialog").last();
  await userDialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(flowUsername);
  await userDialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill(flowUsername);
  await userDialog.getByRole("textbox", { name: "密码", exact: true }).fill(flowPassword ?? "");
  await userDialog.getByRole("textbox", { name: "确认密码", exact: true }).fill(flowPassword ?? "");
  await clickConfirm(page);
  await searchUser(page);
  await expect(page.getByRole("row").filter({ hasText: flowUsername }).last()).toBeVisible();

  await openSystemPage(page, "角色管理");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const roleDialog = page.getByRole("dialog").last();
  await roleDialog.getByRole("textbox", { name: "* 角色编码", exact: true }).fill(flowRole);
  await roleDialog.getByRole("textbox", { name: "* 角色名称", exact: true }).fill(flowRole);
  await roleDialog.getByRole("textbox", { name: "角色描述", exact: true }).fill("流程测试普通账号");
  await clickConfirm(page);
  await searchRole(page);
  const roleRow = page.getByRole("row").filter({ hasText: flowRole }).last();
  await expect(roleRow).toBeVisible();
  await roleRow.click();
  await page.getByRole("button", { name: "角色权限分配", exact: true }).click();
  const permissionDialog = page.getByRole("dialog").last();
  const roots = permissionDialog.locator(".el-tree > .el-tree-node");
  for (let index = 0; index < (await roots.count()); index += 1) {
    const root = roots.nth(index);
    if ((await root.getAttribute("aria-checked")) !== "true") {
      await root.locator(":scope > .el-tree-node__content").locator("label").click();
    }
  }
  await clickConfirm(page);
  await expect(permissionDialog).toBeHidden({ timeout: 10_000 });

  await openSystemPage(page, "用户管理");
  await searchUser(page);
  const userRow = page.getByRole("row").filter({ hasText: flowUsername }).last();
  await userRow.click();
  await page.getByRole("button", { name: "指定用户角色", exact: true }).click();
  const assignmentDialog = page.getByRole("dialog").last();
  const assignedRole = assignmentDialog.getByRole("row").filter({ hasText: flowRole }).last();
  await assignedRole.click();
  await clickConfirm(page);
}

async function setUserEnabled(page: Page, enabled: boolean): Promise<void> {
  await page.reload({ waitUntil: "domcontentloaded" });
  await openSystemPage(page, "用户管理");
  await searchUser(page);
  const row = page.getByRole("row").filter({ hasText: flowUsername }).last();
  await expect(row).toBeVisible();
  const switchControl = row.locator(".el-switch").first();
  const currentClass = (await switchControl.getAttribute("class")) ?? "";
  const current = currentClass.split(/\s+/).includes("is-checked");
  if (current !== enabled) {
    const readSwitchState = async () =>
      ((await switchControl.getAttribute("class")) ?? "").split(/\s+/).includes("is-checked");
    await switchControl.locator(".el-switch__core").click({ force: true });
    try {
      await expect.poll(readSwitchState, { timeout: 3_000 }).toBe(enabled);
    } catch {
      if ((await readSwitchState()) !== enabled) {
        await switchControl.locator("input[type='checkbox']").evaluate((element) => (element as HTMLInputElement).click());
      }
      await expect.poll(readSwitchState, { timeout: 10_000 }).toBe(enabled);
    }
    await expect.poll(
      async () => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await openSystemPage(page, "用户管理");
        await searchUser(page);
        const freshRow = page.getByRole("row").filter({ hasText: flowUsername }).last();
        const freshSwitch = freshRow.locator(".el-switch").first();
        return ((await freshSwitch.getAttribute("class")) ?? "").split(/\s+/).includes("is-checked");
      },
      { timeout: 30_000, intervals: [500, 1_000, 2_000] },
    ).toBe(enabled);
  }
}

async function restoreUserEnabled(browser: Browser): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  try {
    await login(page, adminUsername, adminPassword);
    await setUserEnabled(page, true);
  } finally {
    await context.close();
  }
}

async function cleanupFixture(page: Page): Promise<void> {
  await login(page, adminUsername, adminPassword);
  await removeUserIfPresent(page);
  await removeRoleIfPresent(page);
}

test.describe("普通账号权限与登录流程", () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await createFixture(page);
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    try {
      await cleanupFixture(page);
    } finally {
      await context.close();
    }
  });

  test("TC-FLOW-AUTH-001 - normal account login follows assigned role", async ({ page, evidence }) => {
    await login(page, flowUsername, flowPassword, evidence);
    await evidence.captureCheckpoint("normal-account-dashboard");
    const systemMenu = page.getByRole("menuitem", { name: "系统管理", exact: true });
    await expect(systemMenu).toBeVisible();
    await systemMenu.click();
    await expect(page.getByRole("link", { name: "用户管理", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "角色管理", exact: true })).toBeVisible();
    await evidence.captureCheckpoint("normal-account-role-menus");
  });

  test("TC-FLOW-AUTH-002 - disabling account does not immediately invalidate online session", async ({ page, browser, evidence }) => {
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const disabledContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const adminPage = await adminContext.newPage();
    const disabledPage = await disabledContext.newPage();
    let disabled = false;
    try {
      await login(page, flowUsername, flowPassword, evidence);
      await login(adminPage, adminUsername, adminPassword);
      await setUserEnabled(adminPage, false);
      disabled = true;
      await expect(page.getByRole("heading", { name: "调度总览" })).toBeVisible();
      await evidence.captureCheckpoint("online-session-after-disable");
      await login(disabledPage, flowUsername, flowPassword).catch(async () => {
        await expect(disabledPage.getByText(/账号未启用/)).toBeVisible({ timeout: 10_000 });
      });
      await restoreUserEnabled(browser);
      disabled = false;
    } finally {
      if (disabled) await restoreUserEnabled(browser).catch(() => undefined);
      await disabledContext.close();
      await adminContext.close();
    }
  });

  test("TC-FLOW-AUTH-003 - enabled account can login again", async ({ page, evidence }) => {
    await login(page, flowUsername, flowPassword, evidence);
    await evidence.captureCheckpoint("enabled-account-login");
  });

  test("TC-FLOW-AUTH-004 - deleted account cannot login", async ({ page, browser, evidence }) => {
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const deletedContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const adminPage = await adminContext.newPage();
    const deletedPage = await deletedContext.newPage();
    try {
      await login(adminPage, adminUsername, adminPassword);
      await openSystemPage(adminPage, "用户管理");
      await searchUser(adminPage);
      const row = adminPage.getByRole("row").filter({ hasText: flowUsername }).last();
      await row.click();
      await adminPage.getByRole("button", { name: "删除", exact: true }).click();
      await clickConfirm(adminPage);
      await adminPage.reload({ waitUntil: "domcontentloaded" });
      await openSystemPage(adminPage, "用户管理");
      await searchUser(adminPage);
      await expect(adminPage.getByRole("row").filter({ hasText: flowUsername })).toHaveCount(0, { timeout: 10_000 });
      await deletedPage.goto(loginUrl, { waitUntil: "domcontentloaded" });
      await deletedPage.getByPlaceholder("用户名").fill(flowUsername);
      await deletedPage.getByPlaceholder("用户密码").fill(flowPassword ?? "");
      await deletedPage.getByRole("button").filter({ hasText: /登\s*录/ }).click();
      await expect(deletedPage.getByText(/未找到对应的登录名|登录名不存在/)).toBeVisible({ timeout: 15_000 });
      await evidence.captureCheckpoint("deleted-account-login-rejected");
    } finally {
      await deletedContext.close();
      await adminContext.close();
    }
  });
});
