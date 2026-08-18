import { expect, test } from "./helpers/evidence";

test("TC-WEB-ENV-001 - Playwright environment can launch Chromium", async ({ page, evidence }) => {
  evidence.step("Open about:blank");
  await page.goto("about:blank");
  await expect(page).toHaveURL("about:blank");
});
