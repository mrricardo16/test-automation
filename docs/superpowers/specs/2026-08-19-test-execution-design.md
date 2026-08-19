# TEST-EXECUTION Skill 设计规格

## 目标

在现有 `DEV-TEST-HANDOFF` 之后增加一个测试侧黑盒执行 Skill：

```text
Test Handoff Pack
→ Coverage Matrix
→ TestCase
→ TestCase Review Gate
→ WEB_UI / API / BOTH / MANUAL
→ 真实执行
→ Evidence
→ Coverage Reconciliation
→ Regression Report
→ Test Feedback Pack
```

本 Skill 的正常工作不依赖产品源码，默认只读取开发侧生成的 `test-handoff/` 和指定 Runtime。创建阶段不对真实业务系统执行测试。

## 职责边界

| 组件 | 职责 | 权限边界 |
|---|---|---|
| `DEV-TEST-HANDOFF` | 分析源码并定义 Expected Design Baseline | 源码只读；生成 As-Built 和 Handoff |
| `TEST-EXECUTION` | 验证 Actual Runtime 并形成测试反馈 | Handoff 只读；不读源码作为正常依赖；不改产品和 Expected |
| 下游开发流程 | 修复产品或更新设计基线 | 收到 Test Feedback 后重新交接 |

## Skill 目录

```text
skills/test-execution/
├── SKILL.md
├── agents/openai.yaml
├── references/
├── templates/
└── scripts/
```

`SKILL.md` 保持入口精简，只包含触发条件、边界、核心工作流和资源路由。具体合同、状态、Evidence、安全、执行和反馈格式分别放入 references；可复用输出结构放入 templates；确定性检查放入 scripts。

## 输入合同

必需输入：

```text
handoff_root  # DEV-TEST-HANDOFF 的 test-handoff 输出，READ-ONLY
runtime      # Web URL、API Base URL、浏览器和环境信息
output_root  # test-cases、reports、artifacts、test-feedback 输出根目录
```

可选输入：

```text
credentials
existing_test_cases
existing_reports
existing_automation
scope
priority_filter
test_layer_filter
browser
environment_notes
```

凭据只允许来自环境变量、被忽略的本地配置或安全凭据存储，不得进入 Git、TestCase、报告、截图文件名、JSON、Trace 摘要或 Evidence。

## 核心规则

