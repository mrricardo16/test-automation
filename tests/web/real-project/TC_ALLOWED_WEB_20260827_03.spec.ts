import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const adminUsername = process.env.WEB_TEST_USERNAME;
const adminPassword = process.env.WEB_TEST_PASSWORD;
const runKey = (process.env.WEB_TEST_RUN_SUFFIX ?? "20260827_03").replace(/[^A-Za-z0-9]/g, "").slice(-8);
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;
const userPrefix = `BB25U${runKey}`;
const rolePrefix = `BB25R${runKey}`;
const vehicleName = "AT_0827_02_DUMMY";

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

async function openPage(page: Page, pageName: string): Promise<void> {
  const systemMenu = page.getByRole("menuitem", { name: "系统管理", exact: true }).first();
  if ((await systemMenu.getAttribute("aria-expanded")) !== "true") await systemMenu.click();
  await page.getByRole("menu").first().getByRole("link", { name: pageName, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(pageName);
}

async function openScenePage(page: Page, pageName: string): Promise<void> {
  const sceneMenu = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await sceneMenu.getAttribute("aria-expanded")) !== "true") await sceneMenu.click();
  await page.getByRole("menu").first().getByRole("link", { name: pageName, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(pageName);
}

async function confirm(page: Page): Promise<void> {
  await page.getByRole("button", { name: /确\s*定|确定/ }).last().click();
}

async function closeDialogIfPresent(page: Page): Promise<void> {
  const close = page.getByRole("button", { name: /取\s*消|取消|关闭此对话框|关闭/ }).last();
  if (await close.count()) await close.click({ force: true }).catch(() => undefined);
}

async function searchUser(page: Page, name: string): Promise<void> {
  await page.getByRole("textbox", { name: "登录名", exact: true }).fill(name);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".el-loading-mask").first()).toBeHidden({ timeout: 10_000 });
}

function userRows(page: Page, name: string) {
  return page.getByRole("row").filter({ hasText: name });
}

async function deleteUserIfPresent(page: Page, name: string): Promise<void> {
  await searchUser(page, name);
  const rows = userRows(page, name);
  const count = await rows.count();
  if (count === 0) return;
  if (count !== 1) throw new Error(`ERROR_CLEANUP: expected one exact user row, found ${count}`);
  const checkbox = rows.first().locator(".el-checkbox__inner");
  if (await checkbox.count()) await checkbox.check({ force: true });
  else await rows.first().click();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await confirm(page);
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(0, { timeout: 10_000 });
}

async function createUser(page: Page, name: string, displayName = "自动化测试用户", password = "BB25Pass2026"): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.locator('[role="dialog"]:visible').last();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill(displayName);
  await dialog.getByRole("textbox", { name: "密码", exact: true }).fill(password);
  await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill(password);
  await dialog.getByRole("button").filter({ hasText: /确\s*定/ }).last().click({ force: true });
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

async function searchRole(page: Page, code: string): Promise<void> {
  await page.getByRole("textbox", { name: "角色编码", exact: true }).fill(code);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
}

function roleRows(page: Page, code: string) {
  return page.getByRole("row").filter({ hasText: code });
}

async function deleteRoleIfPresent(page: Page, code: string): Promise<void> {
  await searchRole(page, code);
  const rows = roleRows(page, code);
  const count = await rows.count();
  if (count === 0) return;
  if (count !== 1) throw new Error(`ERROR_CLEANUP: expected one exact role row, found ${count}`);
  await rows.first().click();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await confirm(page);
  await searchRole(page, code);
  await expect(roleRows(page, code)).toHaveCount(0, { timeout: 10_000 });
}

async function createRole(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "* 角色编码", exact: true }).fill(code);
  await dialog.getByRole("textbox", { name: "* 角色名称", exact: true }).fill(code);
  await dialog.getByRole("textbox", { name: "角色描述", exact: true }).fill("网页自动化测试角色");
  await confirm(page);
}

async function openHashPage(page: Page, hash: string, marker: string): Promise<void> {
  await page.evaluate((target) => { window.location.hash = target; }, hash);
  await expect(page.getByText(marker, { exact: true }).last()).toBeVisible({ timeout: 15_000 });
}

async function createUsersForPagination(page: Page, prefix: string, count: number): Promise<string[]> {
  const names: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    const name = `${prefix}${String(index).padStart(2, "0")}`;
    names.push(name);
    await createUser(page, name, `分页测试用户${index}`);
  }
  return names;
}

