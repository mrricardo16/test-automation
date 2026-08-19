# WHITEBOX-TEST-EXECUTION Skill 设计规格

## 1. 目标

在现有自动化测试仓库中新增第三个独立 Codex Skill：`whitebox-test-execution`。它面向拥有产品源码读取权限的开发人员或测试工程师，从前端和/或后端源码建立白盒测试基线，设计可追踪的 Coverage Matrix 和正式 TestCase，选择合适的测试层，生成测试工具并在明确授权和运行条件满足时执行测试，最终输出白盒回归结果、证据、缺陷和根因分析。

本次只创建 Skill、其文档资源、自测和契约校验；不执行真实业务 Acceptance Run，不读取真实业务源码，不访问真实 Web/API/桌面运行时，不生成真实项目测试产物。

## 2. 三个 Skill 的职责边界

| Skill | 输入 | 责任 | 输出 | 是否执行测试 |
|---|---|---|---|---|
| `dev-test-handoff` | 前端/后端源码 | 源码分析、As-Built、设计基线、黑盒 Handoff | As-Built + Test Handoff | No |
| `test-execution` | Test Handoff + Runtime | 黑盒 Coverage、TestCase、Web/API/Manual 执行 | 黑盒测试反馈 | Yes |
| `whitebox-test-execution` | 前端/后端源码 + 可选 Runtime | 源码驱动的 Baseline、Coverage、TestCase、测试层选择、执行和失败源码诊断 | White-box Regression、Evidence、Defect、Root Cause | Yes |

新 Skill 不调用另外两个 Skill 来伪装白盒能力，也不要求存在 `test-handoff/`。已有 As-Built 或 Handoff 可以作为参考输入，但不是前置条件。

## 3. 输入合同

必需输入：

```text
frontend_source   # 可选路径或路径列表
backend_source    # 可选路径或路径列表
output_root       # 必需，测试仓库内输出目录
```

`frontend_source` 与 `backend_source` 至少提供一侧。缺失侧记录为 `NOT_PROVIDED`，不得假装拥有完整系统覆盖。

可选输入：`runtime`、`existing_design_docs`、`existing_test_cases`、`existing_tests`、`existing_reports`、`test_data`、`credentials`、`scope`、`priority_filter`、`test_layer_filter`、`environment_notes`、`exclude_paths`，以及 `git diff`、changed files 或 commit range。

源码允许读取但默认只读。测试适配器、Fixture、Mock、Fake、Stub、Harness、Playwright Spec、API Test、报告和证据只能写入 `E:\automated-testing`。不得把测试文件写进真实业务仓库，不得通过 `ProjectReference` 令只读源码项目产生 `bin`、`obj` 或 generated 输出。

## 4. 核心工作流

Skill 固定支持以下 14 个阶段：

1. Source Intake
2. White-box Analysis
3. Test Baseline
4. Coverage Analysis
5. TestCase Design
6. TestCase Review Gate
7. Test Layer Selection
8. Harness Construction
9. Runtime Health Check
10. Test Execution
11. Evidence Collection
12. Failure Diagnosis
13. Coverage Reconciliation
14. Regression Reporting

若输入、Expected、测试数据、运行环境或源码语义不足，记录 `UNKNOWN`、`UNKNOWN_EXPECTATION`、`BLOCKED` 或 `PRODUCT_CHANGE_RECOMMENDED`，不得猜测业务含义或伪造 PASS/FAIL。

## 5. Source Intake 与白盒分析

第一遍只建立 Source Inventory，识别所有 workspace、solution、csproj、package、app、service、module、入口、技术栈和排除路径。不得一开始全文读取大型源码。

后续按以下扫描通道逐步分析：

1. Structure：项目、包、入口和外部边界。
2. Entry/API：前端 Route、菜单、Controller、Handler、API 和权限入口。
3. Module/Feature：模块、页面、Service、DTO、Entity、Repository 和依赖。
4. Behavior：业务规则、异常分支、状态、校验、权限、数据约束和错误行为。
5. Frontend ↔ Backend：页面、API 客户端、HTTP Endpoint、Service、数据或外部依赖调用链。
6. Testability：可替换依赖、可观察结果、测试 Double 边界、只读运行时和禁止改动项。
7. Completeness：Coverage、Unknown、风险、敏感信息和来源引用。

多 Solution、多 App、多服务必须保留归属边界。单侧源码只产生对应侧事实；前后端没有匹配关系时记录 `UNMATCHED`，不直接标记为缺陷。

## 6. 事实、Stable ID 与 White-box Baseline

沿用现有事实可信度：`CONFIRMED_FROM_CODE`、`CONFIRMED_FROM_RUNTIME`、`INFERRED`、`UNKNOWN`。源码存在不代表运行时行为已确认；源码语义不明的字面量或状态值必须保持 `UNKNOWN`。

沿用稳定 ID：`MOD-*`、`FEAT-*`、`RULE-*`、`FLOW-*`、`API-*`、`VALID-*`、`STATE-*`，并将 TestCase 使用的 `TC-*` 贯穿源码证据、Coverage、测试代码、执行结果、Evidence 和报告。

