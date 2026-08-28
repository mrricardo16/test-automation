import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const carName = process.env.TEST_DUMMY_CAR_NAME ?? "AT_0827_02_DUMMY";
const carId = process.env.TEST_DUMMY_CAR_ID ?? "1901";
const evidenceRoot = path.resolve(process.env.DUMMY_CAR_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car`);
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");

const evidence = { runId, mapCode, carName, carId, status: "BLOCKED", creationMethod: "FORMAL_WEB_UI_ONLY", cleanupRequired: true };
const summarizeResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  const safeData = body?.data && typeof body.data === "object" && !Array.isArray(body.data)
    ? Object.fromEntries(Object.entries(body.data).filter(([key]) => !/token|password|authorization|secret|cookie/i.test(key)))
    : Array.isArray(body?.data) ? body.data : undefined;
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

async function openVehicleManagement() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "车辆管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/VehicleManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
}

async function observeOfficialMap() {
  return await page.evaluate(() => {
    const config = window.RssConfig ?? {};
    return { apiUrlPresent: Boolean(config.APIURL || config.apiUrl || config.baseURL), configKeys: Object.keys(config).filter((key) => !/token|pass|secret|auth/i.test(key)) };
  });
}

async function searchByName() {
  const inputs = await page.locator(".VehicleManage input").evaluateAll((elements) => elements.map((element) => ({ placeholder: element.getAttribute("placeholder") ?? "", value: element.value })));
  const target = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).locator("input").first();
  await target.fill(carName);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Car/GetPageCarList"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const response = await responsePromise;
  return { inputs, response: response ? await summarizeResponse(response) : null, rows: await page.getByRole("row").evaluateAll((rows) => rows.map((row) => ({ text: row.innerText.replace(/\s+/g, " ").trim(), cells: Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.replace(/\s+/g, " ").trim()) })).filter((row) => row.text)) };
}

async function getCarInfo(carId) {
  return await page.evaluate(async (id) => {
    const response = await fetch(`/api/info/GetCarInfo?carid=${encodeURIComponent(id)}`);
    const body = await response.json().catch(() => ({}));
    return { httpStatus: response.status, statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, data: body?.data ?? null, message: typeof body?.message === "string" ? body.message.slice(0, 240) : null };
  }, String(carId));
}

try {
  await mkdir(evidenceRoot, { recursive: true });
  await login();
  await openVehicleManagement();
  evidence.runtimeConfigObservation = await observeOfficialMap();
  const existing = await searchByName();
  evidence.existingSearch = existing;
  const existingRows = existing.rows.filter((row) => row.text.includes(carName));
  if (existingRows.length > 1) throw new Error("ERROR: multiple exact test-owned DummyCar rows already exist");
  if (existingRows.length === 1) {
    evidence.created = false;
    evidence.preexisting = true;
    evidence.existingRow = existingRows[0];
    evidence.status = "PASS";
    await writeFile(path.join(evidenceRoot, "dummy-car-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ status: evidence.status, preexisting: true, carName }));
  } else {
    const officialMapResponsePromise = page.waitForResponse((response) => response.url().includes("/IsCurrentMapOfficial"), { timeout: 30_000 }).catch(() => null);
    await page.getByRole("button", { name: "新增", exact: true }).click();
    const officialMapResponse = await officialMapResponsePromise;
    evidence.activeMapApiObservation = officialMapResponse ? await summarizeResponse(officialMapResponse) : null;
    const drawer = page.getByRole("dialog").last();
    try {
      await drawer.waitFor({ state: "visible", timeout: 5_000 });
    } catch {
      throw new Error(`BLOCKED: vehicle add UI did not open; IsCurrentMapOfficial=${JSON.stringify(evidence.activeMapApiObservation)}`);
    }
    const codeItem = drawer.locator(".el-form-item").filter({ hasText: "车型代码" });
    const codeSelect = codeItem.locator(".el-select").first();
    await codeSelect.click();
    const options = await page.getByRole("option").evaluateAll((elements) => elements.map((element) => ({ text: element.innerText.replace(/\s+/g, " ").trim(), value: element.getAttribute("value") ?? null })));
    evidence.carTypeOptions = options;
    const dummyOption = page.getByRole("option").filter({ hasText: /模拟|Dummy|Simulated/i }).first();
    await dummyOption.waitFor({ state: "visible", timeout: 30_000 });
    await dummyOption.click();
    evidence.selectedDummyType = (await dummyOption.innerText()).replace(/\s+/g, " ").trim();
    const nameItem = drawer.locator(".el-form-item").filter({ hasText: "车辆名称" });
    await nameItem.locator("input").fill(carName);
    const idItem = drawer.locator(".el-form-item").filter({ hasText: "车辆ID" });
    await idItem.locator("input").fill(carId);
    const layerItem = drawer.locator(".el-form-item").filter({ hasText: "图层名称" });
    await layerItem.locator(".el-select").click();
    const layerOptions = page.locator(".el-select-dropdown:visible [role=option]");
    const layerOptionTexts = await layerOptions.allInnerTexts();
    evidence.layerOptions = layerOptionTexts.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean);
    await layerOptions.first().click();
    const addResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Car/AddCar"), { timeout: 30_000 });
    await drawer.getByRole("button", { name: /确\s*认/ }).click();
    evidence.addResponse = await summarizeResponse(await addResponsePromise);
    if (evidence.addResponse.isSuccess === false || evidence.addResponse.httpStatus >= 400) throw new Error(`BLOCKED: DummyCar create rejected: ${evidence.addResponse.message ?? "backend rejected the request"}`);
    evidence.created = true;
    const afterCreate = await searchByName();
    evidence.afterCreate = afterCreate;
    const createdRows = afterCreate.rows.filter((row) => row.text.includes(carName));
    if (createdRows.length !== 1) throw new Error(`ERROR: expected one created DummyCar row, found ${createdRows.length}`);
    evidence.createdRow = createdRows[0];
    const idCell = createdRows[0].cells.find((cell) => /^\d+$/.test(cell));
    evidence.carId = idCell ?? null;
    if (!evidence.carId) throw new Error("ERROR: created DummyCar row did not expose a numeric car id");
    evidence.carInfoBeforeRefresh = await getCarInfo(evidence.carId);
    const refreshResponsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/ctrl/RefreshMap"), { timeout: 60_000 }).catch(() => null);
    await page.getByRole("button", { name: "刷新地图", exact: true }).click();
    const confirmDialog = page.getByRole("dialog").last();
    await confirmDialog.getByRole("button", { name: "确定", exact: true }).click();
    const refreshResponse = await refreshResponsePromise;
    evidence.refreshMapResponse = refreshResponse ? await summarizeResponse(refreshResponse) : null;
    evidence.carInfoAfterRefresh = await getCarInfo(evidence.carId);
    evidence.status = "PASS";
    evidence.simulationIdentityConfirmed = Boolean(evidence.selectedDummyType && /模拟|Dummy|Simulated/i.test(evidence.selectedDummyType));
    evidence.initialized = evidence.carInfoAfterRefresh?.data?.siteid !== -1;
    evidence.located = evidence.initialized;
    evidence.safeForGoldenPath = evidence.simulationIdentityConfirmed && evidence.carInfoAfterRefresh?.isSuccess === true && evidence.initialized;
    if (!evidence.simulationIdentityConfirmed) throw new Error("ERROR: selected vehicle type did not expose explicit simulation identity");
    await page.screenshot({ path: path.join(evidenceRoot, "dummy-car-created.png"), fullPage: true });
    await writeFile(path.join(evidenceRoot, "dummy-car-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ status: evidence.status, created: true, carName, carId: evidence.carId, selectedDummyType: evidence.selectedDummyType, safeForGoldenPath: evidence.safeForGoldenPath }));
  }
} catch (error) {
  evidence.status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.error = String(error?.message ?? error).replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 500);
  await writeFile(path.join(evidenceRoot, "dummy-car-provisioning-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(evidenceRoot, "dummy-car-provisioning-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