async function updateVehicleSpeed(page: Page, speed: string): Promise<void> {
  const field = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).first().locator("input");
  await field.fill(vehicleName);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: vehicleName }).last();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();
  await page.getByRole("button", { name: "修改", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  const speedField = dialog.locator(".el-form-item").filter({ hasText: "车辆速度" }).locator("input").first();
  await expect(speedField).toBeVisible();
  await speedField.fill(speed);
  await dialog.getByRole("button", { name: "确认", exact: true }).click({ force: true });
  await expect(page.getByText(/操作成功|保存成功/).last()).toBeVisible({ timeout: 10_000 });
}

test("TC-USER-CREATE-002 - duplicate username is rejected", async ({ page, evidence }) => {
  const name = `${userPrefix}DUP`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  try {
    await createUser(page, name);
    await searchUser(page, name);
    await expect(userRows(page, name)).toHaveCount(1);
    await evidence.captureCheckpoint("baseline-user-created");
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(name);
    await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill("重复用户名验证");
    await dialog.getByRole("textbox", { name: "密码", exact: true }).fill("BB25Pass2026");
    await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill("BB25Pass2026");
    await confirm(page);
    await expect(page.getByText(/重复|已存在/).last()).toBeVisible({ timeout: 10_000 });
    await evidence.captureCheckpoint("duplicate-rejected");
    await closeDialogIfPresent(page);
    await searchUser(page, name);
    await expect(userRows(page, name)).toHaveCount(1);
  } finally {
    await deleteUserIfPresent(page, name);
  }
});

test("TC-USER-CREATE-003 - too-short password is rejected", async ({ page, evidence }) => {
  const name = `${userPrefix}LEN`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill("长度校验用户");
  await dialog.getByRole("textbox", { name: "密码", exact: true }).fill("1");
  await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill("1");
  await confirm(page);
  await expect(page.getByText(/长度|密码|至少|最少/).last()).toBeVisible({ timeout: 10_000 });
  await evidence.captureCheckpoint("short-password-rejected");
  await closeDialogIfPresent(page);
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(0);
});

test("TC-USER-CREATE-004 - empty username is rejected", async ({ page, evidence }) => {
  await login(page);
  await openPage(page, "用户管理");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill("空登录名校验");
  await dialog.getByRole("textbox", { name: "密码", exact: true }).fill("BB25Pass2026");
  await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill("BB25Pass2026");
  await confirm(page);
  await expect(page.getByText(/必填|不能为空|用户名/).last()).toBeVisible({ timeout: 10_000 });
  await evidence.captureCheckpoint("empty-username-rejected");
  await closeDialogIfPresent(page);
});

test("TC-USER-CREATE-005 - empty display name is rejected", async ({ page, evidence }) => {
  const name = `${userPrefix}NDN`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await dialog.getByRole("textbox", { name: "* 登录名", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "密码", exact: true }).fill("BB25Pass2026");
  await dialog.getByRole("textbox", { name: "确认密码", exact: true }).fill("BB25Pass2026");
  await confirm(page);
  await expect(page.getByText(/必填|不能为空|用户名/).last()).toBeVisible({ timeout: 10_000 });
  await evidence.captureCheckpoint("empty-display-name-rejected");
  await closeDialogIfPresent(page);
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(0);
});

test("TC-USER-QUERY-001 - default user query loads", async ({ page, evidence }) => {
  await login(page);
  await openPage(page, "用户管理");
  await evidence.captureCheckpoint("default-query-page");
  await expect(page.getByRole("row").first()).toBeVisible();
  await evidence.captureCheckpoint("default-query-result");
});

test("TC-USER-QUERY-002 - unmatched user query returns no row", async ({ page, evidence }) => {
  await login(page);
  await openPage(page, "用户管理");
  const name = `${userPrefix}NONE`;
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(0);
  await evidence.captureCheckpoint("unmatched-user-query");
});

test("TC-USER-RESET-001 - user filters can be reset", async ({ page, evidence }) => {
  await login(page);
  await openPage(page, "用户管理");
  await page.getByRole("textbox", { name: "登录名", exact: true }).fill(`${userPrefix}FILTER`);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByText("共").last()).toBeVisible({ timeout: 10_000 });
  await evidence.captureCheckpoint("filtered-user-query");
  const resetButton = page.getByRole("button", { name: /重置|清空/ }).first();
  if (await resetButton.count() === 0) {
    evidence.setFailureType("FAIL_BUSINESS_ASSERTION");
    await evidence.captureCheckpoint("reset-control-missing");
    throw new Error("FAIL_BUSINESS_ASSERTION: user query page has no reset or clear filter control");
  }
  await resetButton.click();
  await expect(page.getByRole("textbox", { name: "登录名", exact: true })).toHaveValue("");
  await evidence.captureCheckpoint("user-query-reset");
});

