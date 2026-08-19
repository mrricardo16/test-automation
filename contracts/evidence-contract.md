# Evidence Contract

每个执行结果至少关联 `EvidenceIds`。Runtime Observation 单独关联 `ObservationEvidenceIds`。

Observation Evidence 至少包含：

```text
EvidenceId
ObservationType
ObservedAt
Source
Payload
```

Payload 必须经过脱敏。不得保存密码、Token、Cookie、Authorization、私有配置值或不必要的真实业务数据。

Evidence 只证明 Actual/Observation，不改变 ExpectedBasis，也不把实现行为自动提升为需求符合性。
