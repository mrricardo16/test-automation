import { test, expect, request } from '@playwright/test';

type RuntimeHandle = {
  pid: number;
  baseUrl: string;
  apiBaseUrl: string;
  ownedProcess: true;
  shutdownVerified: boolean;
  close: () => Promise<void>;
};

let runtime: RuntimeHandle;
let startSyntheticRuntime: () => Promise<RuntimeHandle>;

async function resetSyntheticData(): Promise<void> {
  const context = await request.newContext();
  const response = await context.post(`${runtime.baseUrl}/__control/reset`, {
    headers: { 'x-synthetic-control': 'reset-only' },
  });
  expect(response.status()).toBe(200);
  await context.dispose();
}

async function login(
  context: Awaited<ReturnType<typeof request.newContext>>,
  username = 'admin',
): Promise<string> {
  const response = await context.post(`${runtime.apiBaseUrl}/auth/login`, {
    data: { username, password: 'test-only-password' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toMatch(/^synthetic-token-/);
  return body.token as string;
}

test.beforeAll(async () => {
  ({ startSyntheticRuntime } = await import('../../scripts/platform/synthetic-runtime.mjs'));
  runtime = await startSyntheticRuntime();
});

test.afterAll(async () => {
  await runtime.close();
  expect(runtime.shutdownVerified).toBe(true);
});

test('TC-SYN-ENV-001 verifies dynamic health and test-owned process lifecycle', async () => {
  const context = await request.newContext();
  const response = await context.get(`${runtime.baseUrl}/health`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
  expect(body.runtime).toBe('synthetic-product');
  expect(body.pid).toBe(runtime.pid);
  expect(runtime.ownedProcess).toBe(true);
  expect(new URL(runtime.baseUrl).hostname).toBe('127.0.0.1');
  expect(new URL(runtime.baseUrl).port).not.toBe('8223');
  await context.dispose();
});

test('TC-SYN-AUTH-001 verifies login and protected resource behavior', async () => {
  const context = await request.newContext();
  const unauthenticated = await context.get(`${runtime.apiBaseUrl}/items`);
  expect(unauthenticated.status()).toBe(401);
  const invalid = await context.post(`${runtime.apiBaseUrl}/auth/login`, {
    data: { username: 'admin', password: 'wrong-test-password' },
  });
  expect(invalid.status()).toBe(401);
  const token = await login(context);
  const authenticated = await context.get(`${runtime.apiBaseUrl}/items`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(authenticated.status()).toBe(200);
  await context.dispose();
});

test('TC-SYN-CRUD-001 verifies create, list, update, delete, and reset', async () => {
  await resetSyntheticData();
  const context = await request.newContext();
  const token = await login(context);
  const headers = { authorization: `Bearer ${token}` };
  const created = await context.post(`${runtime.apiBaseUrl}/items`, {
    headers,
    data: { name: 'Temporary Item', status: 'draft' },
  });
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  const itemId = createdBody.item.id as string;
  const listed = await context.get(`${runtime.apiBaseUrl}/items`, { headers });
  expect((await listed.json()).items.some((item: { id: string }) => item.id === itemId)).toBe(true);
  const updated = await context.patch(`${runtime.apiBaseUrl}/items/${itemId}`, {
    headers,
    data: { name: 'Updated Item' },
  });
  expect(updated.status()).toBe(200);
  const deleted = await context.delete(`${runtime.apiBaseUrl}/items/${itemId}`, { headers });
  expect(deleted.status()).toBe(204);
  await context.dispose();
  await resetSyntheticData();
  const afterReset = await request.newContext();
  const resetToken = await login(afterReset);
  const resetList = await afterReset.get(`${runtime.apiBaseUrl}/items`, {
    headers: { authorization: `Bearer ${resetToken}` },
  });
  expect((await resetList.json()).items).toEqual([
    { id: 'item-001', name: 'Seed Item', status: 'draft' },
  ]);
  await afterReset.dispose();
});

test('TC-SYN-VALIDATION-001 verifies required and boundary validation', async () => {
  await resetSyntheticData();
  const context = await request.newContext();
  const token = await login(context);
  const headers = { authorization: `Bearer ${token}` };
  const missing = await context.post(`${runtime.apiBaseUrl}/items`, { headers, data: {} });
  expect(missing.status()).toBe(400);
  expect((await missing.json()).error.code).toBe('VALIDATION_ERROR');
  const tooLong = await context.post(`${runtime.apiBaseUrl}/items`, {
    headers,
    data: { name: 'x'.repeat(51) },
  });
  expect(tooLong.status()).toBe(400);
  const list = await context.get(`${runtime.apiBaseUrl}/items`, { headers });
  expect((await list.json()).items).toHaveLength(1);
  await context.dispose();
});

test('TC-SYN-PERMISSION-001 verifies viewer read and admin write permissions', async () => {
  await resetSyntheticData();
  const context = await request.newContext();
  const viewerToken = await login(context, 'viewer');
  const viewerHeaders = { authorization: `Bearer ${viewerToken}` };
  expect((await context.get(`${runtime.apiBaseUrl}/items`, { headers: viewerHeaders })).status()).toBe(200);
  const denied = await context.post(`${runtime.apiBaseUrl}/items`, {
    headers: viewerHeaders,
    data: { name: 'Denied Item' },
  });
  expect(denied.status()).toBe(403);
  const adminToken = await login(context, 'admin');
  const allowed = await context.post(`${runtime.apiBaseUrl}/items`, {
    headers: { authorization: `Bearer ${adminToken}` },
    data: { name: 'Allowed Item' },
  });
  expect(allowed.status()).toBe(201);
  await context.dispose();
});

test('TC-SYN-STATE-001 verifies allowed and rejected state transitions', async () => {
  await resetSyntheticData();
  const context = await request.newContext();
  const token = await login(context);
  const headers = { authorization: `Bearer ${token}` };
  const created = await context.post(`${runtime.apiBaseUrl}/items`, {
    headers,
    data: { name: 'State Item' },
  });
  const itemId = (await created.json()).item.id as string;
  const rejected = await context.patch(`${runtime.apiBaseUrl}/items/${itemId}/state`, {
    headers,
    data: { status: 'approved' },
  });
  expect(rejected.status()).toBe(409);
  const submitted = await context.patch(`${runtime.apiBaseUrl}/items/${itemId}/state`, {
    headers,
    data: { status: 'submitted' },
  });
  expect(submitted.status()).toBe(200);
  const approved = await context.patch(`${runtime.apiBaseUrl}/items/${itemId}/state`, {
    headers,
    data: { status: 'approved' },
  });
  expect(approved.status()).toBe(200);
  await context.dispose();
});

test('TC-SYN-FLAG-001 verifies feature flag state and disabled preview', async () => {
  const context = await request.newContext();
  const flags = await context.get(`${runtime.apiBaseUrl}/feature-flags`);
  expect(flags.status()).toBe(200);
  expect((await flags.json()).newDashboard).toBe(false);
  const preview = await context.get(`${runtime.apiBaseUrl}/feature-flags/new-dashboard/preview`);
  expect(preview.status()).toBe(403);
  await context.dispose();
});

test('TC-SYN-ERROR-001 verifies a controlled sanitized server error', async () => {
  const context = await request.newContext();
  const response = await context.get(`${runtime.apiBaseUrl}/faults/500`);
  expect(response.status()).toBe(500);
  const body = await response.json();
  expect(body.error.code).toBe('SYNTHETIC_CONTROLLED_ERROR');
  expect(JSON.stringify(body)).not.toMatch(/stack|password|token|cookie/i);
  await context.dispose();
});

test('TC-SYN-BUG-001 verifies the known bug is available for future EXPECT_PRODUCT_FAIL', async () => {
  const context = await request.newContext();
  const response = await context.get(`${runtime.apiBaseUrl}/bugs/known`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.knownBug).toBe(true);
  expect(body.bugId).toBe('SYN-BUG-001');
  expect(body.expected).toBe('enabled');
  expect(body.actual).toBe('disabled');
  await context.dispose();
});

test('TC-SYN-MANUAL-001 represents a manual-only non-automatable boundary', async () => {
  const context = await request.newContext();
  const boundary = await context.get(`${runtime.apiBaseUrl}/manual-only`);
  expect(boundary.status()).toBe(200);
  const body = await boundary.json();
  expect(body.automationStatus).toBe('MANUAL');
  expect(body.reason).toMatch(/visual|OS/i);
  const page = await context.get(`${runtime.baseUrl}/manual-only`);
  expect(page.status()).toBe(200);
  expect(await page.text()).toMatch(/手工|manual/i);
  await context.dispose();
});