test("TC-USER-UPDATE-001 - legal user field can be saved", async ({ page, evidence }) => {
  const name = `${userPrefix}UPD`;
  const displayName = "更新后的测试用户";
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  try {
    await createUser(page, name);
    await searchUser(page, name);
    await userRows(page, name).first().click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await dialog.getByRole("textbox", { name: "* 用户名", exact: true }).fill(displayName);
    await confirm(page);
    await searchUser(page, name);
    await expect(userRows(page, name).first()).toContainText(displayName);
    await evidence.captureCheckpoint("user-update-result");
  } finally {
    await deleteUserIfPresent(page, name);
  }
});

test("TC-USER-DELETE-001 - user can be deleted", async ({ page, evidence }) => {
  const name = `${userPrefix}DEL`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  await createUser(page, name);
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(1);
  await evidence.captureCheckpoint("user-before-delete");
  await deleteUserIfPresent(page, name);
  await evidence.captureCheckpoint("user-delete-result");
});

test("TC-USER-QUERY-003 - deleted user is absent from query", async ({ page, evidence }) => {
  const name = `${userPrefix}QDL`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, name);
  await createUser(page, name);
  await deleteUserIfPresent(page, name);
  await searchUser(page, name);
  await expect(userRows(page, name)).toHaveCount(0);
  await evidence.captureCheckpoint("deleted-user-query-result");
});

test("TC-ROLE-CREATE-001 - legal role can be created", async ({ page, evidence }) => {
  const code = `${rolePrefix}NEW`;
  await login(page);
  await openPage(page, "角色管理");
  await deleteRoleIfPresent(page, code);
  try {
    await createRole(page, code);
    await searchRole(page, code);
    await expect(roleRows(page, code)).toHaveCount(1);
    await evidence.captureCheckpoint("role-create-result");
  } finally {
    await deleteRoleIfPresent(page, code);
  }
});

test("TC-ROLE-QUERY-001 - role query by name returns matching row", async ({ page, evidence }) => {
  const code = `${rolePrefix}QRY`;
  await login(page);
  await openPage(page, "角色管理");
  await deleteRoleIfPresent(page, code);
  try {
    await createRole(page, code);
    await searchRole(page, code);
    await expect(roleRows(page, code)).toContainText(code);
    await evidence.captureCheckpoint("role-query-result");
  } finally {
    await deleteRoleIfPresent(page, code);
  }
});

test("TC-URB-BIND-001 - user role relation can be saved and queried", async ({ page, evidence }) => {
  const user = `${userPrefix}REL`;
  const role = `${rolePrefix}REL`;
  await login(page);
  await openPage(page, "用户管理");
  await deleteUserIfPresent(page, user);
  await createUser(page, user);
  await searchUser(page, user);
  await openPage(page, "角色管理");
  await deleteRoleIfPresent(page, role);
  await createRole(page, role);
  await searchRole(page, role);
  try {
    await openPage(page, "用户管理");
    await searchUser(page, user);
    await userRows(page, user).first().click();
    await page.getByRole("button", { name: "指定用户角色", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    const roleRow = dialog.getByRole("row").filter({ hasText: role }).last();
    await expect(roleRow).toBeVisible();
    await roleRow.click();
    await confirm(page);
    await evidence.captureCheckpoint("user-role-bind-result");
    const assignmentDialog = page.getByRole("dialog", { name: "指定用户角色" });
    const assignmentClose = assignmentDialog.getByRole("button", { name: "关闭", exact: true });
    if (await assignmentClose.count()) await assignmentClose.click({ force: true });
  } finally {
    await deleteUserIfPresent(page, user);
    await openPage(page, "角色管理");
    await deleteRoleIfPresent(page, role);
  }
});

test("TC-VEH-QUERY-001 - vehicle query by name returns the test vehicle", async ({ page, evidence }) => {
  await login(page);
  await openScenePage(page, "车辆管理");
  const field = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).first().locator("input");
  await expect(field).toBeVisible();
  await field.fill(vehicleName);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: vehicleName }).last()).toBeVisible({ timeout: 10_000 });
  await evidence.captureCheckpoint("vehicle-query-result");
});

test("TC-VEH-QUERY-002 - unmatched vehicle query returns no row", async ({ page, evidence }) => {
  await login(page);
  await openScenePage(page, "车辆管理");
  const field = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).first().locator("input");
  await expect(field).toBeVisible();
  const name = `${vehicleName}_NOT_FOUND_${runKey}`;
  await field.fill(name);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
  await evidence.captureCheckpoint("unmatched-vehicle-query");
});

