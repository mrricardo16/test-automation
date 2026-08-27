# Resource Lock Model

Every executable TestCase declares one or more `{Resource, Mode}` locks. The canonical modes are `READ`, `SHARED_WRITE`, and `EXCLUSIVE`.

## Compatibility

| Pair on the same resource | Result | Required evidence |
| --- | --- | --- |
| `READ` + `READ` | Parallel | None beyond the read-only contract |
| `READ` + `SHARED_WRITE` | Conditional | Project policy explicitly confirms safe coexistence |
| `SHARED_WRITE` + `SHARED_WRITE` | Conditional | Different non-empty `TEST_OWNED` namespaces |
| Any pair containing `EXCLUSIVE` | Serial | Resource ownership and dependency order |

Different resource names do not remove fixture or state dependencies. A shared User fixture, Role fixture, mutable browser session, global configuration toggle, task queue, process state, map, DummyCar, WCS mock, or feedback mock must be represented as a lock or dependency.

The default registry may include `AUTH_SESSION`, `USER_DATA`, `ROLE_DATA`, `PERMISSION_DATA`, `MENU_DATA`, `DICT_DATA`, `EXTERNAL_CONFIG`, `VEHICLE_CONFIG`, `TEMPLATE_DATA`, `LOG_READ`, `STAT_READ`, `DOWNLOAD_DIR`, `FILE_UPLOAD`, `ACTIVE_MAP`, `MAP_EDIT`, `STRATEGY_RUNTIME`, `PROCESS_STATE`, `DUMMYCAR`, `TASK_QUEUE`, `TASK_DISPATCH`, `TASK_STATE_MACHINE`, `WCS_MOCK`, `FEEDBACK_MOCK`, `GLOBAL_CONFIG`, `GLOBAL_CLEANUP`, and `FINAL_REPORT`. Projects may extend the registry without changing the three lock modes.

Lock validation must reject missing modes, missing resources, same-namespace mutable writes presented as parallel-safe, and any exclusive conflict. If a parallel run produces pollution or a race, downgrade the affected resource to serial and retain the evidence.
