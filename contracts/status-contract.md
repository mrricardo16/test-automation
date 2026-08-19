# Status Contract

## ExecutionStatus

执行结果只能使用：`PASS`、`FAIL`、`ERROR`、`BLOCKED`、`MANUAL`、`SKIPPED`。

`NOT_APPLICABLE` 不属于执行状态。是否适用由 `ApplicabilityStatus` 表示，覆盖情况由 `CoverageStatus` 表示。

## ApplicabilityStatus

- `APPLICABLE`：场景适用于当前环境和范围。
- `NOT_APPLICABLE`：场景明确不适用，必须填写 `ApplicabilityReason`。
- `CONDITIONAL`：满足条件后才适用，必须填写 `ApplicabilityCondition`。
- `UNKNOWN`：当前资料不足，不能假设适用或不适用。

## CoverageStatus

`COVERED`、`PARTIAL`、`UNTESTED`、`MANUAL`、`NOT_APPLICABLE`。

## BaselineStatus

`BASELINE_VALIDATED` 表示基线证据完整；`BASELINE_LIMITED` 表示可执行但范围受限；`BASELINE_INCOMPLETE` 表示 Baseline Gate 不通过。

## GateStatus

`PASS`、`LIMITED`、`FAIL` 只表示 Gate 的质量结论，不改写实际 `ExecutionStatus`。

对于预置已知缺陷：实际执行必须保持 `ExecutionStatus=FAIL`；只有在证据证明该失败与 `EXPECT_PRODUCT_FAIL` 匹配时，Acceptance Gate 才能为 `GateStatus=PASS`。
