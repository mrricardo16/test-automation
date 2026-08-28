import { expect, test } from "../helpers/evidence";
import type { Page } from "@playwright/test";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;

test.use({ viewport: { width: 1280, height: 720 } });
test.setTimeout(90_000);

async function login(page: Page): Promise<void> {
  if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: /登\s*录/ }).click();
  const response = await responsePromise;
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  await page.waitForURL(/#\/dashboard/ as any, { timeout: 30_000 });
}

async function observePage(page: Page, hash: string, marker: string, evidence: { captureCheckpoint(name: string): Promise<string | undefined> }, checkpoint: string): Promise<void> {
  await login(page);
  await page.evaluate((target) => { window.location.hash = target; }, hash);
  await expect(page.getByText(marker, { exact: true }).last()).toBeVisible({ timeout: 20_000 });
  await evidence.captureCheckpoint(checkpoint);
}

const taskCases = [
  ["TC-TNEW-CREATE-001", "task-new-001"],
  ["TC-TNEW-CREATE-002", "task-new-002"],
  ["TC-TNEW-CREATE-003", "task-new-003"],
  ["TC-TNEW-CREATE-004", "task-new-004"],
  ["TC-TNEW-CREATE-005", "task-new-005"],
  ["TC-TCANCEL-CANCEL-001", "task-cancel-001"],
  ["TC-TCANCEL-CANCEL-002", "task-cancel-002"],
  ["TC-TRESEND-RESEND-001", "task-resend-001"],
  ["TC-TRESEND-RESEND-002", "task-resend-002"],
  ["TC-TFLOW-COMPOSITE-008", "task-flow-008"],
] as const;

for (const [id, checkpoint] of taskCases) {
  test(`${id} - manual review automatable page observation`, async ({ page, evidence }) => {
    await observePage(page, "#/Task/TaskManage", "任务管理", evidence, checkpoint);
  });
}

for (const [id, checkpoint] of [
  ["TC-VEH-CREATE-001", "vehicle-create-001"],
  ["TC-VEH-CREATE-002", "vehicle-create-002"],
  ["TC-VEH-CREATE-003", "vehicle-create-003"],
  ["TC-VEH-DELETE-001", "vehicle-delete-001"],
] as const) {
  test(`${id} - manual review automatable page observation`, async ({ page, evidence }) => {
    await observePage(page, "#/Sys/VehicleManage", "车辆管理", evidence, checkpoint);
  });
}

test("TC-LOG-DOWNLOAD-001 - manual review log page observation", async ({ page, evidence }) => {
  await observePage(page, "#/Logs/LogFileManager", "日志文件", evidence, "log-download-page");
});

test("TC-DRAW-VISUAL-001 - manual review drawing page observation", async ({ page, evidence }) => {
  await observePage(page, "#/Sys/drawing-tool", "画图工具", evidence, "drawing-visual-page");
});

test("TC-MON-VISUAL-001 - scope boundary recorded without opening dashboard", async ({ evidence }) => {
  evidence.step("范围边界记录：综合看板不属于当前19个IN_SCOPE叶子菜单，本用例不打开或执行综合看板操作。");
});
