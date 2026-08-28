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
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");

const evidence = { RunId: runId, MapCode: mapCode, CarName: carName, Status: "BLOCKED", ProvisionMethod: "FORMAL_WEB_UI_SESSION_TO_PUBLIC_ADD_CAR_API", CleanupRequired: true };
const sanitizeMessage = (value) => typeof value === "string" ? value.replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 240) : null;
const safeData = (value) => {
  if (!value || typeof value !== "object") return value ?? null;
  if (Array.isArray(value)) return value.map((item) => item && typeof item === "object" ? Object.fromEntries(Object.entries(item).filter(([key]) => !/token|password|authorization|secret|cookie/i.test(key))) : item);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !/token|password|authorization|secret|cookie/i.test(key)));
};
const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  return { httpStatus: response.status(), statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, message: sanitizeMessage(body?.message), data: safeData(body?.data) };
};
const safeCar = (car) => ({ carid: car?.carid ?? car?.carId ?? null, carName: car?.carName ?? car?.name ?? null, carType: car?.carType ?? null, carState: car?.carState ?? car?.status ?? null, siteid: car?.siteid ?? car?.siteID ?? null, taskCode: car?.taskCode ?? null, taskState: car?.taskState ?? null, isException: car?.isException ?? null, isCharge: car?.isCharge ?? null, isRunning: car?.isRunning ?? null, manual: car?.manual ?? null, haveCoordination: car?.haveCoordination ?? null });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
try {
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const loginResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: "录" }).click();
  evidence.Login = await parseResponse(await loginResponsePromise);
  await page.waitForURL("**/#/dashboard", { timeout: 30_000 });
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "车辆管理", exact: true }).click();
  await page.waitForURL("**/#/Sys/VehicleManage", { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });

  const officialRequestPromise = page.waitForRequest((request) => request.url().includes("/IsCurrentMapOfficial"), { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const officialRequest = await officialRequestPromise;
  const officialResponse = await officialRequest.response();
  const official = officialResponse ? await parseResponse(officialResponse) : null;
  evidence.ActiveMapObservation = official;
  const authHeaders = Object.fromEntries(Object.entries(officialRequest.headers()).filter(([key]) => /^(authorization|token)$/i.test(key)));
  const apiOrigin = new URL(officialRequest.url()).origin;
  const requestApi = async (method, apiPath, body) => {
    const response = await page.request.fetch(`${apiOrigin}${apiPath}`, { method, headers: { ...authHeaders, ...(body ? { "content-type": "application/json" } : {}) }, data: body ? JSON.stringify(body) : undefined });
    return await parseResponse(response);
  };
  const drawer = page.getByRole("dialog").last();
  if (await drawer.isVisible().catch(() => false)) {
    const close = drawer.getByRole("button", { name: /取\s*消|关闭/ });
    if (await close.count()) await close.first().click();
  }
  const typeResponse = await requestApi("GET", "/api/Car/GetPageCarClassName");
  const typeOptions = (Array.isArray(typeResponse.data) ? typeResponse.data : []).map((item) => ({ label: item?.label ?? null, value: item?.value ?? item?.codeName ?? null, codeName: item?.codeName ?? null, typeName: item?.typeName ?? null, carClass: item?.carClass ?? null, carSubClass: item?.carSubClass ?? null }));
  evidence.CarTypeQuery = { httpStatus: typeResponse.httpStatus, statusCode: typeResponse.statusCode, isSuccess: typeResponse.isSuccess, message: typeResponse.message, options: typeOptions };
  const dummyType = typeOptions.find((item) => Number(item.carClass) === 1 && /模拟|dummy|simulated/i.test(`${item.label} ${item.value} ${item.typeName}`));
  if (!dummyType) throw new Error("BLOCKED: no explicit DummyCar option returned by the live vehicle-type API");
  evidence.SelectedDummyType = dummyType;

  const currentCars = await requestApi("GET", `/api/Car/GetAllCarList?mapCode=${encodeURIComponent(mapCode)}`);
  const currentCarRows = Array.isArray(currentCars.data) ? currentCars.data : currentCars.data?.DataSource ?? [];
  const existingCar = currentCarRows.find((item) => String(item?.cn_s_name ?? "").trim() === carName);
  const usedIds = new Set(currentCarRows.map((item) => Number(item?.cn_n_carid)).filter(Number.isFinite));
  const chosenId = Number(existingCar?.cn_n_carid) || Array.from({ length: 100 }, (_, index) => 1901 + index).find((candidate) => !usedIds.has(candidate));
  if (!chosenId) throw new Error("BLOCKED: no unused test DummyCar id in the approved range");
  evidence.CarId = chosenId;
  const payload = {
    cn_n_carid: chosenId,
    cn_s_map_code: mapCode,
    cn_s_name: carName,
    cn_s_code_name: dummyType.value,
    cn_n_type: 0,
    cn_n_speed: 1000,
    cn_d_capacity: 0,
    cn_d_voltage: 0,
    cn_s_address: "127.0.0.1",
    cn_s_state: "离线",
    cn_s_layer_name: "g",
    cn_s_fileds: "{}",
    cn_n_carClass: Number(dummyType.carClass),
    cn_n_carSubClass: Number(dummyType.carSubClass),
    cn_s_envelopSetting: JSON.stringify({ lengthX: 2300, lengthY: 1200, centerX: -600, centerY: 0 }),
    cn_s_envelopSettingLoad: JSON.stringify({ lengthX: 2300, lengthY: 1200, centerX: -600, centerY: 0 }),
    cn_s_carSetting: JSON.stringify({ wheelbase: 1440, car_length: 1050, car_width: 1100, car_forklen: 680, car_forkwidth: 185, car_forkhead: 470, anchorX: 0, anchorY: 0 }),
    cn_n_site_id: -1,
    cn_f_th: 0,
    cn_s_logo: "",
    cn_b_have_coordination: false,
  };
  if (existingCar) {
    evidence.Preexisting = true;
    evidence.ExistingCar = safeCar(existingCar);
  } else {
    evidence.Request = { method: "POST", path: `/api/Car/AddCar?mapCode=${mapCode}`, payload };
    evidence.AddResponse = await requestApi("POST", `/api/Car/AddCar?mapCode=${encodeURIComponent(mapCode)}`, payload);
    if (evidence.AddResponse.isSuccess !== true || evidence.AddResponse.httpStatus >= 400) throw new Error(`BLOCKED: AddCar rejected: ${evidence.AddResponse.message ?? "backend rejected the request"}`);
    evidence.Created = true;
  }
  const refreshResponsePromise = page.waitForResponse((response) => response.url().includes("/ctrl/RefreshMap"), { timeout: 60_000 }).catch(() => null);
  await page.getByRole("button", { name: "刷新地图", exact: true }).click();
  const refreshDialog = page.getByRole("dialog").last();
  await refreshDialog.getByRole("button", { name: "确定", exact: true }).click();
  const refreshResponse = await refreshResponsePromise;
  evidence.RefreshMapResponse = refreshResponse ? await parseResponse(refreshResponse) : null;
  const allCarRequestPromise = page.waitForRequest((request) => request.url().includes("/info/GetAllCar"), { timeout: 30_000 }).catch(() => null);
  await page.reload({ waitUntil: "domcontentloaded" });
  const allCarRequest = await allCarRequestPromise;
  const runtimeAuthHeaders = allCarRequest ? Object.fromEntries(Object.entries(allCarRequest.headers()).filter(([key]) => /^(authorization|token)$/i.test(key))) : authHeaders;
  const runtimeApiOrigin = allCarRequest ? new URL(allCarRequest.url()).origin : apiOrigin;
  const runtimeInfoResponse = await page.request.fetch(`${runtimeApiOrigin}/api/info/GetCarInfo?carid=${chosenId}`, { method: "GET", headers: runtimeAuthHeaders });
  const runtimeInfoBody = await runtimeInfoResponse.json().catch(() => ({}));
  const infoResponse = { httpStatus: runtimeInfoResponse.status(), statusCode: runtimeInfoBody?.statusCode ?? runtimeInfoBody?.code ?? null, isSuccess: runtimeInfoBody?.isSuccess ?? null, message: sanitizeMessage(runtimeInfoBody?.message), data: runtimeInfoBody?.data ?? null };
  evidence.GetCarInfo = { httpStatus: infoResponse.httpStatus, statusCode: infoResponse.statusCode, isSuccess: infoResponse.isSuccess, message: infoResponse.message, data: infoResponse.isSuccess ? safeCar(infoResponse.data) : null };
  const vehicleNameFilter = page.locator(".VehicleManage .el-form-item").filter({ hasText: "车辆名称" }).first().locator("input");
  await vehicleNameFilter.fill(carName);
  const queryResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Car/GetPageCarList"), { timeout: 30_000 }).catch(() => null);
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  const queryResponse = await queryResponsePromise;
  evidence.UIQuery = { response: queryResponse ? await parseResponse(queryResponse) : null, rows: await page.getByRole("row").evaluateAll((rows) => rows.map((row) => ({ text: row.innerText.replace(/\s+/g, " ").trim(), cells: Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.replace(/\s+/g, " ").trim()) })).filter((row) => row.text)) };
  evidence.SimulationIdentityConfirmed = Number(dummyType.carClass) === 1;
  evidence.Initialized = evidence.GetCarInfo.isSuccess === true && evidence.GetCarInfo.data?.siteid !== -1;
  evidence.Located = evidence.Initialized;
  evidence.Idle = !evidence.GetCarInfo.data?.taskCode && evidence.GetCarInfo.data?.isRunning !== 1;
  evidence.Maintenance = false;
  evidence.Charging = evidence.GetCarInfo.data?.isCharge === 1;
  evidence.BoundToCurrentMap = true;
  evidence.SafeForGoldenPath = evidence.SimulationIdentityConfirmed && evidence.GetCarInfo.isSuccess === true && evidence.Initialized && evidence.GetCarInfo.data?.isException !== 1 && evidence.Idle && !evidence.Maintenance && !evidence.Charging && evidence.BoundToCurrentMap;
  evidence.Status = evidence.GetCarInfo.isSuccess === true && evidence.SafeForGoldenPath ? "PASS" : "BLOCKED";
  await mkdir(outputRoot, { recursive: true });
  await page.screenshot({ path: path.join(outputRoot, "dummy-car-created-live-api.png"), fullPage: true });
  await writeFile(path.join(outputRoot, "dummy-car-live-api-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, carId: chosenId, carName, selectedDummyType: dummyType.value, initialized: evidence.Initialized, safeForGoldenPath: evidence.SafeForGoldenPath }));
} catch (error) {
  evidence.Status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.Error = sanitizeMessage(String(error?.message ?? error));
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-live-api-provisioning-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(outputRoot, "dummy-car-live-api-provisioning-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
