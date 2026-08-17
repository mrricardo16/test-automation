import { expect, test } from '@playwright/test';

test('TC-WEB-ENV-001 - Playwright environment can launch Chromium', async ({ page }) => {
  await page.goto('about:blank');
  await expect(page).toHaveURL('about:blank');
});
