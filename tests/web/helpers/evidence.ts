import { expect, test as base, type Locator, type Page, type Request, type TestInfo } from "@playwright/test";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CONSOLE_LIMIT = 300;
const NETWORK_LIMIT = 500;
const EVIDENCE_ROOT = path.resolve(process.env.WEB_EVIDENCE_ROOT ?? "projects/test-workflow/artifacts/web");

export type EvidenceFailureType =
  | "ERROR_LOCATOR"
  | "ERROR_TIMEOUT"
  | "ERROR_NAVIGATION"
  | "ERROR_PLAYWRIGHT"
  | "ERROR_BROWSER"
  | "ERROR_ASSERTION_INFRASTRUCTURE"
  | "FAIL_UI_NAVIGATION"
  | "FAIL_BUSINESS_ASSERTION"
  | "BLOCKED";

export type LocatorContextInput = {
  locatorDescription: string;
  primaryLocator: string;
  fallbackLocator: string;
  expectedState: string;
  locator: Locator;
};

export type EvidenceCaptureResult = {
  caseStatus: "FAIL" | "ERROR" | "BLOCKED" | "PASS" | "SKIPPED";
  runDirectory?: string;
  screenshotStatus: "PASS" | "PASS_FALLBACK" | "ERROR" | "SKIPPED_SENSITIVE" | "UNAVAILABLE";
  tracePath?: string;
};

export type EvidenceContext = {
  step(name: string): void;
  setFailureType(type: EvidenceFailureType): void;
  setLocatorContext(context: LocatorContextInput): void;
  markBlocked(reason: string): void;
  captureCheckpoint(name: string): Promise<string | undefined>;
  captureFailureEvidence(): Promise<EvidenceCaptureResult>;
};

type ConsoleRecord = { type: string; text: string; timestamp: string };
type PageErrorRecord = { message: string; stack?: string; timestamp: string };
type NetworkRecord = {
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
  resourceType: string;
  failureText?: string;
  severity?: "warning" | "error";
  timestamp: string;
};

type LocatorContext = LocatorContextInput & { currentUrl: string };

function pushCapped<T>(items: T[], item: T, limit: number): void {
  items.push(item);
  if (items.length > limit) {
    items.splice(0, items.length - limit);
  }
}

function redactText(value: string | undefined): string | undefined {
  if (!value) return value;
  return value
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer REDACTED")
    .replace(/\b(authorization|cookie|set-cookie|token|access_token|password|pwd|secret|credential)\s*[:=]\s*[^\s,;]+/gi, "$1=REDACTED")
    .replace(/\s+/g, " ")
    .slice(0, 500);
}

function sanitizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return `${parsed.origin}${parsed.pathname}`;
    }
    return parsed.protocol;
  } catch {
    return redactText(rawUrl) ?? "";
  }
}

function sanitizeNetworkPath(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname;
  } catch {
    return sanitizeUrl(rawUrl);
  }
}

function createRunId(testInfo: TestInfo): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").replace("T", "-");
  return `${now}-pid${process.pid}-w${testInfo.workerIndex}-r${testInfo.retry}`;
}

function testCaseId(testInfo: TestInfo): string {
  return testInfo.title.match(/(?:TC-[A-Z0-9]{2,10}-[A-Z0-9-]+|INFRASTRUCTURE_SELF_TEST)/)?.[0] ?? "WEB-UNCLASSIFIED";
}

function toCaseStatus(status: string, blocked: boolean, failureType?: EvidenceFailureType): EvidenceCaptureResult["caseStatus"] {
  if (blocked) return "BLOCKED";
  if (status === "passed") return "PASS";
  if (status === "skipped") return "SKIPPED";
  return failureType?.startsWith("FAIL_") ? "FAIL" : "ERROR";
}

