import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const runId = "FULL-138-UNFINISHED-REGRESSION-20260828-01";
const runRoot = path.join(projectRoot, "runs", runId);
const config = JSON.parse(await readFile(path.join(projectRoot, "config", "project.local.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(runRoot, "full-138-unfinished-regression-manifest.json"), "utf8"));
const targetIds = new Set(manifest.TargetCaseIds ?? []);
const forbidden = ["TC-USER-CREATE-001", "TC-USER-CREATE-002", "TC-USER-CREATE-003", "TC-USER-CREATE-004", "TC-USER-CREATE-005", "TC-VEH-STATE-001"];
if (forbidden.some((id) => targetIds.has(id))) throw new Error("Target manifest contains a no-rerun case");
const evidenceRoot = path.join(runRoot, "artifacts", "web");
await mkdir(evidenceRoot, { recursive: true });
let mock = null;
let mockOwned = false;
const mockHealthUrl = "http://127.0.0.1:8230/health";
const mockAlreadyReady = await fetch(mockHealthUrl).then((response) => response.ok).catch(() => false);
if (!mockAlreadyReady) {
  mock = spawn(process.execPath, [path.join(root, "scripts", "platform", "local-mock-harness.mjs"), "--port", "8230"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  mockOwned = true;
  await new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(async () => {
      const ready = await fetch(mockHealthUrl).then((response) => response.ok).catch(() => false);
      if (ready) { clearInterval(timer); resolve(); }
      else if (Date.now() - started > 10_000) { clearInterval(timer); reject(new Error("LOCAL_MOCK_START_TIMEOUT")); }
    }, 100);
  });
}
const environment = {
  ...process.env,
  FORCE_COLOR: "0",
  NO_COLOR: "1",
  WEB_TEST_BASE_URL: config.runtimeBaseUrl,
  WEB_TEST_USERNAME: config.authentication.admin.username,
  WEB_TEST_PASSWORD: config.authentication.admin.password,
  WEB_TEST_RUN_SUFFIX: "FULL138_20260828_01",
  WEB_EVIDENCE_ROOT: evidenceRoot,
  LOCAL_MOCK_URL: "127.0.0.1:8230",
};
const targetGrep = process.env.FULL_TARGET_GREP;
const targetGrepInvert = process.env.FULL_TARGET_GREP_INVERT;
const args = ["playwright", "test", "tests/web/real-project/TC_FULL_138_UNFINISHED_20260828_01.spec.ts", "--workers=1", "--retries=0", "--reporter=json"];
if (targetGrep) args.push("--grep", targetGrep);
if (targetGrepInvert) args.push("--grep-invert", targetGrepInvert);
const windowsArgs = args;
const child = spawn(process.platform === "win32" ? "cmd.exe" : "npx", process.platform === "win32" ? ["/d", "/s", "/c", `npx ${windowsArgs.join(" ")}`] : args, { cwd: root, env: environment, stdio: ["ignore", "pipe", "pipe"] });
let stdout = ""; let stderr = "";
child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
const exitCode = await new Promise((resolve) => child.on("close", resolve));
if (mockOwned && mock) mock.kill("SIGTERM");
await writeFile(path.join(evidenceRoot, "full-138-target-playwright.json"), stdout, "utf8");
await writeFile(path.join(evidenceRoot, "full-138-target-playwright.log"), stderr, "utf8");
let playwrightReport;
try {
  playwrightReport = JSON.parse(stdout);
} catch {
  playwrightReport = undefined;
}
const rows = [];
const casePattern = /TC-[A-Z0-9]{2,10}-[A-Z0-9-]+/;
const visitSuite = (suite) => {
  for (const spec of suite?.specs ?? []) {
    const testCaseId = spec.title?.match(casePattern)?.[0];
    if (!testCaseId || !targetIds.has(testCaseId)) continue;
    const result = spec.tests?.[0]?.results?.at(-1);
    const rawStatus = result?.status ?? "not-run";
    const status = rawStatus === "passed" ? "PASS" : rawStatus === "skipped" ? "SKIPPED" : "ERROR";
    const errors = (result?.errors ?? []).map((item) => item.message ?? "").filter(Boolean);
    rows.push({
      TestCaseId: testCaseId,
      Status: status,
      PlaywrightStatus: rawStatus,
      DurationMs: result?.duration ?? null,
      ActualVerification: status === "PASS" ? "Real Playwright UI execution completed." : errors.join("\n").slice(0, 4000),
      EvidencePaths: [],
      ErrorMessages: errors,
    });
  }
  for (const child of suite?.suites ?? []) visitSuite(child);
};
for (const suite of playwrightReport?.suites ?? []) visitSuite(suite);
const uniqueRows = [...new Map(rows.map((row) => [row.TestCaseId, row])).values()];
const previousTargetResult = targetGrep ? await readFile(path.join(runRoot, "full-138-target-results.json"), "utf8").then((value) => JSON.parse(value)).catch(() => ({ Rows: [] })) : { Rows: [] };
const mergedRows = [...new Map([
  ...(previousTargetResult.Rows ?? []).filter((row) => !uniqueRows.some((current) => current.TestCaseId === row.TestCaseId)),
  ...uniqueRows,
].map((row) => [row.TestCaseId, row])).values()];
const targetResult = {
  RunId: runId,
  Source: "Playwright JSON reporter plus TEST_OWNED evidence directories",
  TargetCaseIds: [...targetIds],
  Rows: mergedRows,
  Counts: Object.fromEntries(["PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "SKIPPED"].map((status) => [status, mergedRows.filter((row) => row.Status === status).length])),
  ExitCode: exitCode,
};
await writeFile(path.join(runRoot, "full-138-target-results.json"), `${JSON.stringify(targetResult, null, 2)}\n`, "utf8");
process.stdout.write(JSON.stringify({ RunId: runId, ExitCode: exitCode, TargetManifestCount: targetIds.size, TargetIds: [...targetIds], ResultArtifact: "projects/rsscomposer-blackbox/runs/FULL-138-UNFINISHED-REGRESSION-20260828-01/artifacts/web/full-138-target-playwright.json" }, null, 2) + "\n");
process.exitCode = exitCode ?? 1;
