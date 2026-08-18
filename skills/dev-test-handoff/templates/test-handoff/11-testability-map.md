# Testability and Locator Map

| Page | ElementPurpose | Role | Label | Placeholder | StableText | Id | ExistingTestId | PreferredLocatorType | LocatorStability | ObservableResult |
|---|---|---|---|---|---|---|---|---|---|---|
| `<page/RouteId>` | `<purpose>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `<...>` | `role/label/placeholder/test-id/text/id/name/CSS` | `STRONG/MEDIUM/WEAK` | `<...>` |

Prefer role, label, placeholder, existing test id, stable visible text, then stable id/name. Avoid DOM index, absolute XPath, dynamic class, and coordinates. Provide semantics, not Playwright code.
