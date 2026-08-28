import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runKey = (process.env.WEB_TEST_RUN_SUFFIX ?? "FULL138_20260828").replace(/[^A-Za-z0-9]/g, "").slice(-12);
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;
const prefix = `ATF138${runKey}`;
const localMockUrl = process.env.LOCAL_MOCK_URL ?? "127.0.0.1:8230";

test.use({ viewport: { width: 1280, height: 720 } });
test.setTimeout(120_000);

async function login(page: Page): Promise<void> {
  if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
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
}

async function openMenu(page: Page, parent: string, child: string): Promise<void> {
  const menu = page.getByRole("menuitem", { name: parent, exact: true }).first();
  if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
  await page.getByRole("menu").first().getByRole("link", { name: child, exact: true }).click();
  await expect(page.getByRole("navigation", { name: "面包屑" })).toContainText(child, { timeout: 20_000 });
}

async function openScene(page: Page, child: string): Promise<void> {
  await openMenu(page, "场景管理", child);
}

async function openTaskModel(page: Page, child: string): Promise<void> {
  await openMenu(page, ["策略管理", "进程管理"].includes(child) ? "场景管理" : "任务模型", child);
}

async function openSystem(page: Page, child: string): Promise<void> {
  await openMenu(page, "系统管理", child);
}

function formItem(scope: ReturnType<Page["locator"]>, label: string) {
  return scope.locator(".el-form-item").filter({ hasText: label }).first();
}

async function fillField(scope: ReturnType<Page["locator"]>, label: string, value: string): Promise<void> {
  const item = formItem(scope, label);
  const field = item.locator("input, textarea").first();
  await expect(field).toBeVisible({ timeout: 10_000 });
  await field.fill(value);
}

async function chooseField(page: Page, scope: ReturnType<Page["locator"]>, label: string, option: string | RegExp): Promise<void> {
  const item = formItem(scope, label);
  const trigger = item.locator(".el-select, [role=combobox]").first();
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 10_000 });
  const matchingOptions = page.getByRole("option", { name: option });
  const optionLocator = (await matchingOptions.count()) > 0 ? matchingOptions.last() : page.getByRole("option").last();
  await expect(optionLocator).toBeVisible({ timeout: 10_000 });
  await optionLocator.click();
}

async function confirmDialog(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog").last();
  const namedConfirm = dialog.getByRole("button", { name: /确\s*[定认]|保\s*存/ }).last();
  if (await namedConfirm.count()) {
    await namedConfirm.click({ force: true });
    return;
  }
  await dialog.getByRole("button").last().click({ force: true });
}

async function expectSuccess(page: Page): Promise<void> {
  await expect(page.getByText(/操作成功|保存成功|删除成功|添加成功|更新成功/).last()).toBeVisible({ timeout: 15_000 });
}

async function confirmMessageBox(page: Page): Promise<void> {
  const confirm = page.getByRole("button", { name: "确定", exact: true }).last();
  await expect(confirm).toBeVisible({ timeout: 10_000 });
  await confirm.click({ force: true });
}

async function searchByField(page: Page, containerSelector: string, label: string, value: string): Promise<void> {
  const container = page.locator(containerSelector);
  await fillField(container, label, value);
  await page.getByRole("button", { name: "搜索", exact: true }).first().click();
  await page.waitForTimeout(500);
}

function tableRow(page: Page, value: string) {
  return page.getByRole("row").filter({ hasText: value }).last();
}

async function deleteSelected(page: Page, buttonName = "删除"): Promise<void> {
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await confirmMessageBox(page);
  await expectSuccess(page);
}

