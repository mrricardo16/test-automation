import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223").replace(/\/$/, "");
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const mapPath = process.env.TEST_MAP_PATH ?? "E:/新建文件夹/上海浦东0820-1.json";
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const mapName = process.env.TEST_MAP_NAME ?? "AT_0827_02_MAP";
const evidenceRoot = path.resolve(process.env.MAP_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/map`);

if (!username || !password) throw new Error("BLOCKED: administrator credentials are missing");
const sourceBytes = await readFile(mapPath);
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
const sourceFile = { fileName: path.basename(mapPath), size: sourceBytes.length, sha256: sourceHash };
const responseSummary = async (response) => {
  const body = await response.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message.replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 240) : null;
  return { httpStatus: response.status(), statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, message };
};

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const evidence = { runId, sourceFile, mapCode, mapName, preexisting: false, created: false, uploaded: false, activeVerified: false, responses: {}, screenshots: [] };

async function login() {
  await page.goto(`${baseUrl}/#/login?redirect=/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("用户名").fill(username);
  await page.getByPlaceholder("用户密码").fill(password);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Account/Login"), { timeout: 30_000 });
  await page.getByRole("button").filter({ hasText: "录" }).click();
  evidence.responses.login = await responseSummary(await responsePromise);
  await page.waitForURL("**/#/dashboard", { timeout: 30_000 });
}

async function openDrawingTool() {
  const scene = page.getByRole("menuitem", { name: "场景管理", exact: true }).first();
  if ((await scene.getAttribute("aria-expanded")) !== "true") await scene.click();
  await page.getByRole("link", { name: "画图工具", exact: true }).click();
  await page.getByRole("button").filter({ hasText: "加载(本地)" }).waitFor({ state: "visible", timeout: 30_000 });
  await page.getByText("正在加载地图...").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => undefined);
}

async function searchMapInLibrary() {
  await page.getByRole("button").filter({ hasText: "加载(库)" }).click();
  const dialog = page.getByRole("dialog").last();
  const search = dialog.getByRole("textbox");
  await search.fill(mapCode);
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Map/GetPageMapList"), { timeout: 30_000 }).catch(() => null);
  await dialog.getByRole("button", { name: "搜索", exact: true }).click();
  const response = await responsePromise;
  if (response) evidence.responses.mapList = await responseSummary(response);
  const rows = dialog.getByRole("row").filter({ hasText: mapCode });
  return { dialog, rows, count: await rows.count() };
}

await mkdir(evidenceRoot, { recursive: true });
try {
  await login();
  await openDrawingTool();
  const existing = await searchMapInLibrary();
  if (existing.count > 1) throw new Error(`ERROR_TEST_DATA_SETUP: multiple exact TEST_OWNED map rows found for ${mapCode}`);
  if (existing.count === 1) {
    evidence.preexisting = true;
    await existing.dialog.getByRole("button", { name: "取消", exact: true }).click();
  } else {
    await existing.dialog.getByRole("button", { name: "取消", exact: true }).click();
    await page.getByRole("button").filter({ hasText: "新建" }).click();
    const createDialog = page.getByRole("dialog").last();
    await createDialog.getByPlaceholder("请输入地图编号").fill(mapCode);
    await createDialog.getByPlaceholder("请输入地图名称").fill(mapName);
    const mapStatus = createDialog.locator(".el-select");
    await mapStatus.click();
    await page.getByRole("option", { name: "草稿", exact: true }).click();
    const createResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Map/AddMap"), { timeout: 30_000 });
    await createDialog.getByRole("button", { name: "创建", exact: true }).click();
    evidence.responses.createMap = await responseSummary(await createResponsePromise);
    if (evidence.responses.createMap.isSuccess === false || evidence.responses.createMap.httpStatus >= 400) throw new Error("BLOCKED: map metadata creation was rejected");
    evidence.created = true;
  }

  await page.locator("input[type=file]").first().setInputFiles(mapPath);
  await page.getByText("正在加载地图...").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => undefined);
  const uploadResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/Map/SaveMapData"), { timeout: 60_000 });
  await page.getByRole("button").filter({ hasText: "上传" }).last().click();
  const uploadDialog = page.getByRole("dialog").last();
  await uploadDialog.getByRole("button", { name: "确定", exact: true }).click();
  evidence.responses.uploadMap = await responseSummary(await uploadResponsePromise);
  if (evidence.responses.uploadMap.isSuccess === false || evidence.responses.uploadMap.httpStatus >= 400) throw new Error("BLOCKED: map upload was rejected");
  evidence.uploaded = true;
  const uploadShot = path.join(evidenceRoot, "map-upload-success.png");
  await page.screenshot({ path: uploadShot, fullPage: true });
  evidence.screenshots.push(uploadShot);

  const verified = await searchMapInLibrary();
  if (verified.count !== 1) throw new Error(`ERROR: expected one map row after upload, found ${verified.count}`);
  evidence.mapListVerified = true;
  await verified.rows.first().click();
  const loadResponsePromise = page.waitForResponse((response) => response.request().method() === "GET" && response.url().includes("/Map/GetMapByMapCode"), { timeout: 60_000 }).catch(() => null);
  await verified.dialog.getByRole("button", { name: "确定", exact: true }).click();
  const loadResponse = await loadResponsePromise;
  if (loadResponse) evidence.responses.loadMap = await responseSummary(loadResponse);
  await page.getByText("正在加载地图...").waitFor({ state: "hidden", timeout: 120_000 }).catch(() => undefined);
  const activeMeta = await page.evaluate(() => ({ mapCode: sessionStorage.getItem("draw.currentMapCode"), mapName: sessionStorage.getItem("draw.currentMapName"), mapStatus: sessionStorage.getItem("draw.currentMapStatus") }));
  evidence.activeMap = activeMeta;
  evidence.activeVerified = activeMeta.mapCode === mapCode;
  if (!evidence.activeVerified) throw new Error(`ERROR: active map session code mismatch`);
  const activeShot = path.join(evidenceRoot, "active-map-verified.png");
  await page.screenshot({ path: activeShot, fullPage: true });
  evidence.screenshots.push(activeShot);
  await writeFile(path.join(evidenceRoot, "map-provisioning-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: "PASS", mapCode, mapName, preexisting: evidence.preexisting, created: evidence.created, uploaded: evidence.uploaded, mapListVerified: evidence.mapListVerified, activeVerified: evidence.activeVerified, sourceSize: sourceFile.size, sourceSha256: sourceFile.sha256 }));
} catch (error) {
  evidence.status = String(error?.message ?? error).startsWith("BLOCKED:") ? "BLOCKED" : "ERROR";
  evidence.error = String(error?.message ?? error).replace(/(token|password|authorization|secret)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED").slice(0, 500);
  await writeFile(path.join(evidenceRoot, "provisioning-error.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  if (!page.isClosed()) await page.screenshot({ path: path.join(evidenceRoot, "provisioning-error.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  await browser.close();
}
