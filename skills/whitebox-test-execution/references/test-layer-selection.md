# Test layer selection

Prefer reliable lower layers: `UNIT`, `INTEGRATION`, `API`, `DESKTOP_HEADLESS`/`WEB_UI`/`DESKTOP_E2E`, then `MANUAL`; retain representative UI/E2E for critical flows. Reuse existing harnesses. Do not duplicate a low-value behavior at every layer. Use `NOT_APPLICABLE` only with a reason. Web uses Playwright semantic locators; desktop follows the existing Headless-before-Appium boundary.