White-box Test Baseline 面向测试决策，不复制完整 As-Built。至少记录模块、Feature、Route、API、业务规则、输入校验、状态、权限、数据依赖、外部依赖、调用链、错误路径、Testability 和风险，并附 `SourceEvidence`：相对源码路径、symbol、class、method、route 或 branch。不得复制源码正文、敏感值或机器绝对路径。

## 7. Coverage Matrix 与测试层选择

Coverage Matrix 至少包含：

```text
ModuleId / FeatureId / RuleId / FlowId / ApiId / ValidationId / StateId
Source Risk / Business Risk / Priority
Unit / Integration / API / Web UI / Desktop Headless / Desktop E2E / Manual
TestCaseId / Execution Status
```

Coverage 必须同时区分 Business、Rule、Flow、Validation、State、API、Permission、Automation、Execution，以及可选的 Code Coverage。代码行、方法或分支 Coverage 只能作为补充信号，不能替代业务覆盖。

在能够可靠验证同一行为时，优先选择成本更低、稳定性更高的层：`UNIT` → `INTEGRATION` → `API` → `DESKTOP_HEADLESS`/`WEB_UI`/`DESKTOP_E2E` → `MANUAL`。此顺序不是绝对规则；关键端到端流程仍需保留代表性 UI/E2E。已由 Unit 完整覆盖的低价值边界不得在每一层重复生成大量相同 Case。

支持层：`UNIT`、`INTEGRATION`、`API`、`WEB_UI`、`DESKTOP_HEADLESS`、`DESKTOP_E2E`、`MANUAL`。不适用时使用 `NOT_APPLICABLE`。

## 8. TestCase-first 与 Review Gate

固定顺序为：

```text
White-box Test Baseline
→ Coverage Matrix
→ TestCase
→ TestCase Review Gate
→ Harness / Automation
→ Execution
```

每个正式 TestCase 至少包含：`TestCaseId`、`ModuleId`、`FeatureId`、`Title`、`Priority`、`TestLayer`、`Covers`、`SourceEvidence`、`Preconditions`、`TestData`、`Steps`、`ExpectedResult`、`AutomationType`、`EvidenceRequirement`、`Cleanup`、`Status`、`Limitations`。

执行前 Review Gate 必须检查 Expected 明确、源码证据、覆盖映射、测试层合理、测试数据安全、Cleanup、Destructive Operation、Runtime 前置和 Evidence 要求。未通过则阻塞，不先写测试代码再补 TestCase。

## 9. Harness、运行和安全

优先复用仓库已有 TestCase、Harness、Fixture、Evidence Helper、Playwright、API 和 Avalonia Headless/Appium/FlaUI 能力，不重新创建平行框架。Web 默认 Playwright，使用真实用户交互、语义定位和条件等待；桌面测试遵循已有 Avalonia 版本与 Headless/Appium 边界。

正式执行前做 Runtime Health Check：Web、API、测试 DB/Double、Runtime DLL、桌面程序、凭据、测试数据、Browser/Desktop Session 和必需服务。环境或 Harness 失败为 `BLOCKED` 或 `ERROR`，不判定为产品 FAIL。

测试数据使用 `AUTO_TEST_<FEATURE>_<RunId>`。只有当前测试创建的数据可自动清理。Delete、Disable、Reset、Clear、Permission Change 和不可逆状态必须通过 Safe Environment、Safe Target、Test-created、Cleanup Known 四项门禁，否则使用 `BLOCKED_TEST_DATA`。禁止对生产或现场数据库、设备和外部系统执行破坏性测试。

源码默认只读。禁止为测试修改业务代码、AutomationId、data-testid、DI、测试 Hook、InternalsVisibleTo、访问修饰符、配置、API、数据库或 Mock 开关。不可测试结构只记录 `PRODUCT_CHANGE_RECOMMENDED`。

## 10. 执行状态与证据

