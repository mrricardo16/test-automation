import { expect, test } from '@playwright/test';
import path from 'node:path';

const username = process.env.RSS_TEST_USERNAME ?? '';
const password = process.env.RSS_TEST_PASSWORD ?? '';
const artifactsDir = path.resolve(__dirname, '..', 'artifacts', 'TC-RSS-LOGIN-001');

test('TC-RSS-LOGIN-001: SA 登录并进入 Dashboard', async ({ page }) => {
  test.skip(!username || !password, 'BLOCKED: RSS_TEST_USERNAME/RSS_TEST_PASSWORD 未注入');

  await page.goto('/#/login?redirect=/dashboard');
  await expect(page.getByPlaceholder('用户名')).toBeVisible();
  await expect(page.getByPlaceholder('用户密码')).toHaveAttribute('type', 'password');

  await page.getByPlaceholder('用户名').fill(username);
  await page.getByPlaceholder('用户密码').fill(password);

  const loginResponse = page.waitForResponse(
    (response) => response.request().method() === 'POST' && /\/Account\/Login(?:$|\?)/i.test(response.url()),
  );
  await page.getByRole('button', { name: /登\s*录/ }).click();

  const response = await loginResponse;
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const payload = (await response.json()) as { statusCode?: number; isSuccess?: boolean };
  expect(payload.statusCode).toBe(200);
  expect(payload.isSuccess).toBe(true);

  await expect(page).toHaveURL(/#\/dashboard(?:[/?#]|$)/);
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.screenshot({ path: path.join(artifactsDir, 'result.png'), fullPage: false });
});
