# PLATFORM-06 CI-safe GitHub Actions 验证报告

日期：2026-08-20

## 实施范围

本阶段只实现 CI-safe GitHub Actions：工作流、CI 安全检查器、`test:ci` 统一命令和对应 TestCase。未实施 PLATFORM-07/08，也未修改三个现有 Skill。

## 工作流

- 文件：`.github/workflows/test-platform.yml`
- 工作流名：`Agent-Driven Test Platform`
- 触发：`push` / `pull_request`，目标分支 `main`
- Runner：`ubuntu-latest`
- Node：24
- 安装：`npm ci --registry=https://registry.npmjs.org/`
- 浏览器：仅安装 Chromium，使用 `npx playwright install --with-deps chromium`
- 权限：`contents: read`
- 并发：同一工作流和 ref 取消旧运行
- 产物：仅尝试上传 `projects/test-workflow/artifacts/`、`playwright-report/`、`test-results/`，缺失路径忽略，保留 7 天
- 未使用 Secrets，也未配置写权限

CI 只调用 `npm run test:ci`；该命令依次执行 `ci:safety`、`validate`、`test:platform`，不直接连接真实业务 Runtime。

## 安全门

TestCase：`TC-PLATFORM-06-CI-SAFETY-001`

`scripts/platform/ci-safety-check.mjs` 使用直接依赖 `yaml` 解析工作流，并检查：

- 工作流触发、Runner、Node 24、权限、`npm ci`、Chromium、统一命令和产物保留策略；
- CI 可达脚本是否误指向真实项目、真实 DLL、真实 localhost、Appium/Avalonia 桌面路径、凭据或广泛进程终止；
- Web/API/Synthetic/Platform 命令是否保持现有统一入口；
- Synthetic Runtime 是否绑定 `127.0.0.1` 并请求动态端口。

安全 TestCase 先以缺失实现的模块错误完成 RED，再在实现后通过 2/2；真实仓库扫描结果为 `CI_SAFETY=PASS`。

## 本地验证结果

| 命令 | 结果 |
|---|---|
| `node --test tests/ci/ci-safety-check.spec.mjs` | PASS，2/2 |
| `npm run ci:safety` | PASS |
| `npm run validate` | PASS，UTF8 / schema / executable safety / static validation |
| `npm run test:ci` | PASS |
| `npm run typecheck:negative` | PASS |
| `npm run test:web` | PASS，10/10 |
| `npm run test:api` | PASS，4/4 |
| `npm run test:contracts` | PASS，8/8 |
| `npm run test:skills` | PASS，Skill self-test/validator |
| `npm ci --dry-run --ignore-scripts --registry=https://registry.npmjs.org/` | PASS |

`npm run test:ci` 内含的 PLATFORM-05 回归还通过了 typecheck、lint、contracts 8/8、Skill checks、Synthetic Web 10/10、API 4/4 和 acceptance 12/12。

已知 Bug 仍保持产品侧 `ExecutionStatus=FAIL` + `AcceptanceExpectation=EXPECT_PRODUCT_FAIL`，由 Acceptance `GateStatus=PASS` 表示“成功发现预期缺陷”；CI 通过的是 Acceptance/平台门，不是把产品 FAIL 改成 PASS。

## 边界确认

- 未访问真实 localhost。
- 未读取 `config/local-projects.json`。
- 未访问真实 DLL、数据库、业务源码或真实凭据。
- 未运行 Avalonia、Appium、FlaUI、WinAppDriver 或桌面运行时。
- 未修改真实产品和三个现有 Skill。
- 未关闭非本轮拥有的进程；Synthetic Runtime 测试只管理自身动态 localhost 进程。
- 未在本地宣称 hosted GitHub Actions 已执行；本报告只记录本地静态/命令验证。
