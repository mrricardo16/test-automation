# Security Sanitization

Sanitize the Handoff projection before exposing it to a source-inaccessible test agent.

## Remove or redact

- Passwords, tokens, cookies, authorization headers, API keys, secrets, private keys, and credential-like values.
- Connection strings containing credentials or host-specific private details.
- Personal local paths, home directories, usernames, machine names, and private shares.
- Private classes/methods, repository internals, ORM/DbContext details, stack traces, source dumps, and implementation-only comments.
- Production identifiers or customer data that are not needed to construct safe test data.

Use generalized statements such as `Authentication configuration exists` or `Sensitive configuration omitted`. Never copy a real value into a sanitized example, even if it appears in source.

## Preserve for testing

Keep externally observable routes, labels, roles/claims/policies, request/response shape, validation behavior, safe error categories, state transitions, feature/environment gates, locator semantics, and runtime observability. Replace private implementation details with a behavior-level description.

## Destructive operations

Mark every delete, disable, reset, clear, remove, permission-change, or irreversible-state operation:

```text
DestructiveOperation = YES
SafeTargetRule = <test-created target rule or UNKNOWN>
Setup = <required setup or UNKNOWN>
Cleanup = <safe cleanup or UNKNOWN>
ForbiddenTarget = existing/production/business data unless explicitly approved
```

Only test-created data may be automatically deleted unless the Handoff explicitly identifies a safe dedicated test fixture. If safety cannot be established, tell the future agent to use `BLOCKED_TEST_DATA` and do not recommend random existing data.

## Sanitization audit

Record that sanitization was applied and list categories removed, without reproducing the removed values. If a suspected secret is found in source, preserve only its safe location/category and recommend secret rotation through the appropriate security process; do not execute, transmit, or commit it.
