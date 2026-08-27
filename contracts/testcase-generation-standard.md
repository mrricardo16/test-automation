# TestCase Generation Standard V2

本文件是 TestCase 生成的统一主干标准，适用于 Black-box、White-box、Web、API、Desktop 和 Manual。执行技能只引用本标准，不复制或改写其规则。Expected 的来源和访问权限仍由各执行技能自己的边界决定。

设计质量细则见 [TestCase Design Quality Standard](testcase-design-quality-standard.md)。生成器必须先完成设计质量审计，再将候选物化为可执行 TestCase；不得因为 Schema Valid 就跳过粒度、测试数据、矩阵、Expected 可判定性和 Gap 评估。

通用黑盒测试的正式扩展规范见 [Generic Black-box TestCase Generation Standard](generic-blackbox-testcase-generation-standard.md)。对于黑盒 Web/CRUD 设计，必须先应用该规范的 `DESIGN_DEFAULT`、`AUTHORITATIVE_RULE`、`PENDING_AUTHORITY` 分层、能力适用性、权限适用性和原子拆分规则；只有会改变 Primary Assertion 的真实业务歧义才可生成 Pending。通用报告结构和 Typora 样式分别见 [Generic Black-box Test Report Template](../docs/generic-blackbox-test-report-template.md) 与 [Generic Typora Report Style](../docs/generic-typora-report.css)。

## 三层模型

1. `ScenarioSuite`：聚合业务生命周期、风险、设计模型、TestCase 和 ExpectationGap。它不是执行单位，不包含 `ExecutionStatus`。
2. `TestCase`：可独立执行、独立判定、独立取证和独立报告的最小正式单位，`CaseKind` 为 `ATOMIC` 或 `COMPOSITE`。
3. `ExpectationGap`：记录权威来源未定义的 Expected。它是 TestCase 的治理附属物，不替代 TestCase；Runtime Observation 不得用于补写 Expected。

## 生成流程

1. 分析需求、设计或批准基线，识别对象、规则、角色、状态、关系和副作用。
2. 评估风险、数据归属、可逆性、清理能力和人工交互。
3. 按需建立等价类、边界值、决策表、状态模型、权限矩阵、CRUD 生命周期矩阵、关系完整性模型和会话模型。
4. 生成覆盖候选；只要场景和测试目标成立，先物化 TestCase，再按权威完整性门禁挂接 `ExpectationGap`。
5. 将可独立执行、判定和取证的目标拆成独立 TestCaseId；等价数据优先参数化。
6. 仅当跨步骤状态本身是主要业务目标时生成 `COMPOSITE`。
7. 聚合 `ScenarioSuite` 并执行 Review Gate。

## Black-box Standard Rebuild

黑盒标准重建只允许读取用户提供的规范、需求、批准设计/基线和测试仓库内既有 TestCase；不得读取产品源码、Runtime、DLL、PDB、数据库当前行为，也不得用历史 Actual 或 Runtime Observation 反推 Expected。Frozen Handoff 可以作为既有 `ExpectedAuthority` 标识被引用，但重建过程不得改写其内容。

生成器必须先建立以下四级 inventory，并为每条 BusinessRule 建立至少一个 Scenario：

`ModuleInventory → FeatureInventory → OperationInventory → BusinessRuleInventory → Scenario → TestCase`

每个 Scenario 必须物化为唯一 TestCase，且 `ExpectedResult` 非空。Expected 分为：

- `EXPECTED_CONFIRMED`：业务结果已由批准权威明确；必须记录 `ExpectedSourceRef` 和 `ExpectedAuthority`。
- `EXPECTED_PENDING_AUTHORITY`：权威业务结果仍缺失；`ExpectedResult` 只能明确描述“待确认的 Expected 合同”，必须标记 `ExpectedResultSemantics=AUTHORITY_GAP_DESCRIPTION_NOT_BUSINESS_ORACLE`、`AutomationEligibility=NOT_EXECUTABLE`、`ExpectationGapId` 和 `GapClassification`，不得作为 PASS/FAIL oracle。

生成器必须区分：

- `EXPECTED_EXTRACTION_MISS`：权威输入已经定义 Expected，但抽取或映射遗漏；这是生成缺陷，Authority Completeness Gate 不得完成。
- `TRUE_GAP`：全部允许的权威输入都没有定义 Expected；保留 pending TestCase 和 ExpectationGap，等待产品负责人、需求/设计批准人或批准基线补充。

Authority Completeness Gate 至少核对所有 Scenario 均有 TestCase、ExpectedResult 非空、Expected 状态受控、来源/权威可追踪、Extraction Miss 为零、True Gap 全量登记、pending 不可执行、历史 Expected/执行状态不变。存在 True Gap 时 Gate 使用 `LIMITED_PENDING_AUTHORITY`，不能宣称完整 PASS。

## 必做设计评估

