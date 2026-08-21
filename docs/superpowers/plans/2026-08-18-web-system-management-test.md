# WEB 系统管理真实测试实施计划

> **For agentic workers:** 先建立 TestCase 记录，再执行 Playwright；所有结果必须有截图或明确记录截图不可用原因。

**目标：** 基于 ARCH-001 确认的同版本源码与运行实例，完成真实 Web 系统管理页面的 CRUD、权限、菜单、字典和外部系统配置测试。

**范围：** `http://localhost:8223` 的登录、系统管理入口、用户管理、角色管理、菜单管理、字典管理、外部系统配置；所有业务测试数据使用 `CS` 命名。

**约束：**

- 只修改 `E:\automated-testing`，不修改真实前后端源码。
- 每个正式用例先在 `test-cases/web/TC-SM-SUITE-001.md` 登记唯一 `TestCaseId`。
- 只使用 Playwright 语义定位和条件等待，不使用坐标点击或注入 DOM 值。
- 每条用例保存预期截图、实际结果截图；失败保留错误截图、Trace、日志和错误分类。
- 状态只使用 `PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`SKIPPED`。
- 不把密码、Token、Cookie、连接串写入代码、报告或 Excel。
- 发生产品真实结果与预期不符时记为 `FAIL`，定位/框架错误记为 `ERROR`，环境或账号缺失记为 `BLOCKED`。

## Task 1：建立 TestCase 记录

**文件：** `test-cases/web/TC-SM-SUITE-001.md`

- [ ] 登记登录和系统管理入口。
- [ ] 登记用户、角色、菜单、字典、外部系统配置的查询和 CRUD 用例。
- [ ] 登记角色全部权限、用户角色关联和最终清理核验。
- [ ] 明确每条用例的预期截图与结果截图要求。

## Task 2：编写正式 Playwright 执行器

**文件：** `tests/web/real-project/TC_SM_SYSTEM_MANAGEMENT_001.spec.ts`

- [ ] 复用现有脱敏 evidence fixture。
- [ ] 复用真实登录链路和稳定语义定位。
- [ ] 使用 `CS` 数据执行系统管理 CRUD 与权限流程。
- [ ] 每条 TestCaseId 与测试标题、证据目录、结果报告保持一致。

## Task 3：真实执行与证据回填

- [ ] 先执行环境和登录前置检查。
- [ ] 执行系统管理正式用例，不以生成代码代替执行。
- [ ] 保存每条用例的结果截图；失败保留 Trace 和错误上下文。
- [ ] 对产品失败、自动化错误、环境阻塞分别分类。

## Task 4：报告与 Excel

- [ ] 生成 `reports/system-management-real-test-report.md`。
- [ ] 将 TestCaseId、预期、实际、状态、错误分类、截图路径和 Trace 路径回填 Excel。
- [ ] 截图直接嵌入执行明细，并保留原始证据路径。
- [ ] 执行 UTF-8、敏感信息、`git diff --check` 和报告一致性验证。
