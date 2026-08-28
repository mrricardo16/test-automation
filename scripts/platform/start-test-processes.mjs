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

const evidence = { runId, mapCode, mapName, status: "RUNNING" };
const summarizeResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  return { httpStatus: response.status(), statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, message: typeof body?.message === "string" ? body.message.slice(0, 240) : null };
};
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

async function selectMapAndSearch() {
  const mapFilter = page.locator(".MissionManage .el-select").first();
  await mapFilter.click();
  await page.getByRole("option", { name: `${mapCode} - ${mapName}`, exact: true }).click();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Mission/GetPageMissionList"), { timeout: 30_000 });
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await responsePromise;
}

try {
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const loginResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: "录" }).click();
  evidence.login = await summarizeResponse(await loginResponsePromise);
  await page.waitForURL("**/#/dashboard", { timeout: 30_000 });
  await page.getByRole("menuitem", { name: "场景管理", exact: true }).first().click();
  await page.getByRole("link", { name: "进程管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/MissionManage", { timeout: 30_000 });
  await selectMapAndSearch();
  const mapRefreshPromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/ctrl/RefreshMap"), { timeout: 60_000 }).catch(() => null);
  await page.getByRole("button", { name: "刷新地图", exact: true }).click();
  const confirmDialog = page.getByRole("dialog").last();
  await confirmDialog.getByRole("button", { name: "确定", exact: true }).click();
  const mapRefreshResponse = await mapRefreshPromise;
  if (mapRefreshResponse) evidence.mapRefreshResponse = await summarizeResponse(mapRefreshResponse);
  await selectMapAndSearch();
  const statusResponsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/Mission/GetMissionRunningStatus"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "刷新状态", exact: true }).click();
  const statusResponse = await statusResponsePromise;
  if (statusResponse) evidence.runningStatusResponse = await summarizeResponse(statusResponse);
  evidence.rows = await page.getByRole("row").evaluateAll((elements) => elements.map((element) => element.innerText.replace(/\s+/g, " ").trim()).filter(Boolean));
  evidence.testMapProcessRows = evidence.rows.filter((row) => row.includes(mapCode) || row.includes("链式搬运进程") || row.includes("状态反馈进程"));
  evidence.chainProcessRunning = evidence.rows.some((row) => row.includes("链式搬运进程") && row.includes("运行中"));
  evidence.feedbackProcessRunning = evidence.rows.some((row) => row.includes("状态反馈进程") && row.includes("运行中"));
  evidence.status = evidence.chainProcessRunning ? "PASS" : "BLOCKED";
  await page.screenshot({ path: path.join(evidenceRoot, "process-after-refresh-state.png"), fullPage: true });
  await writeFile(path.join(evidenceRoot, "process-start-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.status, mapCode, chainProcessRunning: evidence.chainProcessRunning, feedbackProcessRunning: evidence.feedbackProcessRunning }));
} catch (error) {
  evidence.status = "ERROR";
  evidence.error = String(error?.message ?? error).slice(0, 500);
  await writeFile(path.join(evidenceRoot, "process-start-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(evidenceRoot, "process-start-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
