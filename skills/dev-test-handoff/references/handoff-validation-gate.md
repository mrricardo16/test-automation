# Handoff Validation Gate

Run this gate after Stage B has been rendered from the validated As-Built baseline.

## Integrity contract

Freeze the completed package with repository `HANDOFF-SHA256-V1` from `contracts/handoff-integrity-contract.md`. The Producer must use `scripts/platform/handoff-integrity.mjs`. Exclude only the two contract envelope files; do not rewrite protected content during hashing.

## Feature completeness

For every P0/P1 feature, record an explicit value for each applicable dimension:

```text
Entry
ExpectedBehavior
BusinessRule
BusinessFlow
Validation
Permission
State
API
TestData
ErrorBehavior
Priority
SuggestedTestLayer
```

Use `NOT_APPLICABLE` only when the dimension genuinely does not apply. Use `UNKNOWN` when the design baseline lacks evidence. Never leave a field blank for a black-box agent to guess.

## Projection integrity

- Every Handoff `MOD-`, `FEAT-`, `RULE-`, `FLOW-`, `API-`, `VALID-`, and `STATE-` ID exists in As-Built with the same spelling.
- Handoff confidence equals the As-Built confidence or is more cautious; it never becomes more certain.
- Handoff does not introduce a rule, expected result, permission, state meaning, or API behavior absent from As-Built.
- `UNKNOWN` remains `UNKNOWN`.
- `INFERRED` remains `INFERRED`.

## Test-layer recommendations

Use the smallest appropriate layer recommendation:

| Layer | Use for |
|---|---|
| `WEB_UI` | Page navigation, visible controls, form interaction, route/menu behavior, and observable UI results. |
| `API` | Request/response contracts, validation, authorization, and business behavior observable without UI. |
| `BOTH` | Critical end-to-end behavior where UI initiation and API/data outcome both matter. |
| `MANUAL` | Canvas/pixel fidelity, native shell behavior, unstable selectors, or behavior requiring human judgment. |

Recommend a layer; do not write test code or TestCases.

## Runtime mismatch

If supplied runtime evidence contradicts the design baseline, add:

```text
DESIGN_RUNTIME_MISMATCH
Design baseline: <ID and expected design statement>
Runtime evidence: <report/evidence reference>
Observed difference: <neutral description>
```

Do not silently replace the design with runtime behavior.
