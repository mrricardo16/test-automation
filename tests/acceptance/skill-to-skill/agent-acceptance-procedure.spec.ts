import { test, expect } from '@playwright/test';

let createAgentAcceptanceProcedure: typeof import('./helpers/agent-acceptance-procedure.mjs')['createAgentAcceptanceProcedure'];

test.beforeAll(async () => {
  ({ createAgentAcceptanceProcedure } = await import('./helpers/agent-acceptance-procedure.mjs'));
});

test('TC-SYN-AGENT-001 records blocked automation and a ready controlled procedure', () => {
  const procedure = createAgentAcceptanceProcedure();

  expect(procedure.status).toBe('BLOCKED');
  expect(procedure.reason).toBe('MissingAgentInvocationCapability');
  expect(procedure.procedureStatus).toBe('READY');
  expect(procedure.executionInstructions.length).toBeGreaterThan(0);
  expect(procedure.acceptanceChecklist).toContain('实际调用 dev-test-handoff');
  expect(procedure.expectedArtifacts).toContain('As-Built');
  expect(procedure.validationCommand).toMatch(/validate|self_test/);
});
