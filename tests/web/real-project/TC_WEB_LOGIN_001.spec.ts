import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TEST_CASE_ID = "TC-WEB-LOGIN-001";
const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const loginUrl = baseUrl + "/#/login?redirect=/dashboard";
const evidenceDir = path.resolve("artifacts/web-real-001");

type LoginResponseRecord = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
};

type RuntimeObservation = {
  loginResponses: LoginResponseRecord[];
  requestFailedPaths: string[];
  http5xxPaths: string[];
  consoleErrors: string[];
  pageErrors: string[];
  loginBusinessSuccess: boolean;
  finalUrl: string;
  authTokenPresent: "Yes" | "No" | "Not Applicable";
};

function safePath(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  const safeParams = [...parsed.searchParams.entries()].map(([key, value]) => {
    const isSensitive = /token|password|pwd|cookie|authorization/i.test(key + "=" + value);
    return encodeURIComponent(key) + "=" + encodeURIComponent(isSensitive ? "redacted" : value);
  });
  return parsed.pathname + (safeParams.length > 0 ? "?" + safeParams.join("&") : "");
}

function shortErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 240);
}

test("TC-WEB-LOGIN-001 - valid login enters Dashboard", async ({ browser }) => {
  test.skip(
    !username || !password,
    "BLOCKED: WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required",
  );

  await mkdir(evidenceDir, { recursive: true });

  const observation: RuntimeObservation = {
    loginResponses: [],
    requestFailedPaths: [],
    http5xxPaths: [],
    consoleErrors: [],
    pageErrors: [],
    loginBusinessSuccess: false,
    finalUrl: "",
    authTokenPresent: "Not Applicable",
  };
  const requestStartedAt = new Map<string, number>();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("request", (request) => {
    if (request.method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(request.url())) {
      requestStartedAt.set(request.url(), Date.now());
    }
  });

  page.on("requestfailed", (request) => {
    observation.requestFailedPaths.push(safePath(request.url()));
  });

  page.on("response", (response) => {
    const responseUrl = response.url();
    const status = response.status();
    if (status >= 500) {
      observation.http5xxPaths.push(safePath(responseUrl));
    }
    if (response.request().method() !== "POST" || !/\/Account\/Login(?:$|\?)/i.test(responseUrl)) {
      return;
    }
    const startedAt = requestStartedAt.get(responseUrl);
    observation.loginResponses.push({
      method: response.request().method(),
      path: safePath(responseUrl),
      status,
      durationMs: startedAt ? Date.now() - startedAt : 0,
    });
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      observation.consoleErrors.push(shortErrorMessage(message.text()));
    }
  });

  page.on("pageerror", (error) => {
    observation.pageErrors.push(shortErrorMessage(error.message));
  });

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    const usernameInput = page.getByPlaceholder(/用户名|username|loginName/i);
    const passwordInput = page.getByPlaceholder(/用户密码|密码|password/i);
    const loginButton = page.getByRole("button").filter({ hasText: /登\s*录|login/i });

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(loginButton).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceDir, "login-page.png"),
      fullPage: true,
    });
    await writeFile(
      path.join(evidenceDir, "login-dom.html"),
      await page.content(),
      "utf8",
    );

    await usernameInput.fill(username!);
    await passwordInput.fill(password!);
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/Account\/Login(?:$|\?)/i.test(response.url()),
      { timeout: 30_000 },
    );
    await loginButton.click();
    const loginResponse = await loginResponsePromise;

    let loginPayload: { statusCode?: number; isSuccess?: boolean } = {};
    try {
      loginPayload = (await loginResponse.json()) as {
        statusCode?: number;
        isSuccess?: boolean;
      };
    } catch {
      loginPayload = {};
    }
    observation.loginBusinessSuccess =
      loginResponse.status() >= 200 &&
      loginResponse.status() < 300 &&
      loginPayload.statusCode === 200 &&
      loginPayload.isSuccess === true;

    expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
    expect(loginResponse.status()).toBeLessThan(300);
    expect(observation.loginBusinessSuccess).toBe(true);
    await page.waitForURL(
      (url) => /#\/dashboard(?:[/?#]|$)/.test(url.href),
      { timeout: 30_000 },
    );
    await expect(page.locator(".dashboard")).toBeVisible({ timeout: 30_000 });

    observation.finalUrl = page.url();
    observation.authTokenPresent = (await page.evaluate(() =>
      Boolean(sessionStorage.getItem("access_token")),
    ))
      ? "Yes"
      : "No";
    await page.screenshot({
      path: path.join(evidenceDir, "dashboard-after-login.png"),
      fullPage: true,
    });
  } catch (error) {
    const passwordType = await page
      .locator('input[type="password"]')
      .count()
      .catch(() => 0);
    if (passwordType > 0) {
      await page.screenshot({
        path: path.join(evidenceDir, "login-failure.png"),
        fullPage: true,
      });
    }
    throw error;
  } finally {
    observation.finalUrl = observation.finalUrl || page.url();
    await writeFile(
      path.join(evidenceDir, "runtime-observation.json"),
      JSON.stringify(observation, null, 2),
      "utf8",
    );
    await context.close();
  }
});
