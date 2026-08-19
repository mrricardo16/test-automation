import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
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

test('TC-SYN-API-AUTH-001 separates authentication from authorization', async () => {
  const unauthenticated = await harness.request({
    testCaseId: 'TC-SYN-API-AUTH-001',
    method: 'GET',
    path: '/items',
    expectedStatus: 401,
    validateBody: (body) => body?.error?.code === 'UNAUTHORIZED',
    failureCategory: 'FAIL_API_AUTHORIZATION',
  });
  expect(unauthenticated.executionResult.ExecutionStatus).toBe('PASS');

  const invalidLogin = await harness.login('admin', 'TC-SYN-API-AUTH-001', 'wrong-test-password');
  expect(invalidLogin.executionResult.ExecutionStatus).toBe('PASS');
  expect(invalidLogin.status).toBe(401);
  expect(invalidLogin.body.error.code).toBe('INVALID_CREDENTIALS');
  const invalidLoginEvidence = readFileSync(`${invalidLogin.evidenceDirectory}/response-summary.json`, 'utf8');
  expect(invalidLoginEvidence).not.toMatch(/authorization|cookie|set-cookie|token|password|secret|connectionstring/i);

  const viewer = await harness.login('viewer', 'TC-SYN-API-AUTH-001');
  expect(viewer.executionResult.ExecutionStatus).toBe('PASS');
  const viewerHeaders = { authorization: `Bearer ${viewer.token}` };

  const viewerRead = await harness.request({
    testCaseId: 'TC-SYN-API-AUTH-001',
    method: 'GET',
    path: '/items',
    headers: viewerHeaders,
    expectedStatus: 200,
    validateBody: (body) => Array.isArray(body?.items),
  });
  expect(viewerRead.executionResult.ExecutionStatus).toBe('PASS');

  const viewerWrite = await harness.request({
    testCaseId: 'TC-SYN-API-AUTH-001',
    method: 'POST',
    path: '/items',
    headers: viewerHeaders,
    data: { name: 'Viewer Write' },
    expectedStatus: 403,
    validateBody: (body) => body?.error?.code === 'FORBIDDEN',
    failureCategory: 'FAIL_API_AUTHORIZATION',
  });
  expect(viewerWrite.executionResult.ExecutionStatus).toBe('PASS');

  const admin = await harness.login('admin', 'TC-SYN-API-AUTH-001');
  expect(admin.executionResult.ExecutionStatus).toBe('PASS');
  const adminWrite = await harness.request({
    testCaseId: 'TC-SYN-API-AUTH-001',
    method: 'POST',
    path: '/items',
    headers: { authorization: `Bearer ${admin.token}` },
    data: { name: 'Admin Write' },
    expectedStatus: 201,
    validateBody: (body) => body?.item?.name === 'Admin Write',
  });
  expect(adminWrite.executionResult.ExecutionStatus).toBe('PASS');
});
