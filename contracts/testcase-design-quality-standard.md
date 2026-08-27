# TestCase Design Quality Standard

本标准定义 TestCase 设计质量，不替代 [TestCase Generation Standard V2](testcase-generation-standard.md) 和执行状态契约。它适用于 Black-box、White-box、Web、API、Desktop 和 Manual；本轮 RSSComposer 仅做设计审计，不执行 Runtime。

## 1. 用例粒度与独立性

- ATOMIC 只验证一个主要业务规则、一个 `PrimaryAssertion`，可有多个 `SupportingAssertions`。
- 两个失败需要不同根因定位、不同回归范围或不同 Expected 时，必须拆成不同 TestCaseId。
- 同一业务规则、相同步骤和相同 Expected 逻辑才允许参数化；不同规则不得通过参数化合并。
- TestCase 默认独立，不隐式依赖另一条用例的执行顺序；共享数据使用 Fixture，跨步骤状态关系才使用 COMPOSITE。

## 2. 测试数据设计

V2 TestCase 必须记录 `TestDataDesign`：字段、数据类别、关键值、来源、归属、是否唯一、是否一次性、是否敏感。受控数据类别为：

`VALID_DATA` 合法数据、`INVALID_DATA` 非法数据、`BOUNDARY_DATA` 边界数据、`EXISTING_DATA` 已存在数据、`NON_EXISTING_DATA` 不存在数据、`DUPLICATE_DATA` 重复数据、`EMPTY_DATA` 空数据、`TEST_OWNED_DATA` 测试自有数据、`DISPOSABLE_DATA` 一次性测试数据、`REFERENCE_DATA` 基准数据。

报告面向用户使用中文；真实密码、Token、Cookie 和敏感响应值永不落盘。

## 3. 等价类、边界和参数化

- 输入型 Feature 先识别有效、无效等价类，再使用 Risk、Pairwise 或 Representative Partition 选取代表用例。
- 长度、数量、日期、时间、数值、分页和文件大小边界，适用时评估 `min-1 / min / min+1 / max-1 / max / max+1`。
- 权威边界未知时建立 ExpectationGap，不猜写边界；只有 Expected 已知且有业务意义的边界才进入可执行设计。

## 4. 查询矩阵

所有 QUERY Feature 先建立 Query Test Matrix，评估默认、精确、模糊、单条件、多条件、有结果、无结果、空条件、重置、非法条件、边界、时间范围、开始等于结束、开始大于结束、超大范围、分页、切页、分页后筛选、筛选后分页、排序、刷新后条件状态和不同权限查询。适用性可以是 Applicable、Not Applicable 或 Unknown；同 Feature 的查询场景必须连续展示。

## 5. CRUD 生命周期与清理边界

具有 CRUD 的对象至少识别：`CREATE→READ`、`CREATE→UPDATE→READ`、`CREATE→DELETE→READ`、`DELETE→READ`、`DELETE→UPDATE`、`DELETE→DELETE AGAIN`、`DELETE→RECREATE SAME KEY`、`UPDATE→READ`、`DISABLE→UPDATE`、`DISABLE→LOGIN/OPERATION`。Expected 未知时保留 Candidate 并建立 Gap。

业务 `PostConditions` 与 `Cleanup/CleanupVerification` 必须分开。清理用户后查询不存在，只证明清理成功；若要覆盖 DELETE→QUERY 业务规则，必须另建业务 TestCase 或 Composite。

## 6. 状态、决策、权限和关系模型

- 任务、会话、启用/禁用、审批、发布和车辆等状态型 Feature 先建立 State Model，再建立 State × Operation Matrix；每个组合标记 ALLOWED、DENIED、UNKNOWN 或 NOT_APPLICABLE。
- 多条件共同决定结果时先建立 Decision Table，使用最小规则覆盖，不机械全排列。
- 权限矩阵至少区分可见、可访问、可操作、不可见、只读、无权限拒绝、已有 Session 的权限变化和重新登录后的权限变化。
- 父子对象、用户角色、任务依赖建立 Relationship Matrix，覆盖父子存在/缺失、父对象删除、解除、恢复和重复关系。

## 7. 异常恢复、幂等和优先级

异常设计还要评估失败后的残留、页面可继续性、重试、状态变化、重新进入一致性和 Session 有效性。重复提交、重复删除、重复保存、重复重发和网络重试评估幂等性；Expected 不明则建立 Gap。

Priority 与 Defect Severity 分离。P0 只用于核心冒烟、系统不可用级主链路、关键权限/安全规则和严重一致性风险；P1 用于常用功能、关键异常、主要校验、主要状态转换和权限差异；P2 用于边界、低频异常、次要 UI、兼容性和低风险恢复。

