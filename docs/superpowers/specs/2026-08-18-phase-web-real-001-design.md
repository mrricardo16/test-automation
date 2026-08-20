# Phase WEB-REAL-001 Design

## Goal

接入真实 `D:\HZ_RSS40\03_trunk\src_m_ui` 运行实例，以 Playwright 完成一次真实有效登录并客观确认进入 Dashboard，同时生成可重复执行的正式 TestCase、脱敏证据和阶段报告。

## Scope

本阶段只覆盖：

1. 读取真实 Web 源码，确认技术栈、路由、登录页、登录 API、认证存储和 redirect 行为。
2. 确认并复用 `http://localhost:8223/#/login?redirect=/dashboard` 当前运行实例；只有不可访问时才依据源码中的 `package.json` 调查启动命令。
3. 先执行既有 `TC-WEB-ENV-001`，再执行新增 `TC-WEB-LOGIN-001`。
4. 使用独立 BrowserContext，从登录页真实 `fill` 用户名和密码并真实 `click` 登录，观察登录请求和 Dashboard 首屏。
5. 监听 `console.error`、`pageerror`、`requestfailed` 和 HTTP 5xx；保存脱敏报告以及登录页/成功页/失败页证据。
6. 重新计算真实源码树 hash，确认源码前后完全一致。

明确不做：错误密码、字段校验矩阵、Logout、权限矩阵、菜单导航、地图、AGV、订单、调度、设置、产品源码修改、`data-testid` 注入、依赖升级、Appium 和完整业务回归。

## Architecture

方案 A：复用仓库现有 Playwright Test 配置，在 `tests/web/real-project/` 增加独立的 `TC_WEB_LOGIN_001.spec.ts`。运行地址通过 `WEB_TEST_BASE_URL` 覆盖，默认值为 `http://localhost:8223`；测试账号只从 `WEB_TEST_USERNAME` 和 `WEB_TEST_PASSWORD` 读取，不写入追踪文件。

测试使用 `page.goto` 打开 hash 登录路由，使用源码和真实 DOM 映射的语义 locator。优先级为 role、label、placeholder、文本、稳定属性和稳定 CSS；没有稳定语义 locator 时保留 DOM/截图证据并报告 `ERROR_LOCATOR` / `PRODUCT_CHANGE_RECOMMENDED`，不修改 `src_m_ui`。

网络观测只保存请求 method、脱敏 path、HTTP status、duration 和失败分类。Authorization、token、Cookie、密码和完整 request body 不进入报告、日志或 Git。成功必须同时满足实际登录响应成功、最终路由符合源码行为、Dashboard 稳定容器或标题出现；仅 URL 变化不能判定成功。

## Source Findings To Verify

- Framework：源码 package 及导入确认 Vue 3 + TypeScript。
- Build Tool：`package.json` 和配置确认 Vite。
- Router：`vue-router`、`createWebHashHistory`、`/login`、`/` 到 `/dashboard` 的路由定义。
- State Management：源码确认 Pinia（并记录 Vuex 依赖是否实际参与本流程）。
- HTTP Client：`src/utils/request.ts` 中的 Axios 实例。
- UI Library：登录页使用 Element Plus 组件。
- 登录页：`src/views/login/index.vue`，用户输入为 `userCode`，密码输入为 `userPwd`，按钮由本地化登录文本渲染。
- 登录 API：`src/api/auth/index.ts` 中的 `POST /Account/Login`；实际 API base URL 以运行时 `window.RssConfig.RSSApi` 为准。
- Token：`src/utils/auth.ts` 和 user store 记录 `sessionStorage` 的 `access_token` / `refresh_token`；报告仅记录存在性。
- redirect：源码中的登录处理调用 `router.replace("/")`，根路由 redirect 到 `/dashboard`；同时检查运行时 `redirect=/dashboard` 是否按该设计被消费或最终收敛到 Dashboard。
- Dashboard：`src/views/dashboard/index.vue` 中的 `.dashboard` 根容器和源码定义的稳定标题/业务面板。

以上内容是静态分析方向；最终报告以实际读取的源码行和运行 DOM/Network 证据为准。

## Deliverables

- `test-cases/web/TC-WEB-LOGIN-001.md`：沿用既有 TestCase 表格风格，包含 TestCaseId、前置条件、数据来源、步骤、定位策略、证据、限制和清理。
- `tests/web/real-project/TC_WEB_LOGIN_001.spec.ts`：可独立通过 `npx playwright test tests/web/real-project/TC_WEB_LOGIN_001.spec.ts` 执行，方法名和报告保留 `TC-WEB-LOGIN-001`。
- `projects/test-workflow/reports/web-real-001-report.md`：包含起始 Git 状态、源码 hash/count 前后值、技术栈、路由/API、locator mapping、Network/Console、Dashboard 断言、最终状态和安全检查。
- `projects/test-workflow/reports/future-web-candidates.md`：只记录后续候选，不执行。
- `artifacts/web-real-001/`：运行生成的截图、失败 trace 或其他脱敏证据；目录保持 Git ignored。

## Execution And Classification

1. 记录自动化仓库 Git 起始状态和真实 Web 源码树 hash/count。
2. 静态读取真实源码，不写入 `src_m_ui`。
3. 检查 `localhost:8223`；已可访问则不启动新实例。
4. 运行 `TC-WEB-ENV-001`。环境 prerequisite 不满足时停止业务 Case，并记录 `BLOCKED`。
5. 设置当前 shell 的本地凭据环境变量，运行真实 Login Smoke。
6. 将结果按仓库状态分类：真实产品预期不符为 `FAIL`；Playwright/locator/runner 错误为 `ERROR`；服务、账号或浏览器前置条件缺失为 `BLOCKED`；只在客观证据满足时为 `PASS`。
7. 回归 Web 基线，重新计算源码 hash/count，执行 `git diff --check` 和敏感信息扫描。
8. 仅在新交付结果有明确状态且安全检查通过后提交本阶段文件；不纳入已有未提交的 Avalonia 文件。

## Safety Constraints

- `D:\HZ_RSS40\03_trunk\src_m_ui` 全程只读，不 build、restore、format、patch、clean 或生成文件。
- 不在测试代码、TestCase、报告、截图路径或 Git diff 中写入真实密码、token、Cookie、Authorization 或 storage state。
- 不修改产品源码、路由、API、CSS、package.json、AutomationId 或 testability interface。
- 保留现有 `E:\automated-testing` 未提交修改，新增文件与其隔离。
- 所有新增 Markdown、TypeScript、JSON 和文本保持 UTF-8。
- 终点是 Dashboard Entry，不进入其他业务模块。

