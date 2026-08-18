import { expect, test } from "../helpers/evidence";

const baseUrl = process.env.WEB_TEST_BASE_URL ?? "http://localhost:8223";
const username = process.env.WEB_TEST_USERNAME;
const password = process.env.WEB_TEST_PASSWORD;
const loginUrl = `${baseUrl}/#/login?redirect=/dashboard`;

test("TC-WEB-LOGIN-001 - valid login enters Dashboard", async ({ page, evidence }) => {
  if (!username || !password) {
    evidence.markBlocked("WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required");
    test.skip(true, "BLOCKED: WEB_TEST_USERNAME and WEB_TEST_PASSWORD are required");
    return;
  }

  evidence.step("Open login page");
  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

  evidence.step("Identify login controls");
  evidence.setFailureType("ERROR_LOCATOR");
  const usernameInput = page.getByPlaceholder(/用户名|username|loginName/i);
  const passwordInput = page.getByPlaceholder(/用户密码|密码|password/i);
  const loginButton = page.getByRole("button").filter({ hasText: /登\s*录|login/i });
  evidence.setLocatorContext({
    locatorDescription: "login username input",
    primaryLocator: "getByPlaceholder(/用户名|username|loginName/i)",
    fallbackLocator: "input[name='username']",
    expectedState: "username input is visible",
    locator: usernameInput,
  });
  await expect(usernameInput).toBeVisible();
  evidence.setLocatorContext({
    locatorDescription: "login password input",
    primaryLocator: "getByPlaceholder(/用户密码|密码|password/i)",
    fallbackLocator: "input[type='password']",
    expectedState: "password input is visible and has password type",
    locator: passwordInput,
  });
  await expect(passwordInput).toBeVisible();
  await expect(passwordInput).toHaveAttribute("type", "password");
  evidence.setLocatorContext({
    locatorDescription: "login submit button",
    primaryLocator: "getByRole('button').filter({ hasText: /登\\s*录|login/i })",
    fallbackLocator: "button[type='submit']",
    expectedState: "login button is visible",
    locator: loginButton,
  });
  await expect(loginButton).toBeVisible();
  await evidence.captureCheckpoint("login-page");

  evidence.step("Fill username");
  await usernameInput.fill(username);
  evidence.step("Fill password");
  await passwordInput.fill(password);
  evidence.step("Click login");
  const loginResponsePromise = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/Account\/Login(?:$|\?)/i.test(response.url()),
    { timeout: 30_000 },
  );
  await loginButton.click();

  evidence.setFailureType("FAIL_BUSINESS_ASSERTION");
  const loginResponse = await loginResponsePromise;
  let loginPayload: { statusCode?: number; isSuccess?: boolean } = {};
  try {
    loginPayload = (await loginResponse.json()) as { statusCode?: number; isSuccess?: boolean };
  } catch {
    loginPayload = {};
  }
  expect(loginResponse.status()).toBeGreaterThanOrEqual(200);
  expect(loginResponse.status()).toBeLessThan(300);
  expect(loginPayload.statusCode).toBe(200);
  expect(loginPayload.isSuccess).toBe(true);

  evidence.setFailureType("FAIL_UI_NAVIGATION");
  evidence.step("Wait for Dashboard");
  await page.waitForURL((url) => /#\/dashboard(?:[\/?#]|$)/.test(url.href), { timeout: 30_000 });
  evidence.step("Assert Dashboard root");
  const dashboardRoot = page.locator(".dashboard");
  evidence.setLocatorContext({
    locatorDescription: "Dashboard root",
    primaryLocator: "locator('.dashboard')",
    fallbackLocator: "getByRole('heading')",
    expectedState: "Dashboard root is visible",
    locator: dashboardRoot,
  });
  await expect(dashboardRoot).toBeVisible({ timeout: 30_000 });
  await evidence.captureCheckpoint("dashboard-after-login");
});
