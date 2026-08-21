# Web 测试报告拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将功能依据和流程依据分别生成“完整测试用例报告”和“问题反馈报告”，并让报告治理脚本验证四份报告的结构、命名、图片证据和状态规则。

**Architecture:** 保留现有测试用例和执行脚本作为事实来源，在 `projects/test-workflow/reports/` 生成四份中文报告。完整报告记录全量覆盖和执行结果；问题报告由非 PASS 结果和需要开发/环境处理的未执行项组成。`report-governance.mjs` 继续作为 CI-safe 的静态门禁，不依赖真实产品环境。

**Tech Stack:** Markdown, Node.js ES modules, Playwright evidence paths, npm platform validation, PowerShell, Git.

## Global Constraints

- 只修改 `E:\automated-testing`，不修改被测产品源码。
- 正式状态只使用 `PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`SKIPPED`。
- 每条正式自动化用例必须先有唯一 TestCaseId，并与脚本、报告和证据关联。
- 所有 Markdown、TypeScript、JSON 和文本文件保持 UTF-8。
- 密码、Token、Cookie、API Key 和敏感响应值不得进入提交文件。
- 保留当前工作区已有修改，不执行 reset、checkout、clean 或覆盖无关文件。

### Task 1: 扩展报告治理契约

**Files:**
- Modify: `scripts/platform/report-governance.mjs`
- Test: `test-cases/web/TC-DOC-GOV-001.md`

**Interfaces:**
- Consumes: `projects/test-workflow/reports/` 下的中文报告和相对图片引用。
- Produces: `REPORT_GOVERNANCE=TC-DOC-GOV-001:PASS` 或带明确文件路径的失败信息。

- [ ] **Step 1: 为四类报告定义命名和分类规则**

  报告治理脚本应识别以下后缀：

  ```text
  _完整测试用例报告.md
  _问题反馈报告.md
  ```

  并要求每个测试依据前缀最多对应一份完整报告和一份问题报告。

- [ ] **Step 2: 增加完整报告结构校验**

  完整报告必须包含 `TestCaseId`、`实际结果`、`图片示例`、合法状态集合和测试结论；问题报告必须包含 `关联 TestCaseId`、`实际结果`、`问题分类`、`证据` 或等价字段。

- [ ] **Step 3: 增加问题报告 PASS 泄漏校验**

  问题报告中的条目不得将 PASS 作为问题状态；允许在统计或“排除说明”中说明 PASS，但问题明细必须具备 FAIL、ERROR、BLOCKED、MANUAL 或有反馈价值的 SKIPPED。

- [ ] **Step 4: 运行治理脚本确认先失败或暴露缺口**

  Run: `node scripts/platform/report-governance.mjs`

  Expected: 在四份正式报告尚未完成时，输出缺失报告或结构缺失信息；不得静默 PASS。

- [ ] **Step 5: 更新 TestCase 记录**

  在 `TC-DOC-GOV-001` 中记录四份报告、后缀规则、问题分类和图片证据列的验收标准，并保留治理脚本关联。

### Task 2: 生成四份中文报告和报告内覆盖矩阵

**Files:**
- Create: `projects/test-workflow/reports/功能_02_Web管理端_系统管理_完整测试用例报告.md`
- Create: `projects/test-workflow/reports/功能_02_Web管理端_系统管理_问题反馈报告.md`
- Create: `projects/test-workflow/reports/流程_01_权限与登录_完整测试用例报告.md`
- Create: `projects/test-workflow/reports/流程_01_权限与登录_问题反馈报告.md`
- Modify: `projects/test-workflow/reports/测试文档命名规则.md`

**Interfaces:**
- Consumes: `test-cases/web/`, `tests/web/real-project/`, existing Web artifacts and the two basis documents.
- Produces: 四份可人工复审的 Markdown 报告，所有图片使用报告目录下的相对路径。

- [ ] **Step 1: 为功能完整报告建立覆盖矩阵**

  至少登记查询、新增、修改、删除、角色、菜单、字典、外部系统和权限关系；查询必须出现空条件、精确、模糊、无匹配、空格、特殊字符、非法字符、长度边界、分页和重置；新增必须出现必填、格式、长度边界、重复属性、重复提交、保存失败和保存后查询。

- [ ] **Step 2: 为流程完整报告建立跨步骤覆盖矩阵**

  登记 SA 登录、普通账号创建与授权、普通账号登录、禁用、在线会话、恢复、删除后登录拒绝、会话失效、权限实时生效、并发和主机级授权；没有真实证据的项目必须保留 SKIPPED、ERROR 或 BLOCKED 原因。

- [ ] **Step 3: 建立问题反馈报告**

  只写入实际 FAIL、ERROR、BLOCKED、MANUAL 和有开发/环境处理价值的 SKIPPED；每项包含关联 TestCaseId、复现条件、预期/实际、分类、严重程度、证据路径和后续动作。

- [ ] **Step 4: 将图片放入每条用例右侧列**

  表格固定使用：

  ```text
  用例/流程 | TestCaseId | 结果 | 实际验证 | 图片示例
  ```

  图片使用 Markdown 或 HTML 缩略图链接，链接目标必须位于对应报告目录下的 `图片证据/`。

- [ ] **Step 5: 运行相对路径和敏感信息静态检查**

  Run: `node scripts/platform/report-governance.mjs`

  Expected: 四份报告均通过 UTF-8、中文命名、图片列、相对路径、状态和敏感信息检查。

### Task 3: 集成平台质量门禁并验证

**Files:**
- Modify: `scripts/platform/run-platform-quality.mjs`
- Modify: `scripts/platform/run-platform-validation.mjs`
- Modify: `.github/workflows/test-platform.yml`

**Interfaces:**
- Consumes: Task 1 的治理脚本结果。
- Produces: 本地和 CI 使用同一份报告治理结果。

- [ ] **Step 1: 将报告拆分规则接入平台质量命令**

  `npm run test:platform` 必须执行 `report-governance.mjs`，并保留 `TC-DOC-GOV-001` 的结果。

- [ ] **Step 2: 将报告文件纳入 UTF-8 和可执行安全扫描**

  `run-platform-validation.mjs` 必须扫描四份报告和图片引用，拒绝绝对 Windows 路径、敏感凭据和非 UTF-8 文件。

- [ ] **Step 3: 运行聚焦验证**

  Run: `node --check scripts/platform/report-governance.mjs`

  Expected: 命令退出码为 0。

  Run: `node scripts/platform/report-governance.mjs`

  Expected: `REPORT_GOVERNANCE=TC-DOC-GOV-001:PASS`。

- [ ] **Step 4: 运行平台质量验证**

  Run: `npm run test:platform`

  Expected: `TEST_PLATFORM=PASS`，并包含 `REPORT_GOVERNANCE=TC-DOC-GOV-001:PASS`。

  Run: `node scripts/platform/run-platform-validation.mjs`

  Expected: `STATIC_PLATFORM_VALIDATION=PASS`。

- [ ] **Step 5: 检查工作区边界**

  Run: `git diff --check`；`git status --short --branch`

  Expected: 无空白错误；仅报告拆分规则相关文件发生变化；已有无关改动仍保留。