test("TC-USER-PAGE-001 - user query can move to a second page", async ({ page, evidence }) => {
  test.setTimeout(180_000);
  const prefix = `${userPrefix}PG`;
  await login(page);
  await openPage(page, "用户管理");
  await page.locator(".el-pagination .el-select").click({ force: true });
  await page.getByRole("option", { name: "10条/页", exact: true }).click();
  const names = await createUsersForPagination(page, prefix, 9);
  try {
    const loginField = page.getByRole("textbox", { name: "登录名", exact: true });
    await loginField.fill("");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    await expect(page.getByText("共").last()).toContainText(/共 (1[1-9]|[2-9]\d|\d{3,}) 条/);
    const next = page.getByRole("button", { name: "下一页" });
    await expect(next).toBeEnabled();
    await evidence.captureCheckpoint("user-pagination-page-one");
    await next.click();
    await expect(page.getByRole("listitem", { name: "第 2 页" })).toHaveClass(/is-active/);
    await evidence.captureCheckpoint("user-pagination-page-two");
  } finally {
    for (const name of names) await deleteUserIfPresent(page, name);
  }
});

test("TC-TQUERY-QUERY-001 - task query default page loads", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Task/TaskManage", "任务管理");
  await expect(page.getByText("任务编号", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "搜索", exact: true })).toBeVisible();
  await expect(page.getByText("共").last()).toBeVisible();
  await evidence.captureCheckpoint("task-query-default");
});

test("TC-TQUERY-QUERY-002 - unmatched task query returns no row", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Task/TaskManage", "任务管理");
  const taskCode = page.locator(".el-form-item").filter({ hasText: "任务编号" }).locator("input").first();
  await taskCode.fill(`${userPrefix}TASK_NOT_FOUND`);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: `${userPrefix}TASK_NOT_FOUND` })).toHaveCount(0);
  await evidence.captureCheckpoint("unmatched-task-query");
});

test("TC-TQUERY-PAGE-001 - task query pagination prerequisite is reported", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Task/TaskManage", "任务管理");
  const next = page.getByRole("button", { name: "下一页" });
  if (await next.count() === 0 || await next.isDisabled()) {
    evidence.setFailureType("BLOCKED_PRECONDITION");
    await evidence.captureCheckpoint("task-pagination-precondition-missing");
    throw new Error("BLOCKED_PRECONDITION: no safe web-created task data is available to form a second page; physical task creation is withheld because DummyCar initialization is forbidden");
  }
  await next.click();
  await evidence.captureCheckpoint("task-pagination-page-two");
});

test("TC-VEH-UPDATE-001 - test vehicle legal field can be saved and restored", async ({ page, evidence }) => {
  test.setTimeout(90_000);
  await login(page);
  await openScenePage(page, "车辆管理");
  try {
    await updateVehicleSpeed(page, "900");
    await evidence.captureCheckpoint("vehicle-update-result");
  } finally {
    await updateVehicleSpeed(page, "1000");
  }
});

test("TC-STAT-QUERY-003 - efficiency statistics default page loads", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
  await expect(page.locator("input[placeholder='选择年']")).toHaveValue(/\d{4}/);
  await expect(page.locator("input[placeholder='选择月']")).toHaveValue(/\d{4}-\d{2}/);
  await expect(page.getByRole("button", { name: "搜索", exact: true })).toBeVisible();
  await evidence.captureCheckpoint("statistics-default");
});

test("TC-STAT-QUERY-004 - efficiency statistics accepts a legal month range", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
  await page.locator("input[placeholder='选择年']").fill("2026");
  await page.locator("input[placeholder='选择月']").fill("2026-08");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await evidence.captureCheckpoint("statistics-month-query");
});

test("TC-STAT-RESET-001 - efficiency statistics exposes a reset control", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
  await page.locator("input[placeholder='选择年']").fill("2026");
  await page.locator("input[placeholder='选择月']").fill("2026-08");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const reset = page.getByRole("button", { name: /重置|清空/ }).first();
  if (await reset.count() === 0) {
    evidence.setFailureType("FAIL_BUSINESS_ASSERTION");
    await evidence.captureCheckpoint("statistics-reset-control-missing");
    throw new Error("FAIL_BUSINESS_ASSERTION: efficiency statistics page has no reset or clear filter control");
  }
  await reset.click();
  await evidence.captureCheckpoint("statistics-reset-result");
});

test("TC-STAT-PAGE-001 - efficiency statistics pagination is available", async ({ page, evidence }) => {
  await login(page);
  await openHashPage(page, "#/Statistics/EfficStatisticsManager", "效能统计");
  const next = page.getByRole("button", { name: "下一页" });
  if (await next.count() === 0) {
    evidence.setFailureType("FAIL_BUSINESS_ASSERTION");
    await evidence.captureCheckpoint("statistics-pagination-missing");
    throw new Error("FAIL_BUSINESS_ASSERTION: efficiency statistics page has no pagination control");
  }
  await next.click();
  await evidence.captureCheckpoint("statistics-pagination-page-two");
});
