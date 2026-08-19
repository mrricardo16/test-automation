import { test, expect } from '@playwright/test';
import { startApiHarness, type ApiHarness } from './api-fixtures';

let harness: ApiHarness;

test.beforeAll(async () => {
  harness = await startApiHarness();
});
test.afterAll(async () => {
  await harness.close();
});

test.beforeEach(async () => {
  await harness.reset();
});

test('TC-SYN-API-BOUNDARY-001 verifies validation state and feature flag boundaries', async () => {
  const admin = await harness.login('admin', 'TC-SYN-API-BOUNDARY-001');
  const headers = { authorization: `Bearer ${admin.token}` };
  const cases = [
    { name: 'required', data: {}, status: 400 },
    { name: 'empty', data: { name: '' }, status: 400 },
    { name: 'null', data: { name: null }, status: 400 },
    { name: 'maximum', data: { name: 'x'.repeat(50) }, status: 201 },
    { name: 'over-limit', data: { name: 'x'.repeat(51) }, status: 400 },
  ] as const;

  for (const boundary of cases) {
    const result = await harness.request({
      testCaseId: 'TC-SYN-API-BOUNDARY-001',
      method: 'POST',
      path: '/items',
      headers,
      data: boundary.data,
      expectedStatus: boundary.status,
      validateBody: (body) => boundary.status === 201
        ? body?.item?.name === boundary.data.name
        : body?.error?.code === 'VALIDATION_ERROR',
      failureCategory: 'FAIL_API_BUSINESS_RULE',
    });
    expect(result.executionResult.ExecutionStatus, boundary.name).toBe('PASS');
  }

  const created = await harness.request({
    testCaseId: 'TC-SYN-API-BOUNDARY-001',
    method: 'POST',
    path: '/items',
    headers,
    data: { name: 'State Boundary' },
    expectedStatus: 201,
    validateBody: (body) => typeof body?.item?.id === 'string',
  });
  const itemId = created.body.item.id as string;
  const invalidTransition = await harness.request({
    testCaseId: 'TC-SYN-API-BOUNDARY-001',
    method: 'PATCH',
    path: `/items/${itemId}/state`,
    headers,
    data: { status: 'approved' },
    expectedStatus: 409,
    validateBody: (body) => body?.error?.code === 'INVALID_STATE_TRANSITION',
    failureCategory: 'FAIL_API_BUSINESS_RULE',
  });
  expect(invalidTransition.executionResult.ExecutionStatus).toBe('PASS');

  const flags = await harness.request({
    testCaseId: 'TC-SYN-API-BOUNDARY-001',
    method: 'GET',
    path: '/feature-flags',
    expectedStatus: 200,
    validateBody: (body) => body?.newDashboard === false,
  });
  expect(flags.executionResult.ExecutionStatus).toBe('PASS');

  const disabledPreview = await harness.request({
    testCaseId: 'TC-SYN-API-BOUNDARY-001',
    method: 'GET',
    path: '/feature-flags/new-dashboard/preview',
    expectedStatus: 403,
    validateBody: (body) => body?.error?.code === 'FEATURE_DISABLED',
    failureCategory: 'FAIL_API_BUSINESS_RULE',
  });
  expect(disabledPreview.executionResult.ExecutionStatus).toBe('PASS');
});
