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

test('TC-SYN-API-ERRORS-001 verifies HTTP error contracts and expected product failure', async () => {
  const admin = await harness.login('admin', 'TC-SYN-API-ERRORS-001');
  const headers = { authorization: `Bearer ${admin.token}` };

  const badRequest = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'POST',
    path: '/items',
    headers,
    data: {},
    expectedStatus: 400,
    validateBody: (body) => body?.error?.code === 'VALIDATION_ERROR',
    failureCategory: 'FAIL_API_CONTRACT',
  });
  expect(badRequest.executionResult.ExecutionStatus).toBe('PASS');

  const notFound = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'GET',
    path: '/items/item-999',
    headers,
    expectedStatus: 404,
    validateBody: (body) => body?.error?.code === 'NOT_FOUND',
    failureCategory: 'FAIL_API_STATUS',
  });
  expect(notFound.executionResult.ExecutionStatus).toBe('PASS');

  const created = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'POST',
    path: '/items',
    headers,
    data: { name: 'Conflict Item' },
    expectedStatus: 201,
    validateBody: (body) => typeof body?.item?.id === 'string',
  });
  const itemId = created.body.item.id as string;
  const conflict = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'PATCH',
    path: `/items/${itemId}/state`,
    headers,
    data: { status: 'approved' },
    expectedStatus: 409,
    validateBody: (body) => body?.error?.code === 'INVALID_STATE_TRANSITION',
    failureCategory: 'FAIL_API_BUSINESS_RULE',
  });
  expect(conflict.executionResult.ExecutionStatus).toBe('PASS');

  const serverError = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'GET',
    path: '/faults/500',
    expectedStatus: 500,
    validateBody: (body) => body?.error?.code === 'SYNTHETIC_CONTROLLED_ERROR',
    failureCategory: 'FAIL_API_STATUS',
  });
  expect(serverError.executionResult.ExecutionStatus).toBe('PASS');

  const knownBug = await harness.request({
    testCaseId: 'TC-SYN-API-ERRORS-001',
    method: 'GET',
    path: '/bugs/known',
    expectedStatus: 200,
    validateBody: (body) => body?.bugId === 'SYN-BUG-001' && body.expected === body.actual,
    acceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
    gateStatus: 'PASS',
    failureCategory: 'FAIL_API_BUSINESS_RULE',
  });
  expect(knownBug.executionResult.ExecutionStatus).toBe('FAIL');
  expect(knownBug.executionResult.AcceptanceExpectation).toBe('EXPECT_PRODUCT_FAIL');
  expect(knownBug.executionResult.GateStatus).toBe('PASS');
  expect(knownBug.body.actual).toBe('disabled');
});
