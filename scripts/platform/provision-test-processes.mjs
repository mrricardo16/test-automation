import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const mapName = process.env.TEST_MAP_NAME ?? "AT_0827_02_MAP";
const evidenceRoot = path.resolve(process.env.PROCESS_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/process`);
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");

const evidence = { runId, mapCode, mapName, processes: [], createAttempts: [], status: "RUNNING" };
const summarizeResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  return { httpStatus: response.status(), statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, message: typeof body?.message === "string" ? body.message.slice(0, 240) : null };
};

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

async function login() {
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: "录" }).click();
  evidence.login = await summarizeResponse(await responsePromise);
  await page.waitForURL("**/#/dashboard", { timeout: 30_000 });
}

async function openProcessManagement() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "进程管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/MissionManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
}

async function selectTestMapFilter() {
  const mapFilter = page.locator(".MissionManage .el-select").first();
  await mapFilter.click();
  await page.getByRole("option", { name: `${mapCode} - ${mapName}`, exact: true }).click();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Mission/GetPageMissionList"), { timeout: 30_000 });
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await responsePromise;
}

async function findProcessRow(processName) {
  const row = page.getByRole("row").filter({ hasText: processName }).first();
  const count = await row.count();
  if (count === 0) return null;
  const cells = (await row.getByRole("cell").allInnerTexts()).map((value) => value.replace(/\s+/g, " ").trim());
  return { row, cells, text: (await row.innerText()).replace(/\s+/g, " ").trim() };
}

async function createProcess(processName, processCode) {
  const existing = await findProcessRow(processName);
  if (existing) {
    evidence.processes.push({ processName, processCode: existing.cells[2] ?? processCode, processId: existing.cells[1] ?? null, autoStart: existing.text.includes("是"), preexisting: true, rowText: existing.text });
    return;
  }
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  const selects = dialog.locator(".el-select");
  await selects.nth(0).click();
  await page.getByRole("option", { name: `${mapCode} - ${mapName}`, exact: true }).click();
  await selects.nth(1).click();
  await page.getByRole("option", { name: processName, exact: true }).click();
  await dialog.locator(".el-switch").click();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Mission/AddMission"), { timeout: 30_000 });
  await dialog.getByRole("button", { name: /确\s*定/ }).click();
  const response = await responsePromise;
  const result = await summarizeResponse(response);
  evidence.createAttempts.push({ processName, result });
  if (result.isSuccess === false || result.httpStatus >= 400) throw new Error(`BLOCKED: ${processName} create rejected: ${result.message ?? "backend rejected the request"}`);
  await selectTestMapFilter();
  const created = await findProcessRow(processName);
  if (!created) throw new Error(`ERROR: ${processName} was created but not visible under the test map filter`);
  evidence.processes.push({ processName, processCode: created.cells[2] ?? processCode, processId: created.cells[1] ?? null, autoStart: true, preexisting: false, createResponse: result, rowText: created.text });
}

async function refreshRuntimeMap() {
  const responsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/ctrl/RefreshMap"), { timeout: 60_000 }).catch(() => null);
  await page.getByRole("button", { name: "刷新地图", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await dialog.getByRole("button", { name: "确定", exact: true }).click();
  const response = await responsePromise;
  if (response) evidence.refreshMapResponse = await summarizeResponse(response);
}

async function refreshAndVerifyRunning() {
  await refreshRuntimeMap();
  await selectTestMapFilter();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/Mission/GetMissionRunningStatus"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "刷新状态", exact: true }).click();
  const response = await responsePromise;
  if (response) evidence.runningStatusResponse = await summarizeResponse(response);
  const rows = await page.getByRole("row").evaluateAll((elements) => elements.map((element) => element.innerText.replace(/\s+/g, " ").trim()).filter(Boolean));
  evidence.rowsAfterRefresh = rows;
  evidence.processes = evidence.processes.map((item) => {
    const rowText = rows.find((text) => text.includes(item.processName)) ?? "";
    return { ...item, runtimeRowText: rowText, running: /运行中/.test(rowText) };
  });
  return evidence.processes.every((item) => item.running);
}

await mkdir(evidenceRoot, { recursive: true });
try {
  await login();
  await openProcessManagement();
  await selectTestMapFilter();
  await createProcess("链式搬运进程", "AT_0827_02_CHAIN");
  await createProcess("状态反馈进程", "AT_0827_02_FEEDBACK");
  const running = await refreshAndVerifyRunning();
  evidence.runningVerified = running;
  evidence.status = running ? "PASS" : "BLOCKED";
  await page.screenshot({ path: path.join(evidenceRoot, "process-running-state.png"), fullPage: true });
  await writeFile(path.join(evidenceRoot, "process-provisioning-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!running) throw new Error("BLOCKED: one or more TEST_OWNED processes are not running after refresh");
  console.log(JSON.stringify({ status: evidence.status, mapCode, processCount: evidence.processes.length, runningVerified: evidence.runningVerified }));
} catch (error) {
  evidence.status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.error = String(error?.message ?? error).slice(0, 500);
  await writeFile(path.join(evidenceRoot, "process-provisioning-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(evidenceRoot, "process-provisioning-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
