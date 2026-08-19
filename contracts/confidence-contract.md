# Confidence Contract

- `CONFIRMED_FROM_CODE`：直接由源代码或配置确认。
- `CONFIRMED_FROM_RUNTIME`：由受控运行时观察确认。
- `INFERRED`：由多个证据推断，尚未直接确认。
- `UNKNOWN`：没有足够证据。

Runtime Observation 是 Actual/Observation Evidence，不是 ExpectedBasis。它不能把 `UNKNOWN` 或推断结果自动提升为 requirements compliance。