## 8. Expected 与成熟度

Expected 必须可以客观判定 PASS/FAIL，禁止“显示正常”“操作正确”“系统正常”“页面无异常”等模糊表述。每个 V2 TestCase 必须声明 `BusinessRules`、`PrimaryAssertion`、`SupportingAssertions`、`PostConditions`、`SafetyConstraints`、`DesignTechniques` 和 `DesignMaturity`。

`DesignMaturity` 取值：

- `DRAFT`：仍在设计中；
- `REVIEWABLE`：粒度、规则和 Expected 可评审；
- `EXECUTABLE`：数据、前置、后置、清理和 Expected 均明确且无适用 Gap；
- `LIMITED`：存在设计缺口，不能只凭 Schema Valid 宣称可执行。

## 9. 中文报告展示

内部 Schema 可以使用机器枚举；Markdown、HTML、Word、Excel 和 Test Report 默认使用中文标签。保留 `PASS`、`FAIL`、`ERROR`、`P0`、`P1`、`P2`、`TestCaseId`、`Trace`、`RunId`、`API`、`HTTP`、`SQL` 等行业通用英文。

报告必须分开显示：当前执行资格、自动化方式、最近执行结果、覆盖状态、规则缺口和证据。设计目录不是 Formal Run；从未执行的用例显示“尚未执行”或“暂无正式执行结果”，不得生成 `SKIPPED`。

## 10. 质量门禁

Validator 至少识别：`MULTIPLE_PRIMARY_BUSINESS_RULES`、`MISSING_TEST_DATA`、`VAGUE_EXPECTED_RESULT`、`MISSING_PRIMARY_ASSERTION`、`MISSING_POST_CONDITION`、`MISSING_CLEANUP_FOR_MUTATION`、`OVERBROAD_VALIDATION_CASE`、`PRIORITY_INFLATION`、`IMPLICIT_TESTCASE_DEPENDENCY`、`CATALOG_GENERATED_SKIPPED_INVALID`、`STALE_EFFECTIVE_STATE_PRESENTATION` 和 `UNTRANSLATED_MACHINE_ENUM_IN_USER_REPORT`。高质量门禁与基础 Schema 校验分开报告。

## 11. 细粒度场景生成与最终交付版式

正式生成模型固定为：

`MODULE → FEATURE → OPERATION → BUSINESS_RULE → SCENARIO → TESTCASE`

历史粗粒度 TestCase 只保留历史结果和证据；按新规则拆出的 TestCase 必须使用新的 TestCaseId，最近结果为“尚未执行”，不得继承历史 PASS。

### 11.1 原子规则

ATOMIC TestCase 只能有一个主要业务规则和一个 Primary Assertion。用户名重复、密码过短、字段为空、非法字符和长度边界属于不同规则，除非业务规则、步骤和 Expected 完全相同，否则不得合并。

### 11.2 细粒度覆盖

查询功能先建立 Query Matrix，再按适用性生成默认、精确、模糊、空结果、重置、分页、排序、时间边界、非法格式和权限差异场景。新增、修改、删除、状态、关系和权限功能分别评估合法、必填、重复、边界、非法值、失败恢复、幂等、关联完整性和跨操作生命周期。

### 11.3 未知 Expected

如果权威依据没有给出边界值、状态转换、删除后可见性、唯一键复用、权限拒绝或错误合同，不得由 Runtime 或模型猜测。场景进入规则待确认/GAP，不进入正式可执行细粒度 TestCase Catalog。

### 11.4 紧凑交付报告

最终交付报告采用统一九列表格：`测试场景、TestCaseId、前置条件、测试数据、操作步骤、预期结果、状态、实际验证、图片示例`；模块和功能连续展示，完整设计按固定列拆开，截图直接放在所属 TestCase 行的最右侧。9 列主表允许超过正文宽度并通过表格自身的局部横向滚动条查看，不使用独立截图画廊或逐条纵向详情墙。

测试数据和操作步骤使用字段标签、`1、2、3` 顺序编号与宽空格分隔，步骤允许多条在一行内自然分布并由表格宽度换行，每行最多两条。预期结果按语义断言使用 `1、`、`2、`、`3、` 顺序编号，每条断言一行；操作步骤和预期结果使用字符实体换行或单元格内自然换行，不得使用 HTML Break Tag。

“测试用例设计”必须包含有业务价值的目标、前置、测试数据、编号步骤、主要预期、必要辅助验证、安全约束、业务后置和必要清理；不适用项省略，禁止“页面正常”“结果可观察”等模板废话。
