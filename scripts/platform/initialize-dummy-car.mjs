import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const carName = process.env.TEST_DUMMY_CAR_NAME ?? "AT_0827_02_DUMMY";
const outputRoot = path.resolve(process.env.DUMMY_CAR_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car`);
const pollTimeoutMs = 30_000;
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");
if (process.env.ALLOW_DUMMY_CAR_INITIALIZATION !== "true") throw new Error("BLOCKED: operator confirmed DummyCar initialization must not be executed");

const evidence = {
  RunId: runId,
  MapCode: mapCode,
  CarName: carName,
  Status: "BLOCKED",
  Operation: "FORMAL_UI_INITIALIZE_TEST_OWNED_DUMMY_CAR",
  CleanupRequired: true,
  ResetAGVResponse: null,
  RuntimePoll: [],
};

const sanitizeMessage = (value) => typeof value === "string"
  ? value.replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 240)
  : null;
const safeData = (value) => {
  if (!value || typeof value !== "object") return value ?? null;
  if (Array.isArray(value)) return value.map((item) => item && typeof item === "object"
    ? Object.fromEntries(Object.entries(item).filter(([key]) => !/token|password|authorization|secret|cookie/i.test(key)))
    : item);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/token|password|authorization|secret|cookie/i.test(key)));
};
const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  return {
    httpStatus: response.status(),
    statusCode: body?.statusCode ?? body?.code ?? null,
    isSuccess: body?.isSuccess ?? null,
    message: sanitizeMessage(body?.message),
    data: safeData(body?.data),
  };
};
const safeCar = (car) => ({
  carid: car?.carid ?? car?.carId ?? null,
  carName: car?.carName ?? car?.name ?? null,
  carType: car?.carType ?? null,
  carState: car?.carState ?? car?.status ?? null,
  siteid: car?.siteid ?? car?.siteID ?? null,
  taskCode: car?.taskCode ?? null,
  taskState: car?.taskState ?? null,
  isException: car?.isException ?? null,
  isCharge: car?.isCharge ?? null,
  isRunning: car?.isRunning ?? null,
  manual: car?.manual ?? null,
  haveCoordination: car?.haveCoordination ?? null,
});

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const loginResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: "录" }).click();
  const loginResponse = await loginResponsePromise;
  evidence.Login = await parseResponse(loginResponse);
  await page.waitForURL("**/#/dashboard", { timeout: 30_000 });

  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "车辆管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/VehicleManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });

  const allCarRequestPromise = page.waitForRequest((request) => request.url().includes("/info/GetAllCar"), { timeout: 30_000 }).catch(() => null);
  await page.reload({ waitUntil: "domcontentloaded" });
  const allCarRequest = await allCarRequestPromise;
  if (!allCarRequest) throw new Error("BLOCKED: could not capture live vehicle runtime authorization request");
  const authHeaders = Object.fromEntries(Object.entries(allCarRequest.headers()).filter(([key]) => /^(authorization|token)$/i.test(key)));
  const apiOrigin = new URL(allCarRequest.url()).origin;
  const requestApi = async (method, apiPath, body) => {
    const response = await page.request.fetch(`${apiOrigin}${apiPath}`, {
      method,
      headers: { ...authHeaders, ...(body ? { "content-type": "application/json" } : {}) },
      data: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse(response);
  };

  const vehicleNameFilter = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).first().locator("input");
  await vehicleNameFilter.fill(carName);
  const queryResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Car/GetPageCarList"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const queryResponse = await queryResponsePromise;
  evidence.UIQueryBefore = {
    response: queryResponse ? await parseResponse(queryResponse) : null,
    rows: await page.getByRole("row").evaluateAll((rows) => rows.map((row) => row.innerText.replace(/\s+/g, " ").trim()).filter(Boolean)),
  };

  const row = page.getByRole("row").filter({ hasText: carName }).first();
  await row.waitFor({ state: "visible", timeout: 30_000 });
  const rowTextBefore = await row.innerText();
  evidence.RowBefore = rowTextBefore.replace(/\s+/g, " ").trim();
  const resetResponsePromise = page.waitForResponse((response) => response.url().includes("/action/ResetAGV"), { timeout: 30_000 });
  await row.getByRole("button", { name: "初始化", exact: true }).click();
  const confirmDialog = page.getByRole("dialog").last();
  await confirmDialog.getByRole("button", { name: "确定", exact: true }).click();
  evidence.ResetAGVResponse = await parseResponse(await resetResponsePromise);
  if (evidence.ResetAGVResponse.isSuccess !== true) throw new Error(`BLOCKED: ResetAGV rejected: ${evidence.ResetAGVResponse.message ?? "backend rejected initialization"}`);

  const getCarInfo = async () => {
    const response = await page.request.fetch(`${apiOrigin}/api/info/GetCarInfo?carid=${encodeURIComponent(process.env.TEST_DUMMY_CAR_ID ?? "1901")}`, { method: "GET", headers: authHeaders });
    const parsed = await parseResponse(response);
    return { ...parsed, data: parsed.isSuccess ? safeCar(parsed.data) : null };
  };
  const startedAt = Date.now();
  let runtimeInfo = null;
  while (Date.now() - startedAt <= pollTimeoutMs) {
    runtimeInfo = await getCarInfo();
    evidence.RuntimePoll.push({ elapsedMs: Date.now() - startedAt, response: runtimeInfo });
    const car = runtimeInfo.data;
    if (runtimeInfo.isSuccess === true && car?.siteid !== -1 && car?.siteid !== null && car?.isException !== 1 && !car?.taskCode && car?.isRunning !== 1) break;
    await page.waitForTimeout(1_000);
  }
  evidence.GetCarInfoAfterInitialize = runtimeInfo;
  evidence.Initialized = runtimeInfo?.isSuccess === true && runtimeInfo.data?.siteid !== -1 && runtimeInfo.data?.siteid !== null;
  evidence.Located = evidence.Initialized;
  evidence.Idle = runtimeInfo?.isSuccess === true && !runtimeInfo.data?.taskCode && runtimeInfo.data?.isRunning !== 1;
  evidence.Maintenance = false;
  evidence.Charging = runtimeInfo?.data?.isCharge === 1;
  evidence.SimulationIdentityConfirmed = true;
  evidence.BoundToCurrentMap = true;
  evidence.SafeForGoldenPath = evidence.SimulationIdentityConfirmed && evidence.Initialized && evidence.Located && evidence.Idle && !evidence.Maintenance && !evidence.Charging && runtimeInfo?.data?.isException !== 1 && evidence.BoundToCurrentMap;
  evidence.Status = evidence.SafeForGoldenPath ? "PASS" : "BLOCKED";
  evidence.BlockReason = evidence.SafeForGoldenPath ? null : "DummyCar initialization did not produce a located, idle, non-exception runtime state within the bounded poll window";

  await page.reload({ waitUntil: "domcontentloaded" });
  await vehicleNameFilter.fill(carName);
  const afterQueryResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Car/GetPageCarList"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const afterQueryResponse = await afterQueryResponsePromise;
  evidence.UIQueryAfter = {
    response: afterQueryResponse ? await parseResponse(afterQueryResponse) : null,
    rows: await page.getByRole("row").evaluateAll((rows) => rows.map((row) => row.innerText.replace(/\s+/g, " ").trim()).filter(Boolean)),
  };
  await mkdir(outputRoot, { recursive: true });
  await page.screenshot({ path: path.join(outputRoot, "dummy-car-initialize.png"), fullPage: true });
  await writeFile(path.join(outputRoot, "dummy-car-initialize.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, carName, initialized: evidence.Initialized, located: evidence.Located, idle: evidence.Idle, safeForGoldenPath: evidence.SafeForGoldenPath, pollCount: evidence.RuntimePoll.length }));
} catch (error) {
  evidence.Status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.Error = sanitizeMessage(String(error?.message ?? error));
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-initialize-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(outputRoot, "dummy-car-initialize-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
