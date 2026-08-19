import { request, type APIRequestContext } from '@playwright/test';
import { validateExecutionResult } from '../../../scripts/platform/validate-contracts';
import { writeApiEvidence } from './helpers/api-evidence';

type RuntimeHandle = {
  pid: number;
  baseUrl: string;
  apiBaseUrl: string;
  ownedProcess: true;
  shutdownVerified: boolean;
  close: () => Promise<void>;
};

export type ApiRequestOptions = {
  testCaseId: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  expectedStatus: number;
  headers?: Record<string, string>;
  data?: unknown;
  validateBody?: (body: any) => boolean;
  acceptanceExpectation?: 'EXPECT_PASS' | 'EXPECT_PRODUCT_FAIL' | 'EXPECT_BLOCKED' | 'EXPECT_MANUAL' | 'EXPECT_BASELINE_LIMITED';
  gateStatus?: 'PASS' | 'LIMITED' | 'FAIL';
  failureCategory?: string;
};

export type ApiCallResult = {
  status: number;
  body: any;
  executionResult: Record<string, any>;
  evidenceDirectory: string;
};

export type ApiLoginResult = ApiCallResult & { token?: string };

export type ApiHarness = {
  runtime: RuntimeHandle;
  context: APIRequestContext;
  reset: () => Promise<void>;
  login: (username: 'admin' | 'viewer', testCaseId: string, password?: string) => Promise<ApiLoginResult>;
  request: (options: ApiRequestOptions) => Promise<ApiCallResult>;
  close: () => Promise<void>;
};

function parseBody(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { responseType: 'non-json' };
  }
}

export async function startApiHarness(): Promise<ApiHarness> {
  const { startSyntheticRuntime } = await import('../../../scripts/platform/synthetic-runtime.mjs');
  const runtime = await startSyntheticRuntime({ host: '127.0.0.1', port: 0 }) as RuntimeHandle;
  const context = await request.newContext({ baseURL: runtime.apiBaseUrl });
  try {
    const health = await context.get(`${runtime.baseUrl}/health`);
    const healthBody = await health.json();
    if (health.status() !== 200 || healthBody.status !== 'ok' || healthBody.pid !== runtime.pid || runtime.ownedProcess !== true) {
      throw new Error('Synthetic API runtime health contract failed.');
    }
  } catch (error) {
    await context.dispose();
    await runtime.close();
    throw error;
  }

  async function reset(): Promise<void> {
    const response = await context.post(`${runtime.baseUrl}/__control/reset`, {
      headers: { 'x-synthetic-control': 'reset-only' },
    });
    if (response.status() !== 200) throw new Error(`Synthetic reset failed with status ${response.status()}.`);
  }

  async function call(options: ApiRequestOptions): Promise<ApiCallResult> {
    const started = performance.now();
    let status = 0;
    let body: any = null;
    let failureCategory = options.failureCategory;
    let requestError = false;
    try {
      const response = await context.fetch(`${runtime.apiBaseUrl}${options.path}`, {
        method: options.method,
        headers: options.headers,
        data: options.data,
        failOnStatusCode: false,
      });
      status = response.status();
      body = parseBody(await response.text());
    } catch {
      requestError = true;
      failureCategory = 'ERROR_API_REQUEST';
    }
    const duration = Math.round((performance.now() - started) * 100) / 100;
    const statusMatches = !requestError && status === options.expectedStatus;
    let bodyMatches = true;
    if (statusMatches && options.validateBody) {
      try {
        bodyMatches = options.validateBody(body);
      } catch {
        bodyMatches = false;
        failureCategory = 'FAIL_API_PARSE';
      }
    }
    const executionStatus = requestError ? 'ERROR' : statusMatches && bodyMatches ? 'PASS' : 'FAIL';
    if (executionStatus === 'FAIL' && !failureCategory) failureCategory = bodyMatches ? 'FAIL_API_STATUS' : 'FAIL_API_CONTRACT';
    const executionResult: Record<string, any> = {
      TestCaseId: options.testCaseId,
      ExecutionStatus: executionStatus,
      ApplicabilityStatus: 'APPLICABLE',
      CoverageStatus: 'COVERED',
      ExpectedBasis: 'APPROVED_BASELINE',
      EvidenceIds: [],
      ObservationEvidenceIds: [],
      EnvironmentId: 'SYNTHETIC-RUNTIME',
      GateStatus: options.gateStatus ?? (options.acceptanceExpectation === 'EXPECT_PRODUCT_FAIL' ? 'PASS' : executionStatus === 'PASS' ? 'PASS' : 'FAIL'),
      ...(options.acceptanceExpectation ? { AcceptanceExpectation: options.acceptanceExpectation } : {}),
    };
    const evidence = writeApiEvidence({
      testCaseId: options.testCaseId,
      method: options.method,
      path: options.path,
      expectedStatus: options.expectedStatus,
      actualStatus: status,
      duration,
      executionResult,
      requestBodyPresent: options.data !== undefined,
      responseBody: body,
      failureCategory,
    });
    executionResult.EvidenceIds = evidence.evidenceIds;
    const issues = validateExecutionResult(executionResult);
    if (issues.length > 0) throw new Error(`Invalid API execution result: ${JSON.stringify(issues)}`);
    return { status, body, executionResult, evidenceDirectory: evidence.evidenceDirectory };
  }

  async function login(username: 'admin' | 'viewer', testCaseId: string, password = 'test-only-password'): Promise<ApiLoginResult> {
    const expectedStatus = password === 'test-only-password' ? 200 : 401;
    const result = await call({
      testCaseId,
      method: 'POST',
      path: '/auth/login',
      data: { username, password },
      expectedStatus,
      validateBody: (body) => expectedStatus === 200
        ? typeof body?.token === 'string' && body?.user?.username === username
        : body?.error?.code === 'INVALID_CREDENTIALS',
      failureCategory: 'FAIL_API_AUTHENTICATION',
    });
    return { ...result, token: expectedStatus === 200 ? result.body.token as string : undefined };
  }

  let closed = false;
  return {
    runtime,
    context,
    reset,
    login,
    request: call,
    async close() {
      if (closed) return;
      closed = true;
      let closeError: unknown;
      try {
        await context.dispose();
      } catch (error) {
        closeError = error;
      } finally {
        try {
          await runtime.close();
        } catch (error) {
          closeError ??= error;
        }
      }
      if (closeError) throw closeError;
      if (!runtime.shutdownVerified) throw new Error('Synthetic API runtime shutdown was not verified.');
    },
  };
}
