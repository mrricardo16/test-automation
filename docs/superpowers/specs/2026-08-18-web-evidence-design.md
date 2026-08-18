# Web UI Failure Evidence Design

## Goal

为现有 Playwright Web UI 测试建立统一、脱敏、可重复的失败证据采集机制，使 FAIL、ERROR 和显式 BLOCKED 结果能够在浏览器仍可用时自动保留截图、URL、Console、Page Error、关键 Network、Locator Context、Failure Summary，并复用现有 Playwright Trace 配置。

## Scope

本阶段覆盖：

1. 新增通用 `tests/web/helpers/evidence.ts` fixture/helper。
2. 统一监听 Console、Page Error、requestfailed 和 HTTP 4xx/5xx 响应。
3. 以 `artifacts/web/<TestCaseId>/<RunId>/` 隔离每次运行。
4. 在 FAIL/ERROR 时主动尝试 fullPage 截图并 fallback 到 viewport；截图失败不覆盖原始 Case 状态。
5. 支持业务 Case 传入 current step、locator context、failure type 和 BLOCKED 原因。
6. 将 `TC-WEB-ENV-001` 与 `TC-WEB-LOGIN-001` 接入统一 fixture；Login 保留少量 PASS 关键节点截图。
7. 通过临时 `INFRASTRUCTURE_SELF_TEST` 真实验证失败证据 Bundle，验证后删除临时测试。
8. 更新 Web README 规则并生成阶段报告。

不做：修改真实 `src_m_ui`、增加新的业务 TestCase、错误密码测试、完整 DOM dump、默认视频录制、业务模块扩展、数据库或复杂 Evidence 服务。

## Existing Baseline

- `playwright.config.ts` 已配置 `screenshot: "only-on-failure"`、`trace: "retain-on-failure"`、`video: "off"`，继续复用，不新增冲突配置。
- `tests/web/real-project/TC_WEB_LOGIN_001.spec.ts` 当前自行监听部分事件并写入 `artifacts/web-real-001/`；接入后由统一 helper 负责失败证据，业务 spec 只保留 Login 关键节点截图和业务上下文。
- `.gitignore` 已忽略 `artifacts/`、`playwright-report/` 和 `test-results/`，不扩大提交范围。

## Architecture

### Evidence fixture

`tests/web/helpers/evidence.ts` 导出与现有 Playwright 风格一致的 `test` 和 `expect`，并通过 custom fixture 为每个 UI Case 创建 EvidenceContext。fixture 在测试主体前注册 listeners，在测试主体结束后读取 `testInfo.status`、`testInfo.expectedStatus`、`testInfo.error` 和显式 BLOCKED 状态；只有 FAIL、ERROR 或 BLOCKED 才生成完整 Bundle。

Helper 只处理通用运行证据，不知道 Login、Dashboard、AGV、Map 或任何业务字段。业务 Case 通过以下通用接口提供上下文：

- `step(name)`：维护最后业务步骤。
- `setFailureType(type)`：允许 Case 指定 `ERROR_LOCATOR`、`ERROR_TIMEOUT`、`FAIL_UI_NAVIGATION` 等分类。
- `setLocatorContext(context)`：记录描述、首选/回退 locator、ExpectedState，并在采集时读取 count、visible、enabled。
- `markBlocked(reason)`：显式标记 BLOCKED；如果 Page 已创建则保留当前 screenshot 和 URL。
- `captureFailureEvidence()`：由 fixture 自动调用，也可供受控 Case 使用。

### Bundle layout

每个失败运行使用唯一目录：

`artifacts/web/<TestCaseId>/<RunId>/`

其中 RunId 为 UTC `yyyyMMdd-HHmmss` 加 PID、worker 和 retry 后缀。固定文件名包括：

- `failure.png`
- `page-url.txt`
- `console-errors.json`
- `page-errors.json`
- `network-errors.json`
- `locator-context.json`
- `failure-summary.md`

