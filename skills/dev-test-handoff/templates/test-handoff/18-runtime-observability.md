# Runtime Observability

| FeatureId/FlowId | Action | SuccessObservation | StateObservation | ErrorObservation | NetworkObservation | Dialog/Download | StableMarker | Confidence |
|---|---|---|---|---|---|---|---|---|
| `FEAT-/FLOW-<...>` | `<action>` | `<toast/list/result>` | `<visible state>` | `<message/status>` | `<safe method/path/status>` | `<...>` | `<route/title/role/text>` | `<...>` |

Use observable evidence to decide whether an action succeeded. Do not require source access, private logs, or secret-bearing payloads.