每次重建必须显式评估并记录测试用例引用或缺口：等价类、边界值、判定表、状态迁移、CRUD 生命周期、查询矩阵、权限、关系、负向/错误、恢复、幂等、并发、后置条件和风险模型。技术评估不是 TestCase；被识别为 Scenario 的候选仍必须物化为 TestCase。

## 八类机器产物

标准重建必须生成且只生成以下八类 UTF-8 JSON 机器产物（文件名可按仓库规则本地化，但语义不得减少）：

1. `BLACKBOX_MODULE_INVENTORY`：Module/Feature/Operation 清单。
2. `BLACKBOX_BUSINESS_RULE_INVENTORY`：业务规则及其 TestCase 反向映射。
3. `BLACKBOX_TEST_DESIGN_MODEL`：适用性与设计技术覆盖评估。
4. `BLACKBOX_FINE_GRAINED_TESTCASES`：所有确认和 pending 的完整 TestCase。
5. `BLACKBOX_EXPECTED_TRACEABILITY`：BusinessRule→TestCase、TestCase→ExpectedSource、Gap→TestCase 双向追踪。
6. `BLACKBOX_EXPECTATION_GAPS`：完整 Gap 字段、True Gap 与 Extraction Miss。
7. `BLACKBOX_AUTHORITY_COVERAGE_REPORT`：AuthorityDocument、Section、Feature、BusinessRulesDetected、BusinessRulesMappedToTestCases、ExpectedRulesMapped、UnmappedAuthoritativeRules、TrueMissingRules。
8. `BLACKBOX_GENERATION_QUALITY_REPORT`：最终统计字段、质量检查、禁止输入和状态门禁。

机器产物属于设计产物，不得写入 `ExecutionStatus=PASS/FAIL/ERROR/BLOCKED`，也不得触发业务测试。最终报告可以引用 pending TestCase，但不得改写历史 TestCase、历史 Expected、历史执行状态或 Frozen Handoff。

## 模块优先的信息架构

报告生成必须先建立 `ModuleInventory`，再建立 `FeatureInventory`、`OperationInventory` 和 `ScenarioInventory`，最后生成 TestCase 目录：

`ModuleInventory → FeatureInventory → OperationInventory → ScenarioInventory → TestCase Design → Coverage Candidates → TestCases`

- 主目录固定使用 `MODULE → FEATURE → SCENARIO`，状态字段不参与分类或排序。
- `Operation` 只能使用 `QUERY`、`CREATE`、`UPDATE`、`DELETE`、`VALIDATION`、`STATE_TRANSITION`、`PERMISSION`、`RELATIONSHIP`、`IMPORT`、`EXPORT`、`DOWNLOAD`、`UPLOAD`、`AUTHENTICATION`、`SESSION`、`COMPOSITE_LIFECYCLE`、`VISUAL`、`OTHER`。
- `ScenarioGroup` 只能使用 `HAPPY_PATH`、`CONDITION`、`VALIDATION`、`NEGATIVE`、`BOUNDARY`、`EMPTY_STATE`、`DUPLICATE`、`PERMISSION`、`STATE`、`RELATIONSHIP`、`POST_CONDITION`、`ERROR_HANDLING`、`RECOVERY`、`IDEMPOTENCY`、`COMPOSITE_FLOW`、`MANUAL_BOUNDARY`。
- 每条 V2 TestCase 必须记录 `ModuleName`、`FeatureName`、`Operation`、`ScenarioGroup` 和五级 `PresentationOrder`。TestCaseId 仅作身份和追踪，不承担目录顺序。
- 同一功能的查询、空结果、模糊/精确、非法筛选、边界、重复和错误处理用例保持相邻；状态不同不能拆散同一功能。
- 汇总、执行统计、问题反馈和人工边界只引用 TestCaseId，不复制完整用例，避免同一用例在主报告重复出现。

## Atomic 与 Composite

`ATOMIC` 只允许一个 `Objective` 和一个 `PrimaryAssertion`。查询、输入校验、权限、状态、错误分支若可独立执行、判定和取证，必须分别生成 TestCaseId。支持主要断言的观察或不变量不机械拆分。

`COMPOSITE` 只允许一个主要业务目标，字段和约束见 [Composite TestCase Standard](composite-testcase-standard.md)。Create→Read、Delete→Read、Delete→Recreate、Delete→Update、Delete→Delete、Disable→Update、权限变化后的刷新/重新登录，以及父子引用完整性都是候选；权威 Expected 未定义时仍生成 `EXPECTED_PENDING_AUTHORITY` TestCase，但必须 `NOT_EXECUTABLE`。

## Test design models

`DesignModels` 可使用：`EQUIVALENCE_PARTITIONING`、`BOUNDARY_VALUE`、`DECISION_TABLE`、`STATE_MODEL`、`PERMISSION_MATRIX`、`CRUD_LIFECYCLE_MATRIX`、`RELATION_INTEGRITY_MODEL`、`SESSION_MODEL` 和 `ERROR_MODEL`。模型用于证明覆盖来源，不替代 Expected、步骤或断言。