Trace 继续由 Playwright 的 `retain-on-failure` 生成；helper 查找 `testInfo.outputDir/trace.zip`，存在时 attach 到 Playwright Report，并在 summary 中写入真实路径，不复制或覆盖 Trace。

### Capture flow

```text
test starts
  -> fixture registers listeners
  -> Case updates currentStep / locator context
  -> Case PASS: retain only explicit checkpoint screenshots
  -> Case FAIL/ERROR: screenshot -> flush JSON -> summary -> attach
  -> Case BLOCKED: reason + URL, and screenshot when Page is available
  -> context/page cleanup
```

Screenshot first attempts `fullPage: true`; if that fails, it retries without `fullPage`. Before either attempt, helper checks for sensitive inputs. Password inputs with `type=password` are permitted; a sensitive input that appears to be plaintext causes screenshot capture to be skipped and records the capture status without exposing its value. Screenshot errors never replace the original Case status.

## Evidence and Redaction

- Console records preserve type (`log`, `info`, `warning`, `error`), sanitized text, and timestamp, capped at 300 records.
- Page errors preserve sanitized message, stack, and timestamp.
- Network records include only method, sanitized URL/path, status, duration, resource type, failure text, and timestamp; retain requestfailed and responses with status >= 400, capped at 500 records.
- URL sanitization replaces query/fragment values for token, access_token, code, session, cookie, authorization, password, and pwd keys.
- Text redaction removes Bearer values and labeled Authorization, Cookie, Set-Cookie, token, password, secret, and credential values.
- Request/response bodies, headers, cookies, storage state, and arbitrary DOM content are never written.
- `locator-context.json` stores only the declared locator descriptions and observed state; it never stores input values.
- All JSON and Markdown are written with UTF-8 encoding.

## Failure Classification

The helper preserves the business Case status separately from evidence collection status:

- `FAIL` / `FAIL_UI_NAVIGATION`: product behavior contradicts the Case expectation.
- `ERROR_LOCATOR`, `ERROR_TIMEOUT`, `ERROR_NAVIGATION`, `ERROR_PLAYWRIGHT`, `ERROR_BROWSER`, `ERROR_ASSERTION_INFRASTRUCTURE`: automation or environment execution errors.
- `BLOCKED`: explicit prerequisite block; a page screenshot/URL is collected only when available.
- `EvidenceScreenshotStatus = ERROR` or a trace-unavailable note never changes an original FAIL into ERROR.

`failure-summary.md` includes TestCase, Status, FailureType, FailedStep, Expected, Actual, CurrentURL, Screenshot, Trace, ConsoleErrors, PageErrors, NetworkErrors, and Timestamp.

## Self-Test

A temporary untracked test named and labeled `INFRASTRUCTURE_SELF_TEST` intentionally fails one assertion while using the Evidence fixture. It must produce a non-empty failure screenshot, Trace or a documented trace path, Console JSON, Network JSON, Locator Context JSON, and Failure Summary. The test is run explicitly, inspected, then deleted before commit; it is not a business TestCase and is not included in the default Web regression.

## Acceptance Criteria

- `TC-WEB-ENV-001` and `TC-WEB-LOGIN-001` execute through the unified fixture and still pass in the real Web environment.
- The self-test produces and verifies all required evidence artifacts, with no secret values.
- A real FAIL/ERROR can be traced to a unique Case/RunId directory and summary.
- PASS runs do not generate a full failure Bundle; Login retains only its defined checkpoint screenshots.
- BLOCKED support records reason and page state when available.
- The existing screenshot/trace/video configuration remains `only-on-failure` / `retain-on-failure` / `off`.
- No real `src_m_ui` file changes; source hash before and after is equal.
- `git diff --check` passes; artifacts remain ignored; no password/token/Cookie/Authorization value enters the diff.
- README records the formal Web UI Evidence rule.
