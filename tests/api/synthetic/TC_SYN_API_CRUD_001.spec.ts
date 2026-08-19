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

test('TC-SYN-API-CRUD-001 executes GET POST PATCH DELETE with consistent reads', async () => {
  const admin = await harness.login('admin', 'TC-SYN-API-CRUD-001');
  const headers = { authorization: `Bearer ${admin.token}` };

  const created = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'POST',
    path: '/items',
    headers,
    data: { name: 'API CRUD Item' },
    expectedStatus: 201,
    validateBody: (body) => body?.item?.name === 'API CRUD Item' && body.item.status === 'draft',
  });
  expect(created.executionResult.ExecutionStatus).toBe('PASS');
  const itemId = created.body.item.id as string;

  const listed = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'GET',
    path: '/items',
    headers,
    expectedStatus: 200,
    validateBody: (body) => body?.items?.some((item: { id: string }) => item.id === itemId) === true,
  });
  expect(listed.executionResult.ExecutionStatus).toBe('PASS');

  const updated = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'PATCH',
    path: `/items/${itemId}`,
    headers,
    data: { name: 'API CRUD Item Updated' },
    expectedStatus: 200,
    validateBody: (body) => body?.item?.id === itemId && body.item.name === 'API CRUD Item Updated',
  });
  expect(updated.executionResult.ExecutionStatus).toBe('PASS');

  const readAfterUpdate = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'GET',
    path: '/items',
    headers,
    expectedStatus: 200,
    validateBody: (body) => body?.items?.some((item: { id: string; name: string }) => item.id === itemId && item.name === 'API CRUD Item Updated') === true,
  });
  expect(readAfterUpdate.executionResult.ExecutionStatus).toBe('PASS');

  const deleted = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'DELETE',
    path: `/items/${itemId}`,
    headers,
    expectedStatus: 204,
  });
  expect(deleted.executionResult.ExecutionStatus).toBe('PASS');

  const readAfterDelete = await harness.request({
    testCaseId: 'TC-SYN-API-CRUD-001',
    method: 'GET',
    path: '/items',
    headers,
    expectedStatus: 200,
    validateBody: (body) => body?.items?.some((item: { id: string }) => item.id === itemId) !== true,
  });
  expect(readAfterDelete.executionResult.ExecutionStatus).toBe('PASS');
});