## ExpectationGap protection

- Runtime Observation 永远只进入 Actual/Observation Evidence。
- `ExpectedBasis=UNKNOWN` 的 V2 候选必须链接 `ExpectationGapRefs`，使用 `AutomationEligibility=NOT_EXECUTABLE`，并且 Review Gate 不得 PASS；黑盒重建中的 pending TestCase 仍必须有非空 `ExpectedResult`，但只能描述待确认的业务语义。
- 解决 Gap 时必须记录批准来源和决议；不得将“当前运行时如此”作为 Expected 来源。
- 未解决 Gap 不得生成 PASS/FAIL，也不得进入 AUTO 或人工执行队列。

创建 `TRUE_GAP` 前必须完成 `EXPECTED_AUTHORITY_COMPLETENESS_GATE`，至少记录 `AuthoritySourcesAvailable`、`AuthoritySourcesSearched`、`RelevantSectionsFound`、`BusinessRulesExtracted`、`ExpectedCandidateFound`、`ExpectedSourceRef` 和 `SearchCompleteness`。只有 `SearchCompleteness=COMPLETE` 且 `ExpectedCandidateFound=No` 才能建立 `TRUE_GAP`。若权威资料已有 Expected 而生成器未提取，必须标记 `EXPECTED_EXTRACTION_MISSED` / `TESTCASE_GENERATION_DEFECT`，不得用业务 Gap 掩盖。

黑盒细粒度生成必须评估适用的等价类、边界、判定表、状态迁移、CRUD 生命周期、Query Matrix、权限、关系完整性、会话、负向/错误、恢复、幂等、并发、后置条件和风险模型。查询至少评估默认、精确、模糊、单条件、组合、无结果、清空/重置、分页/排序、时间边界、非法格式和权限差异；CRUD 至少评估 Create→Read、Create→Update→Read、Delete→Read、Delete→Update、Delete→Delete、Delete→Recreate、Disable→Update、Disable→Operation。是否适用必须记录为 `APPLICABLE`、`NOT_APPLICABLE` 或 `UNKNOWN`，不得机械笛卡尔积。

每个 ATOMIC TestCase 只能有一个主要业务规则和一个 `PrimaryAssertion`。重复用户名、密码过短、空字段、非法字符、显示名超长、外键缺失等不同失败原因必须分别建用例；只有相同规则、相同步骤和相同 Expected 逻辑才允许参数化。已知边界生成 `N-1/N/N+1/M-1/M/M+1`；未知边界生成待确认 TestCase，不得猜测数值。每条用例必须保留字段、值/生成规则、类别、来源、归属、唯一性、一次性和敏感性等 TestData Design。

## Unattended automation routing

`AUTO_ALLOWED` 必须同时满足：`LifecycleStatus=ACTIVE`、`ReviewGateStatus=PASS`、风险和副作用已知、操作可逆或无需清理、数据为隔离自有或明确批准、安全清理可验证、无人工交互、无未解决 ExpectationGap。

- `AUTO_ALLOWED`：无人值守执行；Runner 不等待确认、验证码、选择文件、人工观察或 MANUAL 队列。
- `MANUAL_REQUIRED`：人工交互、共享/未知数据、高风险、不可逆或无法可靠自动判定。
- `NOT_EXECUTABLE`：前置条件、环境或安全数据缺失，或 Expected 未获批准；此时必须关联 `ExpectationGapRefs`，不得进入执行队列。

V2 不使用 `AUTO_PARTIAL` 表示“自动执行中暂停等人”。历史 `AUTO_PARTIAL` 保持可读，但新用例必须拆成独立 AUTO 与 MANUAL TestCase，并由 `ScenarioSuite` 聚合。

`AutomationEligibility` 不得使用 `AUTO_DESIGN`。设计候选和是否激活必须通过独立的 `DesignState`、`CandidateState`、`ActivationStatus` 和 `ActivationDecision` 表达。Review PASS 表示设计通过；它不要求在 AUTO 运行期间再次请求人工确认。`HumanConfirmationDuringAutoRun` 固定为 `FORBIDDEN`。

## Review Gate 与兼容性

Review Gate 至少检查：唯一 TestCaseId、单一 Objective、单一 PrimaryAssertion、ExpectedBasis、Expected、设计模型覆盖、初始状态、风险、数据归属、交互模式、可逆性、清理与验证、证据要求和执行层。含多个独立目标的 Mega Case 必须拆分。新 Case 的 `AutomationEligibility`、`SideEffects`、`SideEffectScope`、`Reversibility` 和 `RiskLevel` 必须使用本标准受控值。

历史 TestCase 不要求补写 `CaseKind` 或 V2 字段，也不批量改写。新建或实质重设计的 TestCase 必须声明 `CaseKind` 并满足 V2 条件字段。`LegacyFieldAdapter` 继续负责旧字段读取，不得用兼容逻辑绕过 V2 Review Gate。
