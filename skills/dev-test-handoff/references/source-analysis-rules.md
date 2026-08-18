# Source Analysis Rules

## Repository inventory

Scan all supplied roots before selecting implementation files. Identify every solution/project/package/app/service, not just the first match. Record excluded paths and the reason for exclusion. A missing source side is a scope fact, not a failure.

## Framework-neutral signals

### Frontend

Look for package manifests, build tooling, router definitions, route guards, layouts, pages/views, components, state stores, HTTP clients, API wrappers, form validators, auth/permission checks, menu definitions, and observable UI markers. Do not assume Vue, React, Angular, a specific UI library, or a particular test framework.

### Backend

Look for solution/project entry points, controllers, minimal APIs, handlers, services, repositories, ORM mappings, DTOs, entities, validators, authentication/authorization policies, external integrations, background services, and error middleware. Describe only layers that exist.

## Six passes

1. **Structure:** enumerate roots, projects, technology signals, entry points, and dependencies.
2. **Entry:** enumerate routes, redirects, menus, controllers, minimal API routes, handlers, methods, and auth gates.
3. **Module:** group observed entries into stable modules and features; cite the grouping evidence.
4. **Behavior:** trace branches, input constraints, state transitions, rules, permissions, errors, and data relationships.
5. **Mapping:** connect page → frontend API → HTTP → backend endpoint/handler → service/data/external dependency. Use `CONFIRMED`, `PROBABLE`, or `UNMATCHED` only for mapping status; do not call an unmatched item a bug.
6. **Completeness:** check inventories, confidence, unknown register, gate requirements, and sanitization.

## Partial and multi-project scope

- Frontend-only: generate frontend facts; backend fields are `NOT_PROVIDED` or `UNKNOWN` based on the specific question. Do not invent API behavior.
- Backend-only: generate backend/API facts; UI entry and locator fields are `NOT_PROVIDED` or `UNKNOWN`. Do not invent page behavior.
- Multiple frontend apps or backend services: preserve project/service ownership and map cross-boundary evidence explicitly.
- No visible frontend caller for an API or no visible backend match for a frontend API: record the item and its mapping state; do not label it a defect.

## Behavior and evidence

Translate implementation into externally observable behavior only when the source supports that translation. Keep literal comparisons separate from business semantics. Capture feature flags, configuration gates, role gates, environment gates, and external dependencies because absence or blocking can be a valid runtime outcome.
