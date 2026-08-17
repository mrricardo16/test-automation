# Automation Test Repository Rules

1. Create or update a TestCase before writing every formal automated test.
2. Every formal test must have a unique TestCaseId.
3. TestCase records and automation code must be linked by TestCaseId.
4. Do not modify the product under test to make an automation test pass.
5. By default, modify only this automation-testing repository.
6. If a product bug is suspected, report it with evidence; do not fix product code here.
7. Use only these execution statuses: PASS, FAIL, ERROR, BLOCKED, MANUAL, and SKIPPED.
8. Prefer Playwright for Web UI automation.
9. Prefer role, label, test id, and stable semantic locators in that order.
10. Do not use fixed screen-coordinate clicks as standard Web UI automation.
11. Do not use large fixed sleeps to solve asynchronous behavior.
12. Prefer Playwright auto-waiting and explicit condition-based waits.
13. Execute generated automation scripts for real.
14. Never claim success from generated code without an executed test result.
15. When execution fails, classify the cause as test-script error, environment error, product failure, or blocked.
16. Preserve logs, screenshots, traces, and error stacks whenever available.
17. Mark unreliable automation as MANUAL instead of forcing automation.
18. Avalonia work follows Headless tests first, then a small Appium real desktop E2E set.
19. Avalonia Headless tests must not depend on a real Desktop Session or screen coordinates; validate ViewModel, Command, Binding, and Control State.
20. Appium is only for real desktop E2E scenarios that Headless cannot cover, and Appium installation is prohibited during the current Phase 2 initialization.
21. Real Avalonia business projects are read-only by default; do not change product code, AutomationId, or testability interfaces to make tests pass.
22. Never commit keys, passwords, tokens, secrets, or sensitive configuration.
23. Keep all Markdown, TypeScript, JSON, and text files encoded as UTF-8.
24. Keep generated reports in reports and generated evidence in artifacts.
25. Keep node_modules and browser binaries out of Git.