最终状态与现有仓库统一：`PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`NOT_APPLICABLE`、`SKIPPED`。只有真实执行并有证据才允许 PASS/FAIL。源码分析“看起来正确”不能覆盖 Runtime FAIL。

Web 失败或错误至少保留 Screenshot、URL、Failed Step、Expected、Actual、Trace（可用时）、Console 和 Network 相关证据。Unit/Integration 至少保留 TestCaseId、Test Layer、Command、Test Method、Expected、Actual、Stack/Error、Duration、Related Source Symbol。API 至少保留 Method、Path、Status、Expected、Actual、Duration 和 Sanitized Response。

所有 Password、Token、Cookie、Authorization、ConnectionString、Secret、客户数据、私有路径和敏感 Network 内容必须净化。Evidence Index 按 TestCaseId 映射状态和所有证据。

## 11. 失败诊断与根因置信度

白盒 Skill 在 Case FAIL 后允许回读相关源码，追踪 Controller/Handler → Service → Validation → Data/External Dependency，并将 Runtime Evidence 与 SourceEvidence 分开记录。根因只能标记为：

- `ROOT_CAUSE_CONFIRMED`：运行时证据与源码路径直接闭合。
- `ROOT_CAUSE_PROBABLE`：证据支持但仍有未验证分支或外部依赖。
- `ROOT_CAUSE_UNKNOWN`：证据不足，不能确认。

失败诊断只输出影响范围、可能根因和开发调查建议，不修改产品、不提交产品修复、不因修复后重新运行而在本次 Skill 创建中宣布 PASS。

## 12. Reconciliation、回归与增量模式

执行后比较 Planned、Implemented、Executed，不把“写了 TestCase”直接视为 Covered。沿用 Coverage 状态：`COVERED_PASS`、`COVERED_FAIL`、`COVERED_ERROR`、`BLOCKED`、`MANUAL_PENDING`、`NOT_APPLICABLE`、`NOT_COVERED`。失败仍是 `COVERED_FAIL`。P0 `NOT_COVERED` 时不得宣布 White-box Regression Complete。

支持：`FULL_WHITEBOX_REGRESSION`、`MODULE_REGRESSION`、`P0_ONLY`、`FAILED_RERUN`、`SOURCE_CHANGE_IMPACT`、`SINGLE_TESTCASE`。Source Change Impact 将 changed source/commit/diff 映射到受影响 Module、Rule/Flow/API、TestCase 和推荐增量范围，但不能替代首次完整 Baseline。

## 13. 输出合同

Skill 提供以下模板：

- `whitebox-baseline.md`
- `coverage-matrix.md`
- `unit-testcase.md`
- `integration-testcase.md`
- `api-testcase.md`
- `web-testcase.md`
- `desktop-testcase.md`
- `manual-testcase.md`
- `whitebox-regression-report.md`
- `coverage-report.md`
- `defect-list.md`
- `root-cause-analysis.md`
- `execution-summary.md`
- `evidence-index.md`
- `environment-issues.md`
- `manual-boundaries.md`

其中回归报告必须覆盖 Scope、Source Baseline、Runtime、RunId、模块、各测试层数量、状态总数、Coverage、Critical Failure、Overall Result；缺陷列表必须含 SourceEvidence 和根因置信度；根因报告必须含 Failure、Runtime Evidence、Related Source、Call Chain、Potential Cause、Confidence、Affected Features 和 Recommended Development Investigation。

## 14. Skill 目录与验证

计划目录为 `skills/whitebox-test-execution/`，包含 `SKILL.md`、`agents/openai.yaml`、`references/`、`templates/`、`scripts/self_test.py` 和 `scripts/validate_contract.py`。Skill 入口只保留触发条件、边界、工作流和资源路由；详细合同放入 references，输出结构放入 templates，确定性检查放入 scripts。

Self-Test 使用 Mock Source + Fake Runtime，验证 Source Intake、Rule extraction、Baseline、Coverage、TestCase、Layer Selection、Review Gate、Execution Status、Evidence、Failure Diagnosis、Coverage Reconciliation 和报告合同。不得访问真实业务路径、真实 localhost、真实 API、真实截图、浏览器 Trace 或运行时。

验证顺序：

1. 无 Skill 的临时 Baseline Pressure Test，记录跳过 TestCase、全 UI、源码即 PASS、修改产品、漏分支和漏 Coverage Gate 等失败倾向。
2. 创建 Skill 后用同一场景做 GREEN 验证。
3. `validate_contract.py`。
4. 官方 `quick_validate.py`。
5. UTF-8、敏感信息、源码路径、真实 Artifact 和 `git diff --check` 检查。

## 15. README 同步

仅对 `README.md` 做小范围同步，增加三 Skill 职责关系和两种模式：

```text
Mode A：Source → DEV-TEST-HANDOFF → Test Handoff → TEST-EXECUTION
Mode B：Source → WHITEBOX-TEST-EXECUTION → White-box Regression
```

不重写 README，不把仓库描述为真实项目白盒回归已完成。

## 16. 明确不在本次范围内

- 不修改 `dev-test-handoff`。
- 不修改 `test-execution`。
- 不读取真实业务源码、真实运行时 DLL 或其他现场项目资源。
- 不执行真实 Web、API、Playwright、Avalonia、Appium 或桌面 Acceptance Run。
- 不生成当前项目 Coverage、TestCase、真实回归报告、真实截图或 Trace。
- 不修复产品 Bug，不提交产品源代码，不推送远端，除非获得当前任务的明确授权。

## 17. 验收口径

完成后必须能证明：Skill 可被 Codex 识别；不要求 Handoff；支持前端、后端、单侧源码、多 Solution；生成 White-box Baseline 和 Coverage Matrix；源码驱动业务规则、Validation、State、Permission、Error Path；TestCase-first 和 Review Gate；支持七个测试层、Evidence、Root Cause Confidence、Source Change Impact、增量模式、数据清理和 Destructive Gate；不修改产品；真实执行才允许 PASS/FAIL；与现有 Stable ID、Status、Evidence 体系兼容；README 仅小范围同步；本次未执行真实业务测试。
