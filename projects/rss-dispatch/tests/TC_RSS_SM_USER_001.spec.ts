import { expect, Page, test } from '@playwright/test';
import path from 'node:path';

const username = process.env.RSS_TEST_USERNAME ?? '';
const password = process.env.RSS_TEST_PASSWORD ?? '';
const artifactsDir = path.resolve(__dirname, '..', 'artifacts', 'TC-RSS-SM-USER-001');

async function login(page: Page) {
  await page.goto('/#/login?redirect=/dashboard');
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
}

test('TC-RSS-SM-USER-001: 进入用户管理并按登录名查询', async ({ page }) => {
  test.skip(!username || !password, 'BLOCKED: RSS_TEST_USERNAME/RSS_TEST_PASSWORD 未注入');

  await login(page);
  await page.goto('/#/Employee/User');
  await expect(page).toHaveURL(/#\/Employee\/User(?:[/?#]|$)/);

  await expect(page.getByRole('textbox', { name: '登录名' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
  await expect(page.getByRole('button', { name: '搜索', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '新增', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '修改', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '删除', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '密码初始化', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '指定用户角色', exact: true })).toBeDisabled();
  await page.screenshot({ path: path.join(artifactsDir, 'before-search.png'), fullPage: false });

  await page.getByRole('textbox', { name: '登录名' }).fill('CS');
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  const resultRow = page.getByRole('row', { name: /CS\s+CS/ });
  await expect(resultRow).toBeVisible();
  await expect(resultRow).toContainText('CS');
  await expect(page.getByText(/共\s*1\s*条/)).toBeVisible();
  await page.screenshot({ path: path.join(artifactsDir, 'result.png'), fullPage: false });
});
