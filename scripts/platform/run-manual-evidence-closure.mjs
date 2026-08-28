import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const runId = "REMAINING-CLOSURE-20260828-01";
const runRoot = path.join(projectRoot, "runs", runId);
const config = JSON.parse(await readFile(path.join(projectRoot, "config", "project.local.json"), "utf8"));
const manualIds = JSON.parse(await readFile(path.join(projectRoot, "runs", "FULL-138-UNFINISHED-REGRESSION-20260828-01", "manual-review-case-ids.json"), "utf8")).TestCaseIds;
const targetIds = new Set(manualIds);
const evidenceRoot = path.join(runRoot, "artifacts", "web-manual");
await mkdir(evidenceRoot, { recursive: true });
const environment = {
  ...process.env,
  FORCE_COLOR: "0",
  NO_COLOR: "1",
  WEB_TEST_BASE_URL: config.runtimeBaseUrl,
  WEB_TEST_USERNAME: config.authentication.admin.username,
  WEB_TEST_PASSWORD: config.authentication.admin.password,
  WEB_TEST_RUN_SUFFIX: "MANUALEVIDENCE20260828",
  WEB_EVIDENCE_ROOT: evidenceRoot,
};
const args = ["playwright", "test", "tests/web/real-project/TC_MANUAL_EVIDENCE_CLOSURE_20260828_01.spec.ts", "--workers=1", "--retries=0", "--reporter=json"];
const child = spawn(process.platform === "win32" ? "cmd.exe" : "npx", process.platform === "win32" ? ["/d", "/s", "/c", `npx ${args.join(" ")}`] : args, { cwd: root, env: environment, stdio: ["ignore", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
const exitCode = await new Promise((resolve) => child.on("close", resolve));
await writeFile(path.join(runRoot, "manual-review-playwright.json"), stdout, "utf8");
await writeFile(path.join(runRoot, "manual-review-playwright.log"), stderr, "utf8");
let report;
try { report = JSON.parse(stdout); } catch { report = undefined; }
const rows = [];
const casePattern = /TC-[A-Z0-9]{2,10}-[A-Z0-9-]+/;
const visit = (suite) => {
  for (const spec of suite?.specs ?? []) {
    const id = spec.title?.match(casePattern)?.[0];
    if (!id || !targetIds.has(id)) continue;
    const result = spec.tests?.[0]?.results?.at(-1);
    const raw = result?.status ?? "not-run";
    const status = raw === "passed" ? "PASS" : raw === "skipped" ? "SKIPPED" : "ERROR";
    const errors = (result?.errors ?? []).map((item) => item.message ?? "").filter(Boolean);
    rows.push({ TestCaseId: id, ExecutionStatus: status, PlaywrightStatus: raw, DurationMs: result?.duration ?? null, AutomatableObservation: status, EvidencePaths: [], ErrorMessages: errors });
  }
  for (const childSuite of suite?.suites ?? []) visit(childSuite);
};
for (const suite of report?.suites ?? []) visit(suite);
const evidenceFiles = await readdir(evidenceRoot, { recursive: true });
for (const row of rows) row.EvidencePaths = evidenceFiles.filter((file) => file.startsWith(`${row.TestCaseId}${path.sep}`) && /\.(png|jpg|jpeg)$/i.test(file)).map((file) => path.relative(root, path.join(evidenceRoot, file)).replaceAll(path.sep, "/"));
const result = { RunId: runId, ManualCaseIds: manualIds, Rows: [...new Map(rows.map((row) => [row.TestCaseId, row])).values()], Counts: Object.fromEntries(["PASS", "ERROR", "SKIPPED"].map((status) => [status, rows.filter((row) => row.ExecutionStatus === status).length])), ExitCode: exitCode };
await writeFile(path.join(runRoot, "manual-review-execution-result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ RunId: runId, ExitCode: exitCode, TargetCount: targetIds.size, RowCount: result.Rows.length, Counts: result.Counts }));
process.exitCode = exitCode ?? 1;
