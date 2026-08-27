# 通用稳定 TestCaseId 规则

## 1. 适用范围

本规则适用于当前测试设计目录、自动化代码、测试报告、追踪关系和材料化产物。历史正式执行记录保留原有 ID，不因当前目录迁移而改写。

## 2. 当前 ID 格式

```text
TC-<FEATURE_CODE>-<OPERATION_CODE>-<SEQ>
```

格式校验：

```text
^TC-[A-Z0-9]{2,10}-[A-Z0-9]{2,12}-\d{3}$
```

- `FEATURE_CODE`：项目级唯一、注册表管理的功能码，2–10 位大写 ASCII 字符。
- `OPERATION_CODE`：可读的业务操作码，2–12 位大写 ASCII 字符；优先使用 `QUERY`、`CREATE`、`UPDATE`、`DELETE`、`BIND`、`UNBIND`、`CANCEL`、`RESEND` 等完整常用名称。
- `SEQ`：同一 `FEATURE_CODE + OPERATION_CODE` 命名空间内的三位序号，从 `001` 开始。

当前 ID 不编码测试状态、生成来源、执行方式、执行结果、历史属性或权威状态。因此不得新增 `BB`、`GEN`、`DETAIL`、`PENDING`、`REVIEW`、`AUTO`、`MANUAL`、`PASS`、`FAIL`、`ERROR`、`BLOCKED`、`READY`、`REAL`、`HISTORICAL`、`EXPECTED`、`GAP` 等状态或来源词。

## 3. 稳定性与注册表

- `FeatureCode` 必须先登记在项目 FeatureCode 注册表，不由报告渲染器临时推断。
- `TestCaseId` 必须登记在项目 TestCaseId 注册表。
- `StableCaseKey` 是内部稳定身份，与展示 ID 分离；当前采用模块、功能和用例标题的规范化组合。
- 已分配序号在新增、删除、排序或状态变化后不重排；删除的序号不得复用。
- 用例的 Pending、PASS、FAIL、ERROR、BLOCKED、MANUAL、SKIPPED 或执行资格变化不改变 `TestCaseId`。
- 拆分、合并或重新定义业务场景必须新建 StableCaseKey 并经过显式迁移评审，不得借 ID 重排掩盖语义变化。

## 4. 历史兼容

历史正式执行 ID 允许作为独立兼容格式，例如：

```text
TC-BB-REAL-001-A
```

历史 ID 只在历史目录、历史运行、历史证据和历史追踪资产中保留。历史 ID 不得进入当前正式 Catalog 的展示表，也不得被当前 ID 注册表重新分配。

## 5. 迁移要求

每次现有目录迁移必须同时生成：

1. 旧 ID → 新 ID 迁移映射；
2. 迁移前后数量、Scenario 集合、Expected、Gap、执行资格和执行状态对账；
3. 当前引用更新记录；
4. 历史 ID 与历史证据未改写的校验结果。

迁移只能更新当前目录及其当前引用。不得执行 Formal Run、补充业务执行结果、修改产品源码或改变 Expected/Gap 语义。报告中的 TestCaseId 必须全部来自当前正式 Catalog，并使用当前稳定格式。

## 6. 参考注册表

- 功能码：[feature-code-registry.json](../projects/rsscomposer-blackbox/test-cases/catalog/feature-code-registry.json)
- 用例 ID 注册表：[testcase-id-registry.json](../projects/rsscomposer-blackbox/test-cases/catalog/testcase-id-registry.json)
- 本次迁移映射：[TESTCASE_ID_MIGRATION_MAP.json](../projects/rsscomposer-blackbox/test-cases/catalog/TESTCASE_ID_MIGRATION_MAP.json)
- 本次迁移对账：[TESTCASE_ID_MIGRATION_RECONCILIATION.json](../projects/rsscomposer-blackbox/test-cases/catalog/TESTCASE_ID_MIGRATION_RECONCILIATION.json)
