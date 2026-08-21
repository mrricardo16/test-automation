import type { Page } from "@playwright/test";
import { expect, test, type EvidenceContext } from "../helpers/evidence";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;
const runSuffix = process.env.WEB_TEST_RUN_SUFFIX ?? "AUTO";
const dictName = `CS-${runSuffix}`;

test.use({ viewport: { width: 1280, height: 720 } });
test.describe.configure({ mode: "serial" });

async function login(page: Page, evidence: EvidenceContext) {
  if (!username || !password) {
    evidence.markBlocked("WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required");
    test.skip(true, "BLOCKED: test credentials are not supplied");
    return;
  }

  evidence.step("Open login page");
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  const usernameInput = page.getByPlaceholder("用户名");
  const passwordInput = page.getByPlaceholder("用户密码");
  const loginButton = page.getByRole("button").filter({ hasText: /登\s*录/ });
  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toHaveAttribute("type", "password");
  await evidence.captureCheckpoint("expected-login");

  evidence.step("Fill SA credentials and click login");
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await loginButton.click();
  const loginResponse = await loginResponsePromise;
  const payload = (await loginResponse.json().catch(() => ({}))) as { statusCode?: number; isSuccess?: boolean };
  expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
  expect(loginResponse.status()).toBeLessThan(300);
  expect(payload.statusCode).toBe(200);
  expect(payload.isSuccess).toBe(true);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "调度总览" })).toBeVisible({ timeout: 30_000 });
}

async function openSystemPage(page: any, pageName: string): Promise<void> {
  const systemMenu = page.getByRole("menuitem", { name: "系统管理", exact: true }).first();
  const expanded = await systemMenu.getAttribute("aria-expanded");
  if (expanded !== "true") await systemMenu.click();
  await page.getByRole("link", { name: pageName, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(pageName);
}

async function clickConfirm(page: any): Promise<void> {
  const confirmButton = page.getByRole("button", { name: /确\s*定|确定/ }).last();
  await confirmButton.click();
}

async function clickCloseDialog(page: any): Promise<void> {
  const closeButton = page.getByRole("button", { name: "关闭此对话框" });
  if (await closeButton.count()) await closeButton.last().click();
}

async function chooseOption(page: any, label: string, option: string): Promise<void> {
  const field = page.locator(".el-form-item").filter({ hasText: label }).last();
  await field.locator(".el-select").click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function searchUser(page: any): Promise<void> {
  await page.getByRole("textbox", { name: "登录名", exact: true }).fill("CS");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

async function findCsRow(page: any): Promise<any> {
  return page.getByRole("row").filter({ hasText: "CS" }).last();
}

async function selectCsRow(page: any): Promise<any> {
  const row = await findCsRow(page);
  await expect(row).toBeVisible();
  await row.click();
  return row;
}

async function deleteCsUserIfPresent(page: any): Promise<void> {
  await searchUser(page);
  const row = await findCsRow(page);
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
    await expect(page.getByText("CS", { exact: true }).last()).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

async function searchRole(page: any): Promise<void> {
  await page.getByRole("textbox", { name: "角色编码", exact: true }).fill("CS");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

async function findCsRoleRow(page: any): Promise<any> {
  return page.getByRole("row").filter({ hasText: "CS" }).last();
}

async function deleteCsRoleIfPresent(page: any): Promise<void> {
  await searchRole(page);
  const row = await findCsRoleRow(page);
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
    await expect(page.getByText("CS", { exact: true }).last()).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
  }
}

async function addCsRole(page: any): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "* 角色编码", exact: true }).fill("CS");
  await dialog.getByRole("textbox", { name: "* 角色名称", exact: true }).fill("CS");
  await dialog.getByRole("textbox", { name: "角色描述", exact: true }).fill("CS");
  await clickConfirm(page);
  await searchRole(page);
  await expect(await findCsRoleRow(page)).toBeVisible();
}

async function setAllRolePermissions(page: any): Promise<number> {
  const drawer = page.getByRole("dialog").last();
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  const roots = drawer.locator(".el-tree > .el-tree-node");
  const rootCount = await roots.count();
  for (let index = 0; index < rootCount; index += 1) {
    const root = roots.nth(index);
    if ((await root.getAttribute("aria-checked")) !== "true") {
      await root.locator(":scope > .el-tree-node__content").locator("label").click();
    }
  }
  const checks = drawer.locator(".el-tree-node__content > label.el-checkbox");
  const count = await checks.count();
  expect(count).toBeGreaterThan(0);
  await clickConfirm(page);
  await expect(drawer).toBeHidden({ timeout: 10_000 });
  return count;
}

async function removeCsMenuIfPresent(page: any): Promise<void> {
  const node = page.getByRole("treeitem", { name: "CS", exact: true });
  if (await node.count()) {
    await node.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
  }
}

async function removeCsDictionaryIfPresent(page: any): Promise<void> {
  const node = page.getByRole("treeitem", { name: dictName, exact: true });
  if (await node.count()) {
    await selectDictionaryRoot(page);
    const row = page.getByRole("row").filter({ hasText: dictName }).last();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("treeitem", { name: dictName, exact: true })).toHaveCount(0, { timeout: 10_000 });
  }
}

async function selectDictionaryRoot(page: any): Promise<void> {
  const root = page.getByRole("tree").locator(":scope > .el-tree-node").first();
  await root.locator(":scope > .el-tree-node__content").click();
}

async function selectDictionaryNode(page: any, name: string): Promise<void> {
  const node = page.getByRole("treeitem", { name, exact: true });
  await expect(node).toBeVisible({ timeout: 10_000 });
  await node.locator(":scope > .el-tree-node__content").click();
}

async function removeCsExSystemIfPresent(page: any): Promise<void> {
  await page.getByRole("textbox", { name: "系统编码", exact: true }).first().fill("CS");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "CS" }).last();
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await clickConfirm(page);
  }
}

