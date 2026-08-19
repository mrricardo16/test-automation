# Baseline Validation Gate

Before Coverage/TestCase creation, verify supplied-source inventory, module/entry/API inventory, behavior/rule/validation/state/permission/error-path facts, mapping, testability/risk, and unknown register. Record exactly one result:

`BASELINE_VALIDATED` when applicable inventory facts and evidence exist; otherwise `BASELINE_INCOMPLETE` with `Missing`, `Reason`, `Impact`, and affected scope. An incomplete baseline may produce only explicitly limited coverage and cannot be silently completed with guesses.