1. 首先读取 `00-TEST-WORKFLOW.md`，再根据其引用读取完整 Handoff 合同；缺失内容记录 `HANDOFF_INCOMPLETE`，按影响局部阻塞或整体 `BLOCKED`。
2. Handoff 是批准的 Expected Baseline。Runtime 与基线不一致时记录 `FAIL` 或 `DESIGN_RUNTIME_MISMATCH`，不得修改 Expected 以制造 PASS。
3. Coverage 必须覆盖 Module、Feature、Rule、Flow、Validation、Permission、State、API、Error Path、Data Consistency 和 UI Observable Result，而不是只统计页面打开数量。
4. 所有正式测试遵循 `Handoff → Coverage → TestCase → Automation`；TestCase 使用稳定 `TC-WEB-*`、`TC-API-*`、`TC-MANUAL-*` ID，并保留 DEV Handoff 的 Module/Feature/Rule/Flow/API/Validation/State ID。
5. TestCase Review Gate 不通过时不得执行；Expected、前置条件、测试数据或安全清理不明确时分别记录阻塞原因。
6. 测试层支持 `WEB_UI`、`API`、`BOTH`、`MANUAL`。Web 默认 Playwright，优先复用现有 Harness 和 Evidence Helper；API 优先复用现有 HTTP/API Harness。
7. Locator 优先 role、label、placeholder、既有 test id、稳定文本、稳定 id/name、稳定 CSS；运行时重新验证，弱 Locator 记录 `PRODUCT_CHANGE_RECOMMENDED`，不修改产品代码添加 test id。
8. 只有真实执行后才能使用 `PASS` 或 `FAIL`。状态统一为 `PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`NOT_APPLICABLE`、`SKIPPED`；`PRODUCT_CHANGE_RECOMMENDED` 是诊断，不是状态。
9. FAIL/ERROR 保留 Screenshot、Current URL、Failed Step、Expected、Actual、错误信息，并按可用性保留 Trace、Console、PageError、Network；Evidence 脱敏。
10. 测试数据优先使用 `AUTO_TEST_<FEATURE>_<RunId>`；自动清理只允许删除本轮创建的数据。破坏性操作没有安全目标、环境或清理方案时使用 `BLOCKED_TEST_DATA`。
11. Cleanup 或 Evidence Capture 失败不得覆盖原始 Case 结果；例如 `Case=FAIL` 且 `Cleanup=ERROR`。
12. 执行后区分 `COVERED_PASS`、`COVERED_FAIL`、`COVERED_ERROR`、`BLOCKED`、`MANUAL_PENDING`、`NOT_APPLICABLE`、`NOT_COVERED`。P0 未覆盖时不得宣布回归完成。
13. 输出 Regression Report、Coverage Report、Defect List、Design Runtime Mismatch、Manual Boundaries、Execution Summary、Evidence Index 和 Test Feedback Pack；不生成 Word、不修复产品、不删除历史 TestCase。

## 支持资源

### References

- `black-box-contract.md`：输入、Expected Baseline、状态和职责边界。
- `coverage-and-traceability.md`：Coverage Matrix、ID 保留和追踪闭环。
- `execution-rules.md`：TestCase-first、测试层、Playwright/API/Manual、增量执行和 Locator。
- `evidence-rules.md`：Evidence Bundle、失败证据、脱敏和 Evidence 状态。
- `test-data-and-cleanup.md`：Setup、Cleanup、破坏性操作和进程所有权。
- `feedback-contract.md`：报告、Coverage Reconciliation、Mismatch 和 Feedback Pack。
- `runtime-health-and-errors.md`：Runtime Health Check、环境问题和 ERROR 分类。
- `security-sanitization.md`：凭据、Network、个人数据和 Handoff 保护。

### Templates

提供 Coverage Matrix、Web/API/Manual TestCase、Regression、Coverage、Defect、Mismatch、Execution Summary、Manual Boundaries、Evidence Index 和 Environment Issues 模板。

### Scripts

- `self_test.py`：使用最小 Mock Handoff 和 Fake Runtime 验证 Skill 关键合同，不访问真实业务项目。
- `validate_contract.py`：检查生成输出的必需文件、状态、ID 追踪、敏感信息和 Feedback 结构。

## Baseline pressure test

在写 Skill 前使用独立临时场景记录无 Skill 基线，至少覆盖：

1. Runtime 与 Expected 冲突时把 Expected 改成 Runtime。
2. Locator 失败时把自动化错误直接判成产品 FAIL。
3. 缺少安全数据时删除未知数据或强行执行破坏性操作。
4. 先写 Playwright、后补 TestCase，或静默删除旧 TestCase。
5. 没有真实执行时根据 Handoff 或脚本内容宣布 PASS。

实现后使用同样场景验证 Skill 是否保持黑盒、TestCase-first、Evidence、状态和安全边界。

## 验收标准

- Codex 可识别 `test-execution`，并默认按黑盒模式工作。
- 可消费现有 `00-TEST-WORKFLOW.md` 和 Handoff ID/Confidence 合同。
- 能指导 Coverage Matrix、TestCase、Review Gate、WEB_UI/API/BOTH/MANUAL、Evidence、Coverage Gate 和 Feedback Pack。
- 不要求源码、不修改 Handoff Expected、不修改产品、不自动修 Bug、不生成 Word、不执行真实业务 Acceptance Run。
- `self_test.py`、`validate_contract.py` 和官方 `quick_validate.py` 通过。
- 所有新增 Markdown、YAML、Python 文件保持 UTF-8；无敏感信息；只提交本 Skill 与本设计规格。
