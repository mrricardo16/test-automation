# Cleanup Ownership

Use a two-level cleanup model:

1. **Worker cleanup:** delete or disable only fixtures whose recorded owner is the current `WorkerId` and whose namespace includes the current `RunId` and `WorkerId`. Record `OwnedFixtureCount`, `DeletedFixtureCount`, `ResidualCount`, and `CleanupEvidence`.
2. **Global cleanup:** after all workers and stateful cases close, scan all run namespaces. Delete only data with a proven current-run owner; preserve ownership-unknown data and report it as a residual/safety issue.

`PersistentTestInfrastructure` (for example a reusable test map, mock service configuration, reusable template, or explicitly reusable DummyCar record) is not ordinary worker fixture data. It requires an explicit owner, lifecycle, and safe teardown policy. Stateful workers normally create their own `TEST_OWNED` fixtures rather than reusing mutable worker fixtures.

The safe namespace shape is `AT_<RunId>_<WorkerId>_<Object>`. Never use a broad prefix scan such as `AT_<RunId>_*` from a worker. A namespace collision, cross-worker deletion, unknown owner, open BrowserContext, held resource lock, or non-zero unexpected residual fails the cleanup gate and prevents the stateful lane or final report from being declared clean.