async function ensureCsRoleAssignedToUser(page: any): Promise<void> {
  await openSystemPage(page, "用户管理");
  await searchUser(page);
  await selectCsRow(page);
  await page.getByRole("button", { name: "指定用户角色", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  const roleRow = dialog.getByRole("row").filter({ hasText: "CS" }).last();
  const checkbox = roleRow.getByRole("checkbox").first();
  if (!(await checkbox.isChecked())) await roleRow.click();
  await clickConfirm(page);
}

test.describe("系统管理全量真实测试", () => {
  test("TC-SM-ENV-001 - SA can enter every system management menu", async ({ page, evidence }) => {
    await login(page, evidence);
    evidence.step("Open system management menu");
    await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
    await expect(page.getByRole("link", { name: "用户管理", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "角色管理", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "菜单管理", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "字典管理", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "外部系统配置", exact: true })).toBeVisible();
    await evidence.captureCheckpoint("expected-system-management-menu");
    await evidence.captureCheckpoint("result-system-management-menu");
  });

  test("TC-SM-USER-001 - query CS user", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await evidence.captureCheckpoint("expected-user-query");
    await searchUser(page);
    await expect(await findCsRow(page)).toContainText("CS");
    await evidence.captureCheckpoint("result-user-query");
  });

  test("TC-SM-USER-002 - create CS user", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await deleteCsUserIfPresent(page);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    await evidence.captureCheckpoint("expected-user-add");
    await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill("CS");
    await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill("CS");
    await dialog.getByRole("textbox", { name: "密码", exact: true }).fill(password ?? "");
    await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill(password ?? "");
    await clickConfirm(page);
    await searchUser(page);
    await expect(await findCsRow(page)).toContainText("CS");
    await evidence.captureCheckpoint("result-user-add");
  });

  test("TC-SM-USER-003 - edit CS user", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await searchUser(page);
    await selectCsRow(page);
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-user-edit");
    await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill("CS");
    await clickConfirm(page);
    await searchUser(page);
    await expect(await findCsRow(page)).toContainText("CS");
    await evidence.captureCheckpoint("result-user-edit");
  });

  test("TC-SM-ROLE-001 - create CS role", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "角色管理");
    await deleteCsRoleIfPresent(page);
    await evidence.captureCheckpoint("expected-role-add");
    await addCsRole(page);
    await evidence.captureCheckpoint("result-role-add");
  });

  test("TC-SM-ROLE-002 - edit CS role", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "角色管理");
    await searchRole(page);
    await (await findCsRoleRow(page)).click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-role-edit");
    await dialog.getByRole("textbox", { name: "角色描述", exact: true }).fill("CS");
    await clickConfirm(page);
    await searchRole(page);
    await expect(await findCsRoleRow(page)).toContainText("CS");
    await evidence.captureCheckpoint("result-role-edit");
  });

  test("TC-SM-ROLE-003 - assign all permissions to CS role", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "角色管理");
    await searchRole(page);
    await (await findCsRoleRow(page)).click();
    await page.getByRole("button", { name: "角色权限分配", exact: true }).click();
    await evidence.captureCheckpoint("expected-role-permissions");
    const count = await setAllRolePermissions(page);
    expect(count).toBeGreaterThan(0);
    await evidence.captureCheckpoint("result-role-permissions");
  });

  test("TC-SM-MENU-001 - create CS menu", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "菜单管理");
    await removeCsMenuIfPresent(page);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    await evidence.captureCheckpoint("expected-menu-add");
    await page.getByRole("textbox", { name: "* 组件名称", exact: true }).fill("CS");
    await page.getByRole("textbox", { name: "* 菜单名称", exact: true }).fill("CS");
    await page.getByRole("textbox", { name: "* 菜单路由", exact: true }).fill("CS");
    await page.getByRole("textbox", { name: "* 菜单地址", exact: true }).fill("CS");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByRole("treeitem", { name: "CS", exact: true })).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-menu-add");
  });

  test("TC-SM-MENU-002 - edit CS menu", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "菜单管理");
    await page.getByRole("treeitem", { name: "CS", exact: true }).click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    await evidence.captureCheckpoint("expected-menu-edit");
    await page.getByRole("textbox", { name: "* 菜单名称", exact: true }).fill("CS");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByRole("treeitem", { name: "CS", exact: true })).toBeVisible();
    await evidence.captureCheckpoint("result-menu-edit");
  });

  test("TC-SM-MENU-003 - refresh and query CS menu", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "菜单管理");
    await page.reload();
    await expect(page.getByRole("treeitem", { name: "CS", exact: true })).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("expected-menu-query");
    await page.getByRole("treeitem", { name: "CS", exact: true }).click();
    await evidence.captureCheckpoint("result-menu-query");
  });

  test("TC-SM-MENU-004 - delete CS menu", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "菜单管理");
    await page.getByRole("treeitem", { name: "CS", exact: true }).click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-menu-delete");
    await clickConfirm(page);
    await expect(page.getByRole("treeitem", { name: "CS", exact: true })).toBeHidden({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-menu-delete");
  });

  test("TC-SM-MENU-005 - verify CS menu absent after refresh", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "菜单管理");
    await page.reload();
    await evidence.captureCheckpoint("expected-menu-absent");
    await expect(page.getByRole("treeitem", { name: "CS", exact: true })).toHaveCount(0);
    await evidence.captureCheckpoint("result-menu-absent");
  });

  test("TC-SM-DICT-001 - create CS manual dictionary", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await removeCsDictionaryIfPresent(page);
    await selectDictionaryRoot(page);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-dict-add");
    await dialog.getByRole("textbox", { name: "* 字典名", exact: true }).fill(dictName);
    await chooseOption(page, "类型", "手工");
    await dialog.getByRole("textbox", { name: "* 排序", exact: true }).fill("99");
    await clickConfirm(page);
    await expect(page.getByRole("treeitem", { name: dictName, exact: true })).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-dict-add");
  });

  test("TC-SM-DICT-001-ITEM - create CS dictionary item", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await selectDictionaryNode(page, dictName);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-dict-item-add");
    await dialog.getByRole("textbox", { name: "* 字典名", exact: true }).fill("CS");
    await chooseOption(page, "类型", "手工");
    await dialog.getByRole("textbox", { name: "* 排序", exact: true }).fill("1");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-dict-item-add");
  });

  test("TC-SM-DICT-002 - edit CS dictionary item order", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await selectDictionaryNode(page, dictName);
    const row = page.getByRole("row").filter({ hasText: "CS" }).last();
    await row.click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-dict-item-edit");
    await dialog.getByRole("textbox", { name: "* 排序", exact: true }).fill("2");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: /CS.*2/ }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-dict-item-edit");
  });

  test("TC-SM-DICT-003 - refresh default node behavior", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await selectDictionaryNode(page, dictName);
    await page.reload();
    await evidence.captureCheckpoint("expected-dict-refresh");
    await expect(page.getByRole("row").filter({ hasText: dictName }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-dict-refresh");
  });

  test("TC-SM-DICT-003-RETRY - select CS dictionary node after refresh", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await page.reload();
    await selectDictionaryNode(page, dictName);
    await evidence.captureCheckpoint("expected-dict-node-retry");
    await expect(page.getByRole("row").filter({ hasText: /CS.*2/ }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-dict-node-retry");
  });

  test("TC-SM-DICT-004 - delete CS dictionary item", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await selectDictionaryNode(page, dictName);
    const row = page.getByRole("row").filter({ hasText: /CS.*2/ }).last();
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-dict-item-delete");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: /CS.*2/ }).last()).toHaveCount(0);
    await evidence.captureCheckpoint("result-dict-item-delete");
  });

  test("TC-SM-EXSYS-001 - create CS external system", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "外部系统配置");
    await removeCsExSystemIfPresent(page);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const drawer = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-exsystem-add");
    await drawer.getByRole("textbox", { name: "* 系统编码", exact: true }).fill("CS");
    await drawer.getByRole("textbox", { name: "* 系统名称", exact: true }).fill("CS");
    await drawer.getByRole("textbox", { name: "* 系统地址", exact: true }).fill("127.0.0.1:8223");
    await drawer.getByRole("textbox", { name: "* 任务反馈路由", exact: true }).fill("CS");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-exsystem-add");
  });

  test("TC-SM-EXSYS-002 - edit CS external system", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "外部系统配置");
    await page.getByRole("textbox", { name: "系统编码", exact: true }).first().fill("CS");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "CS" }).last();
    await row.click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const drawer = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-exsystem-edit");
    await drawer.getByRole("textbox", { name: "* 系统地址", exact: true }).fill("127.0.0.1:8224");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: /CS.*8224/ }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-exsystem-edit");
  });

  test("TC-SM-EXSYS-003 - query CS external system", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "外部系统配置");
    await evidence.captureCheckpoint("expected-exsystem-query");
    await page.getByRole("textbox", { name: "系统编码", exact: true }).first().fill("CS");
    await page.getByRole("textbox", { name: "系统名称", exact: true }).fill("CS");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    const rows = page.getByRole("row").filter({ hasText: "CS" });
    await expect(rows.last()).toContainText("CS");
    await evidence.captureCheckpoint("result-exsystem-query");
  });

  test("TC-SM-EXSYS-004 - delete CS external system", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "外部系统配置");
    await page.getByRole("textbox", { name: "系统编码", exact: true }).first().fill("CS");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "CS" }).last();
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-exsystem-delete");
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" }).last()).toHaveCount(0);
    await evidence.captureCheckpoint("result-exsystem-delete");
  });

  test("TC-SM-USER-005 - assign CS role to CS user", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await searchUser(page);
    await selectCsRow(page);
    await page.getByRole("button", { name: "指定用户角色", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await evidence.captureCheckpoint("expected-user-role");
    const roleRow = dialog.getByRole("row").filter({ hasText: "CS" }).last();
    await roleRow.click();
    await clickConfirm(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" }).last()).toContainText("CS");
    await evidence.captureCheckpoint("result-user-role");
  });

  test("TC-SM-ROLE-004 - delete and restore CS role", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "角色管理");
    await searchRole(page);
    await (await findCsRoleRow(page)).click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-role-delete");
    await clickConfirm(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await searchRole(page);
    await expect(await findCsRoleRow(page)).toHaveCount(0);
    await addCsRole(page);
    await (await findCsRoleRow(page)).click();
    await page.getByRole("button", { name: "角色权限分配", exact: true }).click();
    await setAllRolePermissions(page);
    await ensureCsRoleAssignedToUser(page);
    await evidence.captureCheckpoint("result-role-restored");
  });

  test("TC-SM-DICT-005 - system dictionary delete restriction", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "字典管理");
    await selectDictionaryRoot(page);
    const row = page.getByRole("row").filter({ hasText: "CS" }).last();
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-system-dict-delete");
    await clickConfirm(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await selectDictionaryRoot(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" }).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("result-system-dict-delete-restriction");
  });

  test("TC-SM-FINAL-001 - verify CS role has all permission nodes", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "角色管理");
    await searchRole(page);
    await (await findCsRoleRow(page)).click();
    await page.getByRole("button", { name: "角色权限分配", exact: true }).click();
    await evidence.captureCheckpoint("expected-final-permissions");
    const drawer = page.getByRole("dialog").last();
    const checks = drawer.getByRole("checkbox");
    const count = await checks.count();
    for (let index = 0; index < count; index += 1) {
      await expect(checks.nth(index)).toBeChecked();
    }
    await evidence.captureCheckpoint("result-final-permissions");
  });

  test("TC-SM-FINAL-002 - verify CS user role relation", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await searchUser(page);
    await selectCsRow(page);
    await page.getByRole("button", { name: "指定用户角色", exact: true }).click();
    await evidence.captureCheckpoint("expected-final-user-role");
    const dialog = page.getByRole("dialog").last();
    const roleRow = dialog.getByRole("row").filter({ hasText: "CS" }).last();
    await expect(roleRow.getByRole("checkbox").first()).toBeChecked();
    await evidence.captureCheckpoint("result-final-user-role");
    await clickCloseDialog(page);
  });

  test("TC-SM-USER-004 - delete CS user", async ({ page, evidence }) => {
    await login(page, evidence);
    await openSystemPage(page, "用户管理");
    await searchUser(page);
    await selectCsRow(page);
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await evidence.captureCheckpoint("expected-user-delete");
    await clickConfirm(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await searchUser(page);
    await expect(page.getByRole("row").filter({ hasText: "CS" })).toHaveCount(0);
    await evidence.captureCheckpoint("result-user-delete");
  });
});
