# Coverage Contract

Coverage 描述目标是否被覆盖，不描述产品执行结果。

```text
ApplicabilityStatus: APPLICABLE | NOT_APPLICABLE | CONDITIONAL | UNKNOWN
CoverageStatus: COVERED | PARTIAL | UNTESTED | MANUAL | NOT_APPLICABLE
```

规则：

- `NOT_APPLICABLE` 必须同时有原因。
- `CONDITIONAL` 必须有条件；条件未满足时不得报告 PASS。
- `BASELINE_LIMITED` 可以产生有限范围 Coverage，但报告必须显示限制。
- 非侵入式 Code Coverage 只能使用测试仓库拥有的采集方式，不得修改、注入、替换或重编译真实产品。

旧 Coverage 值由 `LegacyFieldAdapter` 映射为新的 Execution/Coverage 组合，旧 FAIL、ERROR、BLOCKED 不得被映射成 PASS。
