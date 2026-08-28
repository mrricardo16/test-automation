import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const evidenceRoot = path.resolve(process.env.RUNTIME_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/process`);
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");

const evidence = {
  runId,
  status: "BLOCKED",
  mapSetupAuthority: "MANUALLY_CONFIRMED_BY_OPERATOR",
  mapSwitchAutomation: "NOT_REQUIRED",
  currentMapObservation: null,
  mapLibraryObservation: [],
  mapFilterOptions: [],
  processObservations: [],
};
const summarizeResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  const safeData = body?.data && typeof body.data === "object" && !Array.isArray(body.data)
    ? Object.fromEntries(Object.entries(body.data).filter(([key]) => ["mapCode", "mapStatus", "isOfficial", "PageIndex", "PageSize", "TotalCount", "TotalPages", "HasPreviousPage", "HasNextPage"].includes(key)))
    : Array.isArray(body?.data) ? { arrayCount: body.data.length } : undefined;
  return {
    httpStatus: response.status(),
    statusCode: body?.statusCode ?? body?.code ?? null,
    isSuccess: body?.isSuccess ?? null,
    message: typeof body?.message === "string" ? body.message.replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 240) : null,
    data: safeData,
  };
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

async function openDrawingTool() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "画图工具", exact: true }).click();
  await page.getByRole("button").filter({ hasText: "加载(库)" }).waitFor({ state: "visible", timeout: 30_000 });
  await page.getByText("正在加载地图...").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => undefined);
  evidence.currentMapObservation = await page.evaluate(() => ({
    mapCode: sessionStorage.getItem("draw.currentMapCode"),
    mapName: sessionStorage.getItem("draw.currentMapName"),
    mapStatus: sessionStorage.getItem("draw.currentMapStatus"),
  }));

  await page.getByRole("button").filter({ hasText: "加载(库)" }).click();
  const dialog = page.getByRole("dialog").last();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Map/GetPageMapList"), { timeout: 30_000 }).catch(() => null);
  await dialog.getByRole("button", { name: "搜索", exact: true }).click();
  const response = await responsePromise;
  if (response) evidence.mapListResponse = await summarizeResponse(response);
  evidence.mapLibraryObservation = await dialog.getByRole("row").evaluateAll((rows) => rows.map((row) => ({ text: row.innerText.replace(/\s+/g, " ").trim(), cells: Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.replace(/\s+/g, " ").trim()) })).filter((row) => row.text));
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
}

async function observeBackendCurrentMap() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "车辆管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/VehicleManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
  const officialMapResponsePromise = page.waitForResponse((response) => response.url().includes("/IsCurrentMapOfficial"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const officialMapResponse = await officialMapResponsePromise;
  evidence.backendCurrentMapObservation = officialMapResponse ? await summarizeResponse(officialMapResponse) : null;
  const dialog = page.getByRole("dialog").last();
  if (await dialog.isVisible().catch(() => false)) {
    const close = dialog.getByRole("button", { name: /取 消|关闭/ });
    if (await close.count()) await close.first().click();
  }
}

async function openProcessManagement() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "进程管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/MissionManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "刷新状态", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
}

async function getMapFilterOptions() {
  const filter = page.locator(".MissionManage .el-select").first();
  await filter.click();
  const options = await page.getByRole("option").allInnerTexts();
  await page.keyboard.press("Escape");
  evidence.mapFilterOptions = options.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean);
  return filter;
}

async function searchSelectedMap(filter, optionText) {
  await filter.click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Mission/GetPageMissionList"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const response = await responsePromise;
  const rows = await page.getByRole("row").evaluateAll((elements) => elements.map((element) => ({ text: element.innerText.replace(/\s+/g, " ").trim(), cells: Array.from(element.querySelectorAll("td")).map((cell) => cell.innerText.replace(/\s+/g, " ").trim()) })).filter((row) => row.text));
  return { optionText, response: response ? await summarizeResponse(response) : null, rows };
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await login();
  await openDrawingTool();
  await observeBackendCurrentMap();
  await openProcessManagement();
  const filter = await getMapFilterOptions();
  for (const optionText of evidence.mapFilterOptions) evidence.processObservations.push(await searchSelectedMap(filter, optionText));

  const currentCode = evidence.backendCurrentMapObservation?.data?.mapCode || evidence.currentMapObservation?.mapCode;
  const currentOption = evidence.mapFilterOptions.find((value) => currentCode && value.startsWith(`${currentCode} -`));
  if (currentOption) {
    const currentResult = await searchSelectedMap(filter, currentOption);
    evidence.currentMapProcessObservation = currentResult;
    const statusResponsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/Mission/GetMissionRunningStatus"), { timeout: 30_000 }).catch(() => null);
    await page.getByRole("button", { name: "刷新状态", exact: true }).click();
    const statusResponse = await statusResponsePromise;
    evidence.runningStatusResponse = statusResponse ? await summarizeResponse(statusResponse) : null;
    evidence.currentMapProcessRowsAfterRefresh = await page.getByRole("row").evaluateAll((elements) => elements.map((element) => element.innerText.replace(/\s+/g, " ").trim()).filter(Boolean));
  }

  const allRows = evidence.processObservations.flatMap((observation) => observation.rows.filter((row) => row.cells.length > 0).map((row) => ({ mapFilter: observation.optionText, ...row })));
  evidence.chainProcesses = allRows.filter((row) => /链式搬运进程|chain/i.test(row.text));
  evidence.feedbackProcesses = allRows.filter((row) => /状态反馈进程|feedback/i.test(row.text));
  evidence.processDiscoveryStatus = evidence.currentMapProcessObservation ? "PASS" : "BLOCKED";
  evidence.status = evidence.currentMapProcessObservation ? "PASS" : "BLOCKED";
  await page.screenshot({ path: path.join(evidenceRoot, "current-process-discovery.png"), fullPage: true });
  await writeFile(path.join(evidenceRoot, "current-runtime-discovery.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.status, currentMap: evidence.currentMapObservation, currentMapOption: currentOption ?? null, mapFilterCount: evidence.mapFilterOptions.length, chainCount: evidence.chainProcesses.length, feedbackCount: evidence.feedbackProcesses.length }));
} catch (error) {
  evidence.status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.error = String(error?.message ?? error).replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 500);
  await writeFile(path.join(evidenceRoot, "current-runtime-discovery-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(evidenceRoot, "current-runtime-discovery-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
