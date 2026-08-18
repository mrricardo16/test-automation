# Coverage Contract

Coverage completion is defined by applicable dimensions, not by test count.

| Dimension | Required assessment |
|---|---|
| Feature | Every in-scope feature has a coverage record. |
| Happy path | Applicable primary flow is covered. |
| Business rule | Every P0/P1 rule is covered or explicitly blocked/unknown. |
| Validation/boundary | Applicable required, format, range, enum, duplicate, and cross-field behavior is assessed. |
| Permission | Authentication, authorization, route/menu/button controls are assessed where applicable. |
| State transition | Legal, illegal, repeated, and terminal transitions are assessed where applicable. |
| Error path | Known validation, business, HTTP, empty, unauthorized, forbidden, not-found, and server behaviors are assessed. |
| API contract | Applicable request/response/status contracts are assessed. |
| UI observable result | Entry markers and success/error/empty states are assessed for UI features. |
| Data consistency | Applicable created/updated/deleted state and relationships are assessed. |

## Default policy

`DEFAULT_TEST_POLICY`: P0 required 100%; P1 target at least 90%; P2 best effort. Override only with explicit project policy. Record `NOT_APPLICABLE`, `UNKNOWN`, `BLOCKED`, or `MANUAL` rather than silently omitting a dimension.
