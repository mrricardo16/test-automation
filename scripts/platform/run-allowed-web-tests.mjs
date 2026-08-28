import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const runRoot = path.join(root, "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02");
const config = JSON.parse(await readFile(path.join(root, "projects/rsscomposer-blackbox/config/project.local.json"), "utf8"));
const environment = {
  ...process.env,
  FORCE_COLOR: "0",
  NO_COLOR: "1",
  WEB_TEST_BASE_URL: config.runtimeBaseUrl,
  WEB_TEST_USERNAME: config.authentication.admin.username,
  WEB_TEST_PASSWORD: config.authentication.admin.password,
  WEB_TEST_RUN_SUFFIX: process.env.WEB_TEST_RUN_SUFFIX ?? `20260827_03_${Date.now()}`,
  WEB_EVIDENCE_ROOT: path.join(runRoot, "artifacts/web"),
};
const args = ["playwright", "test", "tests/web/real-project/TC_ALLOWED_WEB_20260827_03.spec.ts", "--workers=1", "--retries=0", "--reporter=json"];
if (process.env.ALLOWED_WEB_GREP) args.push("--grep", process.env.ALLOWED_WEB_GREP);
const command = process.platform === "win32" ? "cmd.exe" : "npx";
const quoteCmdArg = (value) => {
  const text = String(value);
  return /[\s|&<>]/.test(text) ? `"${text.replaceAll('"', '\\"')}"` : text;
};
const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", `npx ${args.map(quoteCmdArg).join(" ")}`] : args;
const child = spawn(command, commandArgs, { cwd: root, env: environment, stdio: ["ignore", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
const exitCode = await new Promise((resolve) => child.on("close", resolve));
await mkdir(path.join(runRoot, "artifacts/web"), { recursive: true });
await writeFile(path.join(runRoot, "artifacts/web/TC_ALLOWED_WEB_20260827_03-playwright.json"), stdout, "utf8");
await writeFile(path.join(runRoot, "artifacts/web/TC_ALLOWED_WEB_20260827_03-playwright.log"), stderr, "utf8");
console.log(JSON.stringify({ exitCode, ResultArtifact: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/web/TC_ALLOWED_WEB_20260827_03-playwright.json", EvidenceRoot: "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-02/artifacts/web" }));
process.exitCode = exitCode ?? 1;
