import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const carName = process.env.TEST_DUMMY_CAR_NAME ?? "AT_0827_02_DUMMY";
const carId = Number(process.env.TEST_DUMMY_CAR_ID ?? "1901");
const outputRoot = path.resolve(process.env.DUMMY_CAR_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car`);
if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");

const evidence = { RunId: runId, MapCode: mapCode, CarName: carName, CarId: carId, Status: "BLOCKED", Scope: "EXACT_TEST_OWNED_DUMMY_CAR_ONLY" };
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
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "新增", exact: true }).waitFor({ state: "visible", timeout: 30_000 });
  const officialRequestPromise = page.waitForRequest((request) => request.url().includes("/IsCurrentMapOfficial"), { timeout: 30_000 });
  await page.getByRole("button", { name: "新增", exact: true }).click();
  const officialRequest = await officialRequestPromise;
  const officialResponse = await officialRequest.response();
  evidence.ActiveMapObservation = officialResponse ? await parseResponse(officialResponse) : null;
  const authHeaders = Object.fromEntries(Object.entries(officialRequest.headers()).filter(([key]) => /^(authorization|token)$/i.test(key)));
  const apiOrigin = new URL(officialRequest.url()).origin;
  const drawer = page.getByRole("dialog").last();
  if (await drawer.isVisible().catch(() => false)) {
    const close = drawer.getByRole("button", { name: /取\s*消|关闭/ });
    if (await close.count()) await close.first().click();
  }
  const requestApi = async (method, apiPath, body) => {
    const response = await page.request.fetch(`${apiOrigin}${apiPath}`, { method, headers: { ...authHeaders, ...(body ? { "content-type": "application/json" } : {}) }, data: body ? JSON.stringify(body) : undefined });
    return parseResponse(response);
  };
  const before = await requestApi("GET", `/api/Car/GetAllCarList?mapCode=${encodeURIComponent(mapCode)}`);
  const rowsBefore = Array.isArray(before.data) ? before.data : before.data?.DataSource ?? [];
  const matches = rowsBefore.filter((row) => Number(row?.cn_n_carid) === carId && String(row?.cn_s_name ?? "").trim() === carName && String(row?.cn_s_map_code ?? "") === mapCode);
  evidence.Before = { response: { httpStatus: before.httpStatus, statusCode: before.statusCode, isSuccess: before.isSuccess, message: before.message }, exactMatchCount: matches.length, rowCount: rowsBefore.length };
  if (matches.length !== 1) throw new Error(`BLOCKED: exact TEST_OWNED DummyCar target was not uniquely verified (matches=${matches.length})`);
  evidence.DeleteRequest = { method: "POST", path: `/api/Car/DeleteCar?mapCode=${mapCode}`, target: [carId] };
  evidence.DeleteResponse = await requestApi("POST", `/api/Car/DeleteCar?mapCode=${encodeURIComponent(mapCode)}`, [String(carId)]);
  if (evidence.DeleteResponse.isSuccess !== true) throw new Error(`BLOCKED: exact DummyCar cleanup rejected: ${evidence.DeleteResponse.message ?? "unknown response"}`);
  const after = await requestApi("GET", `/api/Car/GetAllCarList?mapCode=${encodeURIComponent(mapCode)}`);
  const rowsAfter = Array.isArray(after.data) ? after.data : after.data?.DataSource ?? [];
  evidence.After = { response: { httpStatus: after.httpStatus, statusCode: after.statusCode, isSuccess: after.isSuccess, message: after.message }, exactTargetRemaining: rowsAfter.some((row) => Number(row?.cn_n_carid) === carId && String(row?.cn_s_name ?? "").trim() === carName && String(row?.cn_s_map_code ?? "") === mapCode), rowCount: rowsAfter.length };
  evidence.CleanupResidualCount = evidence.After.exactTargetRemaining ? 1 : 0;
  evidence.Status = evidence.CleanupResidualCount === 0 ? "PASS" : "BLOCKED";
  evidence.CleanupStatus = evidence.Status;
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-cleanup.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, carName, carId, residualCount: evidence.CleanupResidualCount }));
} catch (error) {
  evidence.Status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.Error = sanitizeMessage(String(error?.message ?? error));
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-cleanup-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  throw error;
} finally {
  await browser.close();
}