function inferFailureType(errorMessage: string | undefined): EvidenceFailureType {
  if (/timeout/i.test(errorMessage ?? "")) return "ERROR_TIMEOUT";
  return "ERROR_PLAYWRIGHT";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function pageHasUnsafeSensitiveInput(page: Page): Promise<boolean> {
  if (page.isClosed()) return false;
  try {
    return await page.locator("input, textarea").evaluateAll((elements) =>
      elements.some((element) => {
        const input = element as HTMLInputElement | HTMLTextAreaElement;
        const metadata = [input.name, input.id, input.autocomplete, input.placeholder].join(" ");
        return /password|pwd|token|secret|credential|authorization|cookie/i.test(metadata) && input.type !== "password";
      }),
    );
  } catch {
    return false;
  }
}

async function captureScreenshot(page: Page, filePath: string): Promise<EvidenceCaptureResult["screenshotStatus"]> {
  if (page.isClosed()) return "UNAVAILABLE";
  if (await pageHasUnsafeSensitiveInput(page)) return "SKIPPED_SENSITIVE";
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    return "PASS";
  } catch {
    try {
      await page.screenshot({ path: filePath });
      return "PASS_FALLBACK";
    } catch {
      return "ERROR";
    }
  }
}

export const test = base.extend<{ evidence: EvidenceContext }>({
  evidence: async ({ page }, use, testInfo) => {
    const consoleRecords: ConsoleRecord[] = [];
    const pageErrors: PageErrorRecord[] = [];
    const networkErrors: NetworkRecord[] = [];
    const requestStartedAt = new WeakMap<Request, number>();
    const caseId = testCaseId(testInfo);
    const runDirectory = path.join(EVIDENCE_ROOT, caseId, createRunId(testInfo));
    let currentStep = "Not set";
    let failureType: EvidenceFailureType | undefined;
    let blockedReason: string | undefined;
    let locatorContext: LocatorContext | undefined;
    let finalized = false;

    page.on("request", (request) => requestStartedAt.set(request, Date.now()));
    page.on("console", (message) => {
      pushCapped(consoleRecords, { type: message.type(), text: redactText(message.text()) ?? "", timestamp: new Date().toISOString() }, CONSOLE_LIMIT);
    });
    page.on("pageerror", (error) => {
      pushCapped(pageErrors, { message: redactText(error.message) ?? "", stack: redactText(error.stack), timestamp: new Date().toISOString() }, CONSOLE_LIMIT);
    });
    page.on("requestfailed", (request) => {
      pushCapped(networkErrors, {
        method: request.method(), path: sanitizeNetworkPath(request.url()), resourceType: request.resourceType(),
        failureText: redactText(request.failure()?.errorText), timestamp: new Date().toISOString(),
      }, NETWORK_LIMIT);
    });
    page.on("response", (response) => {
      if (response.status() < 400) return;
      const request = response.request();
      const startedAt = requestStartedAt.get(request);
      pushCapped(networkErrors, {
        method: request.method(), path: sanitizeNetworkPath(response.url()), status: response.status(),
        durationMs: startedAt ? Date.now() - startedAt : undefined, resourceType: request.resourceType(),
        severity: response.status() >= 500 ? "error" : "warning", timestamp: new Date().toISOString(),
      }, NETWORK_LIMIT);
    });

    const ensureDirectory = async (): Promise<void> => mkdir(runDirectory, { recursive: true });
    const currentUrl = (): string => page.isClosed() ? "unavailable: page closed" : sanitizeUrl(page.url());
    const attach = async (name: string, filePath: string, contentType: string): Promise<void> => {
      if (await fileExists(filePath)) await testInfo.attach(name, { path: filePath, contentType });
    };
    const findTrace = async (): Promise<string | undefined> => {
      const attachment = testInfo.attachments.find((item) => item.name === "trace" && item.path)?.path;
      if (attachment && await fileExists(attachment)) return attachment;
      const outputTrace = path.join(testInfo.outputDir, "trace.zip");
      return await fileExists(outputTrace) ? outputTrace : undefined;
    };

    const captureFailureEvidence = async (): Promise<EvidenceCaptureResult> => {
      if (finalized) {
        return { caseStatus: toCaseStatus(testInfo.status, Boolean(blockedReason), failureType), runDirectory, screenshotStatus: "UNAVAILABLE" };
      }
      finalized = true;
      await ensureDirectory();
      const status = toCaseStatus(testInfo.status, Boolean(blockedReason), failureType);
      const resolvedFailureType = blockedReason ? "BLOCKED" : failureType ?? inferFailureType(testInfo.error?.message);
      const screenshotPath = path.join(runDirectory, "failure.png");
      const screenshotStatus = await captureScreenshot(page, screenshotPath);
      const url = currentUrl();
      const observedLocator = locatorContext ? {
        TestCaseId: caseId, CurrentStep: currentStep, LocatorDescription: locatorContext.locatorDescription,
        PrimaryLocator: locatorContext.primaryLocator, FallbackLocator: locatorContext.fallbackLocator,
        ExpectedState: locatorContext.expectedState,
        ActualLocatorCount: await locatorContext.locator.count().catch(() => -1),
        Visible: await locatorContext.locator.isVisible({ timeout: 1_000 }).catch(() => false),
        Enabled: await locatorContext.locator.isEnabled({ timeout: 1_000 }).catch(() => false), CurrentUrl: url,
      } : { TestCaseId: caseId, CurrentStep: currentStep, CurrentUrl: url };
      const tracePath = await findTrace();
      const files = {
        url: path.join(runDirectory, "page-url.txt"), console: path.join(runDirectory, "console-errors.json"),
        page: path.join(runDirectory, "page-errors.json"), network: path.join(runDirectory, "network-errors.json"),
        locator: path.join(runDirectory, "locator-context.json"), summary: path.join(runDirectory, "failure-summary.md"),
      };
      await writeFile(files.url, `${url}\n`, "utf8");
      await writeFile(files.console, JSON.stringify(consoleRecords, null, 2), "utf8");
      await writeFile(files.page, JSON.stringify(pageErrors, null, 2), "utf8");
      await writeFile(files.network, JSON.stringify(networkErrors, null, 2), "utf8");
      await writeFile(files.locator, JSON.stringify(observedLocator, null, 2), "utf8");
      const expected = locatorContext?.expectedState ?? "Not provided";
      const actual = blockedReason ?? redactText(testInfo.error?.message) ?? "Not provided";
      await writeFile(files.summary, [
        "# Web UI Evidence", "", `TestCase: ${caseId}`, `Status: ${status}`, `FailureType: ${resolvedFailureType}`,
        `FailedStep: ${currentStep}`, `Expected: ${expected}`, `Actual: ${actual}`, `CurrentURL: ${url}`,
        `Screenshot: ${screenshotStatus === "PASS" || screenshotStatus === "PASS_FALLBACK" ? screenshotPath : screenshotStatus}`,
        `Trace: ${tracePath ?? "unavailable at evidence finalization"}`, `ConsoleErrors: ${consoleRecords.length}`,
        `PageErrors: ${pageErrors.length}`, `NetworkErrors: ${networkErrors.length}`, `Timestamp: ${new Date().toISOString()}`,
      ].join("\n") + "\n", "utf8");
      await attach("evidence-failure-screenshot", screenshotPath, "image/png");
      await attach("evidence-page-url", files.url, "text/plain");
      await attach("evidence-console", files.console, "application/json");
      await attach("evidence-page-errors", files.page, "application/json");
      await attach("evidence-network", files.network, "application/json");
      await attach("evidence-locator-context", files.locator, "application/json");
      await attach("evidence-summary", files.summary, "text/markdown");
      if (tracePath) await attach("trace", tracePath, "application/zip");
      return { caseStatus: status, runDirectory, screenshotStatus, tracePath };
    };

    const evidence: EvidenceContext = {
      step: (name) => { currentStep = redactText(name) ?? "Not set"; },
      setFailureType: (type) => { failureType = type; },
      setLocatorContext: (context) => { locatorContext = { ...context, currentUrl: currentUrl() }; },
      markBlocked: (reason) => { blockedReason = redactText(reason) ?? "Blocked"; failureType = "BLOCKED"; },
      captureCheckpoint: async (name) => {
        await ensureDirectory();
        const checkpointPath = path.join(runDirectory, `${name.replace(/[^a-z0-9-]+/gi, "-")}.png`);
        const screenshotStatus = await captureScreenshot(page, checkpointPath);
        if (screenshotStatus === "PASS" || screenshotStatus === "PASS_FALLBACK") {
          await attach(`checkpoint-${name}`, checkpointPath, "image/png");
          return checkpointPath;
        }
        return undefined;
      },
      captureFailureEvidence,
    };

    try {
      await use(evidence);
    } finally {
      const needsBundle = Boolean(blockedReason) || !["passed", "skipped"].includes(testInfo.status);
      if (needsBundle) await captureFailureEvidence();
    }
  },
});

export { expect };
