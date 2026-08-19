# Black-box execution contract

`TEST-EXECUTION` consumes a `DEV-TEST-HANDOFF` pack and a separately supplied runtime. The Handoff is the approved Expected Design Baseline and is read-only. Runtime observations are evidence; they do not rewrite Expected.

## Input contract

Required: `handoff_root`, `runtime`, and `output_root`. The intake order is `00-TEST-WORKFLOW.md` followed by every related document. Required metadata is Handoff Version, Environment, RunId, Generation Time, and TestCase Baseline.

Optional: credentials from environment variables/ignored local configuration/secret store, existing TestCases, reports, automation, scope, priority filter, test-layer filter, browser, and environment notes.

## Handoff completeness

Missing Handoff documents, IDs, scope, Preconditions, Test Data, or Expected Result create `HANDOFF_INCOMPLETE`. Block the affected case or run and record the missing item. Never infer a business rule from product source or from a convenient runtime result.

## Immutable baseline

Every runtime conflict is recorded in `design-runtime-mismatch.md` with Handoff ID, Expected, Actual, evidence, and classification `DESIGN_RUNTIME_MISMATCH`. Do not edit Handoff Expected to obtain PASS.

## Prohibited actions

Do not modify product source, product testability hooks, Handoff Expected, production data, secrets, or unrelated repositories. Do not fix a suspected product bug in the automation repository. Do not generate Word output as part of execution.