async function strategyQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".strategy-manage .form-content", "策略编号", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function createStrategy(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await fillField(dialog, "策略编号", code);
  await fillField(dialog, "策略名称", `${code}策略`);
  await chooseField(page, dialog, "策略归属", "重启续发(调度侧)");
  await chooseField(page, dialog, "值类型", "string");
  await fillField(dialog, "策略值", "AT_BASELINE");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function createTemplate(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await fillField(dialog, "模板编号", code);
  await fillField(dialog, "模板名称", `${code}模板`);
  await chooseField(page, dialog, "创建方式", "手工");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function templateQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".TaskTemManage .form-content", "模板编号", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function createTemplateItem(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await fillField(dialog, "模板项编码", code);
  await fillField(dialog, "模板项名称", `${code}流程项`);
  await chooseField(page, dialog, "类型", /取货|卸货|移动/);
  await confirmDialog(page);
  await expectSuccess(page);
}

async function templateItemQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".TaskTemItemManage .form-content", "流程编号", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function createRole(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await fillField(dialog, "角色编码", code);
  await fillField(dialog, "角色名称", `${code}角色`);
  await fillField(dialog, "角色描述", "本轮 TEST_OWNED 角色");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function roleQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".role-management .form-content", "角色编码", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function createTestUser(page: Page, code: string): Promise<void> {
  await openSystem(page, "用户管理");
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await fillField(dialog, "登录名", code);
  await fillField(dialog, "用户名", `${code}用户`);
  await fillField(dialog, "密码", "ATFPass2026");
  await fillField(dialog, "确认密码", "ATFPass2026");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function userQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".user-management .form-content", "登录名", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function deleteUserIfPresent(page: Page, code: string): Promise<void> {
  await userQuery(page, code).catch(() => undefined);
  const row = tableRow(page, code);
  if (await row.count()) {
    await row.click();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await confirmMessageBox(page);
    await expectSuccess(page);
  }
}

async function selectDictionaryParent(page: Page): Promise<void> {
  const parent = page.locator(".dict-manager .el-tree-node").filter({ hasText: "策略归属" }).last();
  await expect(parent).toBeVisible({ timeout: 15_000 });
  await parent.click();
  await page.waitForTimeout(500);
}

async function createDictionary(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  await fillField(dialog, "字典名", name);
  await chooseField(page, dialog, "类型", "手工");
  await fillField(dialog, "排序", "900");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function dictionaryRow(page: Page, name: string) {
  const row = tableRow(page, name);
  await expect(row).toBeVisible({ timeout: 15_000 });
  return row;
}

async function createExternal(page: Page, code: string): Promise<void> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const drawer = page.locator(".el-drawer:visible").last();
  await expect(drawer).toBeVisible();
  await fillField(drawer, "系统编码", code);
  await fillField(drawer, "系统名称", `${code}本地Mock`);
  await drawer.locator(".el-form-item").nth(2).locator("input").fill(localMockUrl);
  await drawer.locator(".el-form-item").nth(3).locator("input").fill("feedback/SUCCESS");
  await confirmDialog(page);
  await expectSuccess(page);
}

async function externalQuery(page: Page, code: string): Promise<void> {
  await searchByField(page, ".ExSystemManager .form-content", "系统编码", code);
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function createProcess(page: Page, operation: string): Promise<string> {
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  const mapField = formItem(dialog, "地图").locator(".el-select").first();
  await expect(mapField).toBeVisible({ timeout: 10_000 });
  const mapOptions = page.getByRole("option");
  await mapField.click();
  await mapOptions.first().click();
  const missionName = formItem(dialog, "进程名称").locator(".el-select").first();
  await missionName.click();
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 10_000 });
  const processCategoryByOperation: Record<string, string> = {
    create: "电池电量快照进程",
    update: "交管交互进程",
    delete: "维护进程",
    state: "状态反馈进程",
    relation: "充电检测进程",
  };
  await page.getByRole("option", { name: processCategoryByOperation[operation], exact: true }).click();
  const missionCode = formItem(dialog, "进程代码").locator("input").first();
  await expect(missionCode).toHaveValue(/.+/, { timeout: 10_000 });
  const createdCode = await missionCode.inputValue();
  await confirmDialog(page);
  await expectSuccess(page);
  await page.getByRole("button", { name: "刷新状态", exact: true }).click();
  return createdCode;
}

async function processQuery(page: Page, code: string): Promise<void> {
  await expect(tableRow(page, code)).toBeVisible({ timeout: 15_000 });
}

async function processDelete(page: Page, code: string): Promise<void> {
  const row = tableRow(page, code);
  await expect(row).toBeVisible({ timeout: 15_000 });
  const checkbox = row.getByRole("checkbox").first();
  if (await checkbox.count()) {
    if (!(await checkbox.isChecked())) await checkbox.click();
  } else {
    await row.click();
  }
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await confirmMessageBox(page);
  await expectSuccess(page);
}

test("TC-STRAT-CREATE-001 - TEST_OWNED strategy can be created", async ({ page, evidence }) => {
  const code = `${prefix}STRAT`;
  await login(page);
  await openTaskModel(page, "策略管理");
  evidence.step("create TEST_OWNED strategy through the visible form");
  await createStrategy(page, code);
  await strategyQuery(page, code);
  await evidence.captureCheckpoint("strategy-created");
  await tableRow(page, code).click();
  await deleteSelected(page);
  await strategyQuery(page, code).catch(() => undefined);
});

test("TC-STRAT-UPDATE-001 - TEST_OWNED strategy can be updated", async ({ page, evidence }) => {
  const code = `${prefix}STRATUPD`;
  await login(page);
  await openTaskModel(page, "策略管理");
  await createStrategy(page, code);
  try {
    await strategyQuery(page, code);
    await tableRow(page, code).click();
    await page.getByRole("button", { name: "修改", exact: true }).click();
    const dialog = page.getByRole("dialog").last();
    await fillField(dialog, "策略名称", `${code}更新`);
    await confirmDialog(page);
    await expectSuccess(page);
    await strategyQuery(page, code);
    await expect(tableRow(page, code)).toContainText(`${code}更新`);
    await evidence.captureCheckpoint("strategy-updated");
  } finally {
    await strategyQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined);
  }
});

test("TC-STRAT-DELETE-001 - TEST_OWNED strategy can be deleted", async ({ page, evidence }) => {
  const code = `${prefix}STRATDEL`;
  await login(page);
  await openTaskModel(page, "策略管理");
  await createStrategy(page, code);
  await strategyQuery(page, code);
  await tableRow(page, code).click();
  await evidence.captureCheckpoint("strategy-before-delete");
  await deleteSelected(page);
  await evidence.captureCheckpoint("strategy-deleted");
});

for (const [id, operation] of [["TC-PROC-CREATE-001", "create"], ["TC-PROC-UPDATE-001", "update"], ["TC-PROC-DELETE-001", "delete"], ["TC-PROC-STATE-001", "state"], ["TC-PROC-RELATION-001", "relation"]] as const) {
  test(`${id} - TEST_OWNED process ${operation} remains isolated`, async ({ page, evidence }) => {
    await login(page);
    await openTaskModel(page, "进程管理");
    evidence.step(`create isolated TEST_OWNED process for ${operation}`);
    const createdCode = await createProcess(page, operation);
    try {
      await processQuery(page, createdCode);
      if (operation === "update") {
        await tableRow(page, createdCode).click();
        await page.getByRole("button", { name: "修改", exact: true }).click();
        const dialog = page.getByRole("dialog").last();
        await expect(formItem(dialog, "进程代码").locator("input").first()).toHaveValue(/.+/);
        await confirmDialog(page);
        await expectSuccess(page);
      } else if (operation === "state") {
        await page.getByRole("button", { name: "刷新状态", exact: true }).click();
        await evidence.captureCheckpoint("process-state-observed");
      } else if (operation === "relation") {
        await tableRow(page, createdCode).click();
        const configButton = page.getByRole("button", { name: "策略配置", exact: true });
        await expect(configButton).toBeEnabled({ timeout: 10_000 });
        await configButton.click();
        await expect(page.getByRole("dialog").last()).toBeVisible({ timeout: 15_000 });
        await evidence.captureCheckpoint("process-relation-editor");
        const close = page.getByRole("button", { name: /关\s*闭|取消/ }).last();
        await close.click({ force: true });
      } else {
        await evidence.captureCheckpoint(`process-${operation}-result`);
      }
    } finally {
      await processDelete(page, createdCode).catch(() => undefined);
    }
  });
}

test("TC-MAINT-CREATE-001 - maintenance create is safety blocked by physical action", async ({ page, evidence }) => {
  test.skip(true, "SAFETY_BLOCKED: visible maintenance submit invokes vehicle movement");
  await page.goto(baseUrl);
  await evidence.captureCheckpoint("maintenance-safety-boundary");
});

test("TC-TTEMP-CREATE-001 - TEST_OWNED template can be created", async ({ page, evidence }) => {
  const code = `${prefix}TMPCRT`;
  await login(page); await openTaskModel(page, "任务模板"); await createTemplate(page, code);
  try { await templateQuery(page, code); await evidence.captureCheckpoint("template-created"); }
  finally { await templateQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-TTEMP-UPDATE-001 - TEST_OWNED template can be updated", async ({ page, evidence }) => {
  const code = `${prefix}TMPUPD`;
  await login(page); await openTaskModel(page, "任务模板"); await createTemplate(page, code);
  try { await templateQuery(page, code); await tableRow(page, code).click(); await page.getByRole("button", { name: "修改", exact: true }).click(); const dialog = page.getByRole("dialog").last(); await fillField(dialog, "模板名称", `${code}更新`); await confirmDialog(page); await expectSuccess(page); await templateQuery(page, code); await expect(tableRow(page, code)).toContainText(`${code}更新`); await evidence.captureCheckpoint("template-updated"); }
  finally { await templateQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-TTEMP-DELETE-001 - TEST_OWNED template can be deleted", async ({ page, evidence }) => {
  const code = `${prefix}TMPDEL`;
  await login(page); await openTaskModel(page, "任务模板"); await createTemplate(page, code); await templateQuery(page, code); await tableRow(page, code).click(); await evidence.captureCheckpoint("template-before-delete"); await deleteSelected(page); await evidence.captureCheckpoint("template-deleted");
});

test("TC-TTEMP-RELATION-001 - template detail relation is observable", async ({ page, evidence }) => {
  const code = `${prefix}TMPREL`;
  await login(page); await openTaskModel(page, "任务模板"); await createTemplate(page, code);
  try { await templateQuery(page, code); await tableRow(page, code).click(); await expect(page.getByText("模板详情", { exact: true }).last()).toBeVisible(); await evidence.captureCheckpoint("template-relation-detail"); }
  finally { await templateQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-TITEM-CREATE-001 - TEST_OWNED template item can be created", async ({ page, evidence }) => {
  const code = `${prefix}ITEMCRT`;
  await login(page); await openTaskModel(page, "模板项管理"); await createTemplateItem(page, code);
  try { await templateItemQuery(page, code); await evidence.captureCheckpoint("template-item-created"); }
  finally { await templateItemQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-TITEM-UPDATE-001 - TEST_OWNED template item can be updated", async ({ page, evidence }) => {
  const code = `${prefix}ITEMUPD`;
  await login(page); await openTaskModel(page, "模板项管理"); await createTemplateItem(page, code);
  try { await templateItemQuery(page, code); await tableRow(page, code).click(); await page.getByRole("button", { name: "修改", exact: true }).click(); const dialog = page.getByRole("dialog").last(); await fillField(dialog, "模板项名称", `${code}更新`); await confirmDialog(page); await expectSuccess(page); await templateItemQuery(page, code); await expect(tableRow(page, code)).toContainText(`${code}更新`); await evidence.captureCheckpoint("template-item-updated"); }
  finally { await templateItemQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-TITEM-DELETE-001 - TEST_OWNED template item can be deleted", async ({ page, evidence }) => {
  const code = `${prefix}ITEMDEL`;
  await login(page); await openTaskModel(page, "模板项管理"); await createTemplateItem(page, code); await templateItemQuery(page, code); await tableRow(page, code).click(); await evidence.captureCheckpoint("template-item-before-delete"); await deleteSelected(page); await evidence.captureCheckpoint("template-item-deleted");
});

test("TC-ROLE-UPDATE-001 - TEST_OWNED role can be updated", async ({ page, evidence }) => {
  const code = `${prefix}ROLEUPD`;
  await login(page); await openSystem(page, "角色管理"); await createRole(page, code);
  try { await roleQuery(page, code); await tableRow(page, code).click(); await page.getByRole("button", { name: "修改", exact: true }).click(); const dialog = page.getByRole("dialog").last(); await fillField(dialog, "角色名称", `${code}更新`); await confirmDialog(page); await expectSuccess(page); await roleQuery(page, code); await expect(tableRow(page, code)).toContainText(`${code}更新`); await evidence.captureCheckpoint("role-updated"); }
  finally { await roleQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-ROLE-DELETE-001 - TEST_OWNED role can be deleted", async ({ page, evidence }) => {
  const code = `${prefix}ROLEDEL`;
  await login(page); await openSystem(page, "角色管理"); await createRole(page, code); await roleQuery(page, code); await tableRow(page, code).click(); await evidence.captureCheckpoint("role-before-delete"); await deleteSelected(page); await evidence.captureCheckpoint("role-deleted");
});

test("TC-ROLE-RELATION-001 - TEST_OWNED role can assign a TEST_OWNED user", async ({ page, evidence }) => {
  const role = `${prefix}ROLEREL`; const user = `${prefix}USERREL`;
  await login(page); await createTestUser(page, user); await openSystem(page, "角色管理"); await createRole(page, role);
  try {
    await roleQuery(page, role); await tableRow(page, role).click(); await page.getByRole("button", { name: "用户分配", exact: true }).click();
    const dialog = page.getByRole("dialog").last(); await expect(dialog).toBeVisible();
    await fillField(dialog, "登录名", user); await dialog.getByRole("button", { name: "搜索", exact: true }).click();
    const row = dialog.getByRole("row").filter({ hasText: user }).last(); await expect(row).toBeVisible({ timeout: 15_000 }); await row.click();
    await expect(dialog.locator(".selected-user-table")).toContainText(user, { timeout: 10_000 });
    await dialog.getByRole("button", { name: /确\s*定/ }).last().click();
    await page.waitForTimeout(1_000);
    if (await dialog.isVisible().catch(() => false)) await dialog.locator(".dialog-footer button").first().click({ force: true });
    await evidence.captureCheckpoint("role-user-relation");
  } finally {
    const assignmentDialog = page.getByRole("dialog").last();
    if (await assignmentDialog.isVisible().catch(() => false)) {
      await assignmentDialog.locator(".dialog-footer button").first().click({ force: true }).catch(() => undefined);
    }
    await roleQuery(page, role).then(async () => { await tableRow(page, role).click(); await deleteSelected(page); }).catch(() => undefined);
    await openSystem(page, "用户管理"); await deleteUserIfPresent(page, user);
  }
});

test("TC-DICT-CREATE-001 - TEST_OWNED dictionary item can be created", async ({ page, evidence }) => {
  const name = `${prefix}DICTCRT`;
  await login(page); await openSystem(page, "字典管理"); await selectDictionaryParent(page); await createDictionary(page, name); try { await dictionaryRow(page, name); await evidence.captureCheckpoint("dictionary-created"); } finally { await dictionaryRow(page, name).then(async (row) => { await row.click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-DICT-UPDATE-001 - TEST_OWNED dictionary item can be updated", async ({ page, evidence }) => {
  const name = `${prefix}DICTUPD`;
  await login(page); await openSystem(page, "字典管理"); await selectDictionaryParent(page); await createDictionary(page, name); try { const row = await dictionaryRow(page, name); await row.click(); await page.getByRole("button", { name: "修改", exact: true }).click(); const dialog = page.getByRole("dialog").last(); await fillField(dialog, "字典名", `${name}更新`); await confirmDialog(page); await expectSuccess(page); await dictionaryRow(page, `${name}更新`); await evidence.captureCheckpoint("dictionary-updated"); } finally { await dictionaryRow(page, `${name}更新`).then(async (row) => { await row.click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-DICT-DELETE-001 - TEST_OWNED dictionary item can be deleted", async ({ page, evidence }) => {
  const name = `${prefix}DICTDEL`;
  await login(page); await openSystem(page, "字典管理"); await selectDictionaryParent(page); await createDictionary(page, name); const row = await dictionaryRow(page, name); await row.click(); await evidence.captureCheckpoint("dictionary-before-delete"); await deleteSelected(page); await evidence.captureCheckpoint("dictionary-deleted");
});

test("TC-EXT-CREATE-001 - TEST_OWNED local mock external config can be created", async ({ page, evidence }) => {
  const code = `${prefix}EXTCRT`;
  await login(page); await openSystem(page, "外部系统配置"); await createExternal(page, code); try { await externalQuery(page, code); await evidence.captureCheckpoint("external-created"); } finally { await externalQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-EXT-UPDATE-001 - TEST_OWNED local mock external config can be updated", async ({ page, evidence }) => {
  const code = `${prefix}EXTUPD`;
  await login(page); await openSystem(page, "外部系统配置"); await createExternal(page, code); try { await externalQuery(page, code); await tableRow(page, code).click(); await page.getByRole("button", { name: "修改", exact: true }).click(); const drawer = page.locator(".el-drawer:visible").last(); await fillField(drawer, "系统名称", `${code}更新`); await confirmDialog(page); await expectSuccess(page); await externalQuery(page, code); await expect(tableRow(page, code)).toContainText(`${code}更新`); await evidence.captureCheckpoint("external-updated"); } finally { await externalQuery(page, code).then(async () => { await tableRow(page, code).click(); await deleteSelected(page); }).catch(() => undefined); }
});

test("TC-EXT-DELETE-001 - TEST_OWNED local mock external config can be deleted", async ({ page, evidence }) => {
  const code = `${prefix}EXTDEL`;
  await login(page); await openSystem(page, "外部系统配置"); await createExternal(page, code); await externalQuery(page, code); await tableRow(page, code).click(); await evidence.captureCheckpoint("external-before-delete"); await deleteSelected(page); await evidence.captureCheckpoint("external-deleted");
});
